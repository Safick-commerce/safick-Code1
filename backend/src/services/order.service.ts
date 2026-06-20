// =============================================================================
// Order / Checkout Service
// =============================================================================
// Owns the lifecycle from "buyer hits the Pay button" through delivery and
// payout. Speaks to Maviance via maviance.service.ts, and to the order state
// machine via escrow.service.ts. Never bypasses the state machine.
//
// One checkout = one Maviance collect transaction = one buyer-facing payment.
// One checkout splits into multiple orders, one per seller (the unit of escrow).
// Each order opens or reuses a buyer ↔ seller conversation and posts an
// `order_card` message when funds become `funds_held` (Phase 5 wires the chat
// post; the schema slot is here from day one).
// =============================================================================

import { randomUUID } from "node:crypto";
import { Prisma } from "../generated/prisma";
import { prisma } from "../config/database";
import { env } from "../config/env";
import { AppError } from "../middleware/errorHandler";
import * as maviance from "./maviance.service";
import * as escrow from "./escrow.service";
import * as payoutService from "./payout.service";
import type {
  CheckoutInput,
  CheckoutResponse,
  CheckoutStatusResponse,
  MavianceWebhookInput,
  OrderResponse,
  OrderStatus,
  PaymentMethod,
} from "../types";

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

type OrderRow = Prisma.ordersGetPayload<{
  include: {
    items: true;
    seller: { select: { id: true; display_name: true; full_name: true; username: true } };
  };
}>;

function sellerName(
  seller: { display_name: string | null; full_name: string | null; username: string | null },
): string {
  return seller.display_name ?? seller.full_name ?? seller.username ?? "Seller";
}

function decimalToNumber(value: Prisma.Decimal | number): number {
  return typeof value === "number" ? value : value.toNumber();
}

