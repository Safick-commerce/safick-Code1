// =============================================================================
// Payout Service — seller cashin + buyer refund
// =============================================================================
// When an order completes (buyer confirm OR 7-day auto-release), this module
// creates a `payouts` row, calls Maviance cashin to the seller's MoMo / Orange
// destination, and updates the row with the result. Failures retry up to 3
// times (handled by the reconciliation cron, not here).
//
// Refunds use the SAME table with destination.type = "buyer_refund" — Maviance
// does not have a first-class refund API for already-collected mobile money,
// so we reverse-cashin to the buyer's payer_phone.
// =============================================================================

import { randomUUID } from "node:crypto";
import { Prisma } from "../generated/prisma";
import { prisma } from "../config/database";
import { AppError } from "../middleware/errorHandler";
import * as maviance from "./maviance.service";

interface QueuePayoutInput {
  orderId: string;
  // Optional override for refunds. If absent, we resolve from the order's seller.
  destination?: PayoutDestination;
}

export type PayoutDestination =
  | { type: "mtn_momo"; number: string }
  | { type: "orange_money"; number: string }
  | { type: "buyer_refund"; number: string; operator: "mtn" | "orange" };

function destinationToServiceOperator(dest: PayoutDestination): "mtn" | "orange" | null {
  if (dest.type === "mtn_momo") return "mtn";
  if (dest.type === "orange_money") return "orange";
  if (dest.type === "buyer_refund") return dest.operator;
  return null;
}

function destinationPhone(dest: PayoutDestination): string {
  return dest.number;
}

async function resolveSellerDestination(sellerId: string): Promise<PayoutDestination> {
  const seller = await prisma.profiles.findUnique({
    where: { id: sellerId },
    select: {
      payout_momo_number: true,
      payout_momo_operator: true,
    },
  });
  if (!seller) {
    throw new AppError("Seller not found for payout.", 404);
  }
  if (seller.payout_momo_number && seller.payout_momo_operator) {
    const operator = seller.payout_momo_operator;
    if (operator === "mtn") {
      return { type: "mtn_momo", number: seller.payout_momo_number };
    }
    if (operator === "orange") {
      return { type: "orange_money", number: seller.payout_momo_number };
    }
  }
  throw new AppError(
    "Seller has no payout destination configured. Ask them to add MoMo details in settings.",
    409,
  );
}

/**
 * Create or reuse a payout row for an order, then attempt cashin. If the
 * Maviance call fails, the row is left in `failed` for the reconciliation
 * cron to retry.
 */
export async function queueSellerPayout(input: QueuePayoutInput): Promise<void> {
  const order = await prisma.orders.findUnique({
    where: { id: input.orderId },
    select: { id: true, seller_id: true, subtotal_xaf: true, status: true },
  });
  if (!order) {
    throw new AppError("Order not found for payout.", 404);
  }
  if (order.status !== "completed") {
    throw new AppError(
      `Cannot pay out an order that is ${order.status}. Expected completed.`,
      409,
    );
  }

  // Prevent duplicate payouts (defence in depth — the state machine should
  // already block this, but the payout table is the source of truth for money).
  const existing = await prisma.payouts.findFirst({
    where: { order_id: order.id, status: { in: ["queued", "processing", "paid"] } },
  });
  if (existing) {
    return;
  }

  const destination = input.destination ?? (await resolveSellerDestination(order.seller_id));
  const operator = destinationToServiceOperator(destination);
  if (!operator) {
    throw new AppError("Invalid payout destination.", 422);
  }

  const trid = `payout_${randomUUID()}`;
  const serviceId = maviance.getCashinServiceId(operator);
  const amountXaf = Number(order.subtotal_xaf);

  const payout = await prisma.payouts.create({
    data: {
      order_id: order.id,
      seller_id: order.seller_id,
      amount_xaf: new Prisma.Decimal(amountXaf),
      destination: destination as unknown as Prisma.InputJsonValue,
      maviance_disbursement_ref: trid,
      maviance_service_id: serviceId,
      status: "queued",
    },
  });

  try {
    const result = await maviance.cashin({
      serviceId,
      payerPhoneOrAccount: destinationPhone(destination),
      amountXaf,
      trid,
    });
    await prisma.payouts.update({
      where: { id: payout.id },
      data: {
        maviance_ptn: result.ptn || null,
        status:
          result.status === "PAID"
            ? "paid"
            : result.status === "FAILED"
              ? "failed"
              : "processing",
        failure_reason: result.message ?? null,
        paid_at: result.status === "PAID" ? new Date() : null,
      },
    });
  } catch (err) {
    await prisma.payouts.update({
      where: { id: payout.id },
      data: {
        status: "failed",
        failure_reason: err instanceof Error ? err.message : "cashin_call_failed",
      },
    });
    // Do NOT rethrow — the order is completed regardless of the payout outcome.
    // The reconciliation cron will retry; on-call sees `payouts.status=failed`.
    console.error(`[payout.queueSellerPayout] orderId=${order.id} failed`, err);
  }
}

