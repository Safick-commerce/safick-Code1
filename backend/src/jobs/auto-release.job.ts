// =============================================================================
// Auto-Release Cron — flips delivered → completed after the escrow window
// =============================================================================
// Runs every hour. Looks for orders where:
//   - status = "delivered"
//   - auto_release_at <= now
// and transitions them to "completed" via order.service.autoReleaseOrder,
// which also queues the seller cashin payout.
//
// This is the lazy buyer's safety net — sellers always get paid, just slower
// when the buyer never confirms.
// =============================================================================

import { prisma } from "../config/database";
import * as orderService from "../services/order.service";

export async function runAutoReleaseOnce(): Promise<void> {
  const dueOrders = await prisma.orders.findMany({
    where: {
      status: "delivered",
      auto_release_at: { lte: new Date(), not: null },
    },
    select: { id: true },
    take: 100,
  });

  if (dueOrders.length === 0) return;
  console.log(`[auto-release] processing ${dueOrders.length} order(s)`);

  for (const order of dueOrders) {
    try {
      await orderService.autoReleaseOrder(order.id);
    } catch (err) {
      console.error(`[auto-release] orderId=${order.id} failed`, err);
    }
  }
}