function toOrderResponse(row: OrderRow): OrderResponse {
  return {
    id: row.id,
    checkoutId: row.checkout_id,
    buyerId: "", // Filled by caller — buyer lives on the checkout, not the order row.
    sellerId: row.seller_id,
    sellerDisplayName: sellerName(row.seller),
    status: row.status as OrderStatus,
    subtotalXaf: decimalToNumber(row.subtotal_xaf),
    items: row.items.map((item) => ({
      id: item.id,
      productId: item.product_id,
      title: item.title_snapshot,
      imageUrl: item.image_url_snapshot,
      quantity: item.quantity,
      unitPriceXaf: decimalToNumber(item.unit_price_xaf),
    })),
    conversationId: row.conversation_id,
    autoReleaseAt: row.auto_release_at?.toISOString() ?? null,
    completedAt: row.completed_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

const ORDER_INCLUDE = {
  items: true,
  seller: { select: { id: true, display_name: true, full_name: true, username: true } },
} satisfies Prisma.ordersInclude;

// ---------------------------------------------------------------------------
// Checkout
// ---------------------------------------------------------------------------

export async function createCheckout(
  buyerId: string,
  input: CheckoutInput,
): Promise<CheckoutResponse> {
  // 1. Validate address belongs to this buyer.
  const address = await prisma.addresses.findUnique({ where: { id: input.addressId } });
  if (!address || address.buyer_id !== buyerId) {
    throw new AppError("Delivery address not found", 404);
  }

  // 2. Load products + prices + sellers from the DB. We DO NOT trust client prices.
  const productIds = input.items.map((i) => i.productId);
  const products = await prisma.products.findMany({
    where: { id: { in: productIds } },
    select: { id: true, title: true, image_url: true, price: true, seller_id: true },
  });
  if (products.length !== productIds.length) {
    throw new AppError("One or more products in the cart no longer exist.", 410);
  }

  // 3. Buyer cannot buy from themselves.
  if (products.some((p) => p.seller_id === buyerId)) {
    throw new AppError("You cannot buy your own listing.", 400);
  }
  if (products.some((p) => !p.seller_id)) {
    throw new AppError("One or more products no longer have a seller.", 410);
  }

  // 4. Group by seller and compute totals (server-authoritative).
  const productById = new Map(products.map((p) => [p.id, p]));
  const groupedBySeller = new Map<
    string,
    { sellerId: string; subtotal: number; items: Array<{ productId: string; quantity: number; unitPrice: number; title: string; imageUrl: string | null }> }
  >();

  let totalXaf = 0;
  for (const cartItem of input.items) {
    const product = productById.get(cartItem.productId)!;
    const unitPrice = decimalToNumber(product.price);
    if (unitPrice <= 0) {
      throw new AppError(`Invalid price on "${product.title}".`, 422);
    }
    const lineTotal = unitPrice * cartItem.quantity;
    totalXaf += lineTotal;

    const sellerId = product.seller_id as string;
    const group = groupedBySeller.get(sellerId) ?? {
      sellerId,
      subtotal: 0,
      items: [],
    };
    group.subtotal += lineTotal;
    group.items.push({
      productId: product.id,
      quantity: cartItem.quantity,
      unitPrice,
      title: product.title,
      imageUrl: product.image_url ?? null,
    });
    groupedBySeller.set(sellerId, group);
  }

  if (totalXaf <= 0) {
    throw new AppError("Cart total must be positive.", 422);
  }

  // 5. Ask Maviance for a quote (collect token).
  const serviceId = maviance.getCollectServiceId(input.paymentMethod);
  const paymentRef = `chk_${randomUUID()}`;

  const quote = await maviance.quoteStandard({ serviceId, amountXaf: totalXaf });

  // 6. Persist the checkout + orders + items inside a single transaction.
  const orderIdsByGroup = new Map<string, string>();

  const persisted = await prisma.$transaction(async (tx) => {
    const checkout = await tx.checkouts.create({
      data: {
        buyer_id: buyerId,
        address_id: address.id,
        payment_method: input.paymentMethod,
        payer_phone: input.payerPhone ?? null,
        total_xaf: new Prisma.Decimal(totalXaf),
        maviance_service_id: serviceId,
        maviance_ptn: quote.ptn,
        maviance_payment_ref: paymentRef,
        status: "pending_payment",
      },
    });

    for (const group of groupedBySeller.values()) {
      const order = await tx.orders.create({
        data: {
          checkout_id: checkout.id,
          seller_id: group.sellerId,
          subtotal_xaf: new Prisma.Decimal(group.subtotal),
          status: "pending_payment",
        },
      });
      orderIdsByGroup.set(group.sellerId, order.id);

      await tx.order_items.createMany({
        data: group.items.map((item) => ({
          order_id: order.id,
          product_id: item.productId,
          quantity: item.quantity,
          unit_price_xaf: new Prisma.Decimal(item.unitPrice),
          title_snapshot: item.title,
          image_url_snapshot: item.imageUrl,
        })),
      });
    }

    return checkout;
  });

  // 7. Kick off the collect (push-PIN to buyer for mobile money / hosted URL for card).
  let collect: maviance.CollectResult;
  try {
    collect = await maviance.collectStandard({
      ptn: quote.ptn,
      customerPhone: input.payerPhone ?? "",
      trid: paymentRef,
    });
  } catch (err) {
    // Mark checkout failed so the buyer can retry from the UI.
    await prisma.checkouts.update({
      where: { id: persisted.id },
      data: {
        status: "failed",
        failure_reason: err instanceof Error ? err.message : "collect_failed",
      },
    });
    throw err;
  }

  // Map Maviance's instant status to ours. Most flows return AWAITING_PIN/PENDING
  // and the real status arrives via webhook — we DO NOT mark funds_held here.
  const responseStatus: CheckoutResponse["status"] =
    collect.status === "SUCCESS"
      ? "paid"
      : collect.status === "FAILED"
        ? "failed"
        : collect.status === "AWAITING_PIN"
          ? "awaiting_pin"
          : "pending_payment";

  return {
    id: persisted.id,
    status: responseStatus,
    paymentMethod: persisted.payment_method as PaymentMethod,
    totalXaf,
    ptn: quote.ptn,
    hostedCheckoutUrl: collect.hostedCheckoutUrl ?? null,
    orderIds: Array.from(orderIdsByGroup.values()),
    createdAt: persisted.created_at.toISOString(),
  };
}

export async function getCheckoutStatus(
  buyerId: string,
  checkoutId: string,
): Promise<CheckoutStatusResponse> {
  const checkout = await prisma.checkouts.findUnique({
    where: { id: checkoutId },
    include: { orders: { select: { id: true } } },
  });
  if (!checkout || checkout.buyer_id !== buyerId) {
    throw new AppError("Checkout not found", 404);
  }

  // If Maviance hasn't told us yet (no webhook), proactively ask for the latest
  // status so the buyer doesn't see a stale spinner. Best-effort; never throw
  // out of the status endpoint.
  if (checkout.status === "pending_payment" && checkout.maviance_ptn && maviance.isConfigured()) {
    try {
      const remote = await maviance.verifyTx(checkout.maviance_ptn);
      if (remote.status === "SUCCESS") {
        await markCheckoutPaid(checkout.id);
      } else if (
        remote.status === "FAILED" ||
        remote.status === "ERRORED" ||
        remote.status === "CANCELLED" ||
        remote.status === "EXPIRED"
      ) {
        await markCheckoutFailed(checkout.id, remote.message ?? remote.status.toLowerCase());
      }
    } catch {
      // Swallow — status endpoint must never crash because of a remote hiccup.
    }
  }

  const refreshed = await prisma.checkouts.findUnique({
    where: { id: checkoutId },
    include: { orders: { select: { id: true } } },
  });

  const row = refreshed ?? checkout;
  return {
    id: row.id,
    status: row.status as CheckoutStatusResponse["status"],
    ptn: row.maviance_ptn,
    failureReason: row.failure_reason,
    orderIds: row.orders.map((o) => o.id),
    paidAt: row.paid_at?.toISOString() ?? null,
  };
}

// ---------------------------------------------------------------------------
// Maviance webhook entrypoint
// ---------------------------------------------------------------------------

/**
 * Apply a verified Maviance webhook payload.
 * IMPORTANT: signature verification happens at the controller layer BEFORE
 * this function runs. This function is idempotent — calling it twice for the
 * same (ptn, status) is a no-op.
 */
export async function applyWebhook(payload: MavianceWebhookInput): Promise<void> {
  const checkout = await prisma.checkouts.findUnique({
    where: { maviance_ptn: payload.ptn },
  });
  if (!checkout) {
    // Unknown PTN — could be a stale replay or a payout (cashin) we route elsewhere.
    // We acknowledge so Maviance stops retrying, but log so on-call notices.
    console.warn(`[maviance.webhook] unknown ptn=${payload.ptn} status=${payload.status}`);
    return;
  }

  if (payload.status === "SUCCESS" && checkout.status !== "paid") {
    await markCheckoutPaid(checkout.id);
  } else if (
    (payload.status === "FAILED" ||
      payload.status === "ERRORED" ||
      payload.status === "CANCELLED" ||
      payload.status === "EXPIRED") &&
    checkout.status !== "failed"
  ) {
    await markCheckoutFailed(checkout.id, payload.message ?? payload.status.toLowerCase());
  }
  // PENDING / unknown — leave the row alone.
}

async function markCheckoutPaid(checkoutId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const fresh = await tx.checkouts.findUnique({ where: { id: checkoutId } });
    if (!fresh || fresh.status === "paid") return;

    await tx.checkouts.update({
      where: { id: checkoutId },
      data: { status: "paid", paid_at: new Date(), failure_reason: null },
    });

    // Flip every order from pending_payment to funds_held.
    const orders = await tx.orders.findMany({
      where: { checkout_id: checkoutId },
      include: { items: { select: { product_id: true } } },
    });
    for (const order of orders) {
      if (order.status !== "pending_payment") continue;
      escrow.assertTransition("PAYMENT_SUCCESS", order.status as OrderStatus, "system");

      // Open or reuse a buyer ↔ seller conversation anchored on the first product.
      const anchorProductId = order.items[0]?.product_id;
      let conversationId: string | null = null;
      if (anchorProductId) {
        const existing = await tx.conversations.findUnique({
          where: {
            product_id_buyer_id: {
              product_id: anchorProductId,
              buyer_id: fresh.buyer_id,
            },
          },
          select: { id: true },
        });
        if (existing) {
          conversationId = existing.id;
        } else {
          const created = await tx.conversations.create({
            data: {
              product_id: anchorProductId,
              buyer_id: fresh.buyer_id,
              seller_id: order.seller_id,
            },
            select: { id: true },
          });
          conversationId = created.id;
        }
      }

      await tx.orders.update({
        where: { id: order.id },
        data: {
          status: escrow.nextStatus("PAYMENT_SUCCESS"),
          conversation_id: conversationId,
        },
      });

      // Auto-post an order_card system message into the buyer ↔ seller
      // conversation so both parties see the order land in chat. The frontend
      // renders message_type=order_card as a structured card with the order
      // status; plain `body` is the human-readable fallback for any chat
      // surface that doesn't know about order cards (e.g. notifications).
      if (conversationId) {
        const itemCount = order.items.length;
        const body = `New order paid — ${itemCount} ${itemCount === 1 ? "item" : "items"} held in escrow.`;
        await tx.messages.create({
          data: {
            conversation_id: conversationId,
            // The buyer is the "sender" so the seller sees an inbound card;
            // it is also visible to the buyer as their own structured message.
            sender_id: fresh.buyer_id,
            body,
            message_type: "order_card",
            order_id: order.id,
          },
        });
        await tx.conversations.update({
          where: { id: conversationId },
          data: { last_message_at: new Date() },
        });
      }
    }
  });
}

