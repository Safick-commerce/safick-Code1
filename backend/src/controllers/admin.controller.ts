// =============================================================================
// Admin Controller — disputed-orders queue + force refund.
// =============================================================================
// Header-gated by `requireAdmin` (see middleware/auth). The MVP exposes the
// minimum surface for moderators to resolve a stuck order:
//   GET  /api/admin/disputes  → list orders currently in `disputed`
//   POST /api/admin/orders/:id/refund → force-refund and queue buyer cashin
//
// Anything beyond this lives behind a real admin UI post-launch.
// =============================================================================

import type { Request, Response, NextFunction } from "express";
import * as orderService from "../services/order.service";
import { parseUuid } from "../utils/uuid";

export async function listDisputes(_req: Request, res: Response, next: NextFunction) {
  try {
    const orders = await orderService.listDisputedOrders();
    res.json({ orders });
  } catch (err) {
    next(err);
  }
}

export async function refundOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseUuid(String(req.params.id));
    if (!id) {
      res.status(400).json({ error: "Invalid order id" });
      return;
    }
    const order = await orderService.adminRefundOrder(id);
    res.json({ order });
  } catch (err) {
    next(err);
  }
}
