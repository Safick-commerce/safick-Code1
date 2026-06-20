// =============================================================================
// Reconciliation Cron — self-heal missed Maviance webhooks
// =============================================================================
// Runs every 5 minutes. Two jobs in one tick:
//
//   1. Checkout reconciliation
//      For each checkout still in `pending_payment` whose Maviance PTN was
//      issued > 1 minute ago, we call verifyTx() and apply the result. This
//      handles webhook failures, retry queues, and dev-mode tunnel hiccups.
//
//   2. Payout retry
//      For each `payouts` row in `failed` status with retry_count < 3, we
//      re-run the cashin call via payout.service.retryPayout. After 3 retries
//      the row sits there waiting for an admin.
//
// Both jobs are bounded (LIMIT 50 each) so a backlog never blocks the tick.
// =============================================================================

import { prisma } from "../config/database";
import * as maviance from "../services/maviance.service";
import * as orderService from "../services/order.service";
import * as payoutService from "../services/payout.service";

const STALE_AFTER_MS = 60 * 1000;

export async function runReconciliationOnce(): Promise<void> {
  await reconcilePendingCheckouts();
  await retryFailedPayouts();
}

async function reconcilePendingCheckouts(): Promise<void> {
  if (!maviance.isConfigured()) return;

  const cutoff = new Date(Date.now() - STALE_AFTER_MS);
  const stalled = await prisma.checkouts.findMany({
    where: {
      status: "pending_payment",
      maviance_ptn: { not: null },
      created_at: { lte: cutoff },
    },
    select: { id: true, maviance_ptn: true },
    take: 50,
  });

  if (stalled.length === 0) return;
  console.log(`[reconciliation] verifying ${stalled.length} stalled checkout(s)`);

  for (const checkout of stalled) {
    if (!checkout.maviance_ptn) continue;
    try {
      const remote = await maviance.verifyTx(checkout.maviance_ptn);
      if (remote.status === "SUCCESS") {
        await orderService.applyWebhook({
          ptn: checkout.maviance_ptn,
          trid: `reconcile_${checkout.id}`,
          status: "SUCCESS",
        });
      } else if (
        remote.status === "FAILED" ||
        remote.status === "ERRORED" ||
        remote.status === "EXPIRED" ||
        remote.status === "CANCELLED"
      ) {
        await orderService.applyWebhook({
          ptn: checkout.maviance_ptn,
          trid: `reconcile_${checkout.id}`,
          status: remote.status,
          message: remote.message,
        });
      }
    } catch (err) {
      console.error(`[reconciliation] checkoutId=${checkout.id} verify failed`, err);
    }
  }
}

async function retryFailedPayouts(): Promise<void> {
  if (!maviance.isConfigured()) return;

  const failed = await prisma.payouts.findMany({
    where: { status: "failed", retry_count: { lt: 3 } },
    select: { id: true },
    take: 50,
  });

  if (failed.length === 0) return;
  console.log(`[reconciliation] retrying ${failed.length} failed payout(s)`);

  for (const payout of failed) {
    try {
      await payoutService.retryPayout(payout.id);
    } catch (err) {
      console.error(`[reconciliation] payoutId=${payout.id} retry failed`, err);
    }
  }
}