async function markCheckoutFailed(checkoutId: string, reason: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const fresh = await tx.checkouts.findUnique({ where: { id: checkoutId } });
    if (!fresh || fresh.status === "failed") return;

    await tx.checkouts.update({
      where: { id: checkoutId },
      data: { status: "failed", failure_reason: reason },
    });

    const orders = await tx.orders.findMany({
      where: { checkout_id: checkoutId, status: "pending_payment" },
    });
    for (const order of orders) {
      escrow.assertTransition("PAYMENT_FAILURE", order.status as OrderStatus, "system");
      await tx.orders.update({
        where: { id: order.id },
        data: { status: escrow.nextStatus("PAYMENT_FAILURE") },
      });
    }
  });
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export async function listBuyerOrders(buyerId: string): Promise<OrderResponse[]> {
  const rows = await prisma.orders.findMany({
    where: { checkout: { buyer_id: buyerId } },
    orderBy: { created_at: "desc" },
    include: ORDER_INCLUDE,
  });
  return rows.map((row) => ({ ...toOrderResponse(row), buyerId }));
}

export async function listSellerOrders(sellerId: string): Promise<OrderResponse[]> {
  const rows = await prisma.orders.findMany({
    where: { seller_id: sellerId, status: { not: "pending_payment" } },
    orderBy: { created_at: "desc" },
    include: { ...ORDER_INCLUDE, checkout: { select: { buyer_id: true } } },
  });
  return rows.map((row) => ({
    ...toOrderResponse(row),
    buyerId: row.checkout.buyer_id,
  }));
}