interface QueueRefundInput {
  orderId: string;
  buyerId: string;
  buyerPhone: string | null;
  amountXaf: number;
}

/**
 * Create a refund payout row for a buyer and attempt cashin to their MoMo
 * number. We default to MTN MoMo when the operator can't be inferred from
 * the buyer's payer_phone — ops can override the destination JSON manually
 * for edge cases (e.g. Orange-only customers).
 *
 * Why we don't throw on missing data: a refund must always leave a paper
 * trail. If the buyer's MoMo phone is missing we still create a `failed`
 * payouts row so ops can pick it up from the moderation dashboard.
 */
export async function queueBuyerRefund(input: QueueRefundInput): Promise<void> {
  if (input.amountXaf <= 0) {
    throw new AppError("Refund amount must be positive.", 422);
  }

  const existing = await prisma.payouts.findFirst({
    where: { order_id: input.orderId, status: { in: ["queued", "processing", "paid"] } },
  });
  if (existing) {
    // Defensive: never refund twice for the same order.
    return;
  }

  const trid = `refund_${randomUUID()}`;
  // We default to MTN cashin; the destination JSON records the actual intent
  // so ops can override if Maviance rejects.
  const operator: "mtn" | "orange" = "mtn";
  const serviceId = maviance.getCashinServiceId(operator);
  const destination: PayoutDestination = {
    type: "buyer_refund",
    number: input.buyerPhone ?? "",
    operator,
  };

  const payout = await prisma.payouts.create({
    data: {
      order_id: input.orderId,
      seller_id: input.buyerId, // re-using the column to denote the destination party
      amount_xaf: new Prisma.Decimal(input.amountXaf),
      destination: destination as unknown as Prisma.InputJsonValue,
      maviance_disbursement_ref: trid,
      maviance_service_id: serviceId,
      status: "queued",
    },
  });

  if (!input.buyerPhone) {
    await prisma.payouts.update({
      where: { id: payout.id },
      data: { status: "failed", failure_reason: "buyer_phone_missing" },
    });
    return;
  }

  try {
    const result = await maviance.cashin({
      serviceId,
      payerPhoneOrAccount: input.buyerPhone,
      amountXaf: input.amountXaf,
      trid,
    });
    await prisma.payouts.update({
      where: { id: payout.id },
      data: {
        maviance_ptn: result.ptn || null,
        status:
          result.status === "PAID"
            ? "paid"
            : result.status === "FAILED"
              ? "failed"
              : "processing",
        failure_reason: result.message ?? null,
        paid_at: result.status === "PAID" ? new Date() : null,
      },
    });
  } catch (err) {
    await prisma.payouts.update({
      where: { id: payout.id },
      data: {
        status: "failed",
        failure_reason: err instanceof Error ? err.message : "refund_cashin_failed",
      },
    });
  }
}

/**
 * Retry one stuck payout. Used by the reconciliation cron.
 * Caps at 3 retries — after that an admin must intervene.
 */
export async function retryPayout(payoutId: string): Promise<void> {
  const payout = await prisma.payouts.findUnique({ where: { id: payoutId } });
  if (!payout) return;
  if (payout.status === "paid") return;
  if (payout.retry_count >= 3) return;

  const trid = payout.maviance_disbursement_ref; // Idempotent on the original trid
  const dest = payout.destination as unknown as PayoutDestination;
  const operator = destinationToServiceOperator(dest);
  if (!operator) return;
  const serviceId = payout.maviance_service_id ?? maviance.getCashinServiceId(operator);

  try {
    const result = await maviance.cashin({
      serviceId,
      payerPhoneOrAccount: destinationPhone(dest),
      amountXaf: Number(payout.amount_xaf),
      trid,
    });
    await prisma.payouts.update({
      where: { id: payout.id },
      data: {
        status:
          result.status === "PAID"
            ? "paid"
            : result.status === "FAILED"
              ? "failed"
              : "processing",
        retry_count: payout.retry_count + 1,
        failure_reason: result.message ?? null,
        paid_at: result.status === "PAID" ? new Date() : null,
      },
    });
  } catch (err) {
    await prisma.payouts.update({
      where: { id: payout.id },
      data: {
        retry_count: payout.retry_count + 1,
        failure_reason: err instanceof Error ? err.message : "cashin_retry_failed",
      },
    });
  }
}