async function loadOrderForActor(
  orderId: string,
  userId: string,
  expect: "buyer" | "seller",
): Promise<OrderRow & { checkout: { buyer_id: string } }> {
  const row = await prisma.orders.findUnique({
    where: { id: orderId },
    include: { ...ORDER_INCLUDE, checkout: { select: { buyer_id: true } } },
  });
  if (!row) throw new AppError("Order not found", 404);
  if (expect === "buyer" && row.checkout.buyer_id !== userId) {
    throw new AppError("Order not found", 404);
  }
  if (expect === "seller" && row.seller_id !== userId) {
    throw new AppError("Order not found", 404);
  }
  return row;
}

export async function getBuyerOrder(buyerId: string, orderId: string): Promise<OrderResponse> {
  const row = await loadOrderForActor(orderId, buyerId, "buyer");
  return { ...toOrderResponse(row), buyerId };
}

export async function getSellerOrder(sellerId: string, orderId: string): Promise<OrderResponse> {
  const row = await loadOrderForActor(orderId, sellerId, "seller");
  return { ...toOrderResponse(row), buyerId: row.checkout.buyer_id };
}

// ---------------------------------------------------------------------------
// Order actions
// ---------------------------------------------------------------------------

async function transitionOrder(
  orderId: string,
  userId: string,
  expect: "buyer" | "seller",
  transition: escrow.TransitionName,
  extra: Prisma.ordersUpdateInput = {},
): Promise<OrderResponse> {
  const row = await loadOrderForActor(orderId, userId, expect);
  escrow.assertTransition(transition, row.status as OrderStatus, expect);

  const updated = await prisma.orders.update({
    where: { id: orderId },
    data: {
      ...extra,
      status: escrow.nextStatus(transition),
      updated_at: new Date(),
    },
    include: ORDER_INCLUDE,
  });

  return { ...toOrderResponse(updated), buyerId: row.checkout.buyer_id };
}

export const sellerAccept = (sellerId: string, orderId: string) =>
  transitionOrder(orderId, sellerId, "seller", "SELLER_ACCEPT");

export const sellerReject = (sellerId: string, orderId: string) =>
  // Phase 4 will trigger the immediate-buyer-refund cashin from here.
  transitionOrder(orderId, sellerId, "seller", "SELLER_REJECT");

export const sellerMarkShipped = (sellerId: string, orderId: string) =>
  transitionOrder(orderId, sellerId, "seller", "MARK_SHIPPED");

export async function sellerMarkDelivered(sellerId: string, orderId: string): Promise<OrderResponse> {
  const deliveredAt = new Date();
  const releaseAt = escrow.autoReleaseAt(deliveredAt, env.ESCROW_AUTO_RELEASE_DAYS);
  return transitionOrder(orderId, sellerId, "seller", "MARK_DELIVERED", {
    auto_release_at: releaseAt,
  });
}

export async function buyerConfirmDelivery(buyerId: string, orderId: string): Promise<OrderResponse> {
  const result = await transitionOrder(orderId, buyerId, "buyer", "BUYER_CONFIRM", {
    completed_at: new Date(),
  });
  // Fire-and-forget — the order is completed regardless of payout outcome.
  // queueSellerPayout swallows errors and leaves the row as `failed` for
  // the reconciliation cron to retry (see jobs/reconciliation.job.ts).
  payoutService
    .queueSellerPayout({ orderId })
    .catch((err) => console.error(`[order.buyerConfirmDelivery] payout failed`, err));
  return result;
}

/**
 * Trigger by the auto-release cron when an order has been `delivered` for
 * longer than the escrow window. Same end-state as buyer-confirm — the buyer
 * just didn't act in time.
 */
export async function autoReleaseOrder(orderId: string): Promise<OrderResponse> {
  const row = await prisma.orders.findUnique({
    where: { id: orderId },
    include: { ...ORDER_INCLUDE, checkout: { select: { buyer_id: true } } },
  });
  if (!row) throw new AppError("Order not found", 404);
  escrow.assertTransition("AUTO_RELEASE", row.status as OrderStatus, "system");

  const updated = await prisma.orders.update({
    where: { id: orderId },
    data: {
      status: escrow.nextStatus("AUTO_RELEASE"),
      completed_at: new Date(),
      updated_at: new Date(),
    },
    include: ORDER_INCLUDE,
  });

  payoutService
    .queueSellerPayout({ orderId })
    .catch((err) => console.error(`[order.autoReleaseOrder] payout failed`, err));

  return { ...toOrderResponse(updated), buyerId: row.checkout.buyer_id };
}

export async function buyerOpenDispute(
  buyerId: string,
  orderId: string,
  reason: { category: string; details: string },
): Promise<OrderResponse> {
  // 1. Transition the order to `disputed`. This validates the actor + state.
  const result = await transitionOrder(orderId, buyerId, "buyer", "OPEN_DISPUTE");

  // 2. Persist the structured dispute as a system message in the buyer ↔ seller
  //    conversation so moderators reading the chat have full context. The body
  //    is a human-readable summary; message_type=dispute marks it for the chat
  //    renderer; order_id links the moderation queue back to the order.
  if (result.conversationId) {
    const summary = `Dispute opened — ${reason.category.replace(/_/g, " ")}: ${reason.details}`;
    await prisma.messages.create({
      data: {
        conversation_id: result.conversationId,
        sender_id: buyerId,
        body: summary,
        message_type: "dispute",
        order_id: orderId,
      },
    });
    await prisma.conversations.update({
      where: { id: result.conversationId },
      data: { last_message_at: new Date() },
    });
  }

  // 3. Surface to ops. Always log a structured line (any log forwarder can
  //    detect it) and additionally fire-and-forget a webhook if configured.
  const payload = {
    event: "order.dispute.opened",
    orderId,
    buyerId,
    sellerId: result.sellerId,
    category: reason.category,
    details: reason.details,
    timestamp: new Date().toISOString(),
  };
  console.warn(JSON.stringify(payload));

  if (env.OPS_DISPUTE_WEBHOOK_URL) {
    // Slack-compatible body shape; non-Slack endpoints can ignore `text` and
    // read `payload` directly. We swallow webhook errors — ops surfacing must
    // never break the buyer's dispute flow.
    fetch(env.OPS_DISPUTE_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `Dispute opened on order ${orderId} (${reason.category}).`,
        payload,
      }),
    }).catch((err) => {
      console.error("[order.dispute] ops webhook failed", err);
    });
  }

  return result;
}

// ---------------------------------------------------------------------------
// Admin: refund + moderation queue
// ---------------------------------------------------------------------------

export async function listDisputedOrders(): Promise<OrderResponse[]> {
  const rows = await prisma.orders.findMany({
    where: { status: "disputed" },
    orderBy: { updated_at: "asc" },
    include: { ...ORDER_INCLUDE, checkout: { select: { buyer_id: true } } },
  });
  return rows.map((row) => ({
    ...toOrderResponse(row),
    buyerId: row.checkout.buyer_id,
  }));
}

/**
 * Force-refund a disputed order. Admin-only — caller is responsible for the
 * authorization check (we double-check the header in the controller).
 *
 * Disbursement target is the buyer's MoMo number captured at checkout. If the
 * checkout was paid by card, the refund still goes to a MoMo number for the
 * MVP — Maviance card refund is a manual ops process and is captured in the
 * payout row with destination.type=buyer_refund so ops can reconcile.
 */
export async function adminRefundOrder(orderId: string): Promise<OrderResponse> {
  const row = await prisma.orders.findUnique({
    where: { id: orderId },
    include: { ...ORDER_INCLUDE, checkout: { select: { buyer_id: true, payer_phone: true, payment_method: true } } },
  });
  if (!row) throw new AppError("Order not found", 404);
  escrow.assertTransition("ADMIN_REFUND", row.status as OrderStatus, "admin");

  const updated = await prisma.orders.update({
    where: { id: orderId },
    data: {
      status: escrow.nextStatus("ADMIN_REFUND"),
      updated_at: new Date(),
      completed_at: new Date(),
    },
    include: ORDER_INCLUDE,
  });

  // Queue the refund cashin to the buyer. Best-effort — if cashin fails,
  // the payout row is left as `failed` and the retry cron picks it up.
  payoutService
    .queueBuyerRefund({
      orderId,
      buyerId: row.checkout.buyer_id,
      buyerPhone: row.checkout.payer_phone,
      amountXaf: Number(row.subtotal_xaf),
    })
    .catch((err) => console.error(`[order.adminRefundOrder] refund cashin failed`, err));

  return { ...toOrderResponse(updated), buyerId: row.checkout.buyer_id };
}
