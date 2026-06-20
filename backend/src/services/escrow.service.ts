// =============================================================================
// Escrow / Order State Machine
// =============================================================================
// All order status mutations go through this module. Keeps the legal /
// dispute-relevant transitions in ONE place so they are easy to audit.
//
// State diagram (per order):
//
//   pending_payment ─── buyer pays Maviance ──▶ funds_held
//   pending_payment ─── collect failed     ──▶ cancelled
//
//   funds_held ─── seller accepts ──▶ seller_accepted
//   funds_held ─── seller rejects ──▶ refunded   (immediate buyer refund)
//
//   seller_accepted ─── seller marks shipped  ──▶ in_transit
//   in_transit      ─── seller marks delivered ─▶ delivered
//   delivered       ─── buyer confirms        ──▶ completed   (triggers payout)
//   delivered       ─── 7-day auto-release    ──▶ completed   (triggers payout)
//
//   funds_held | seller_accepted | in_transit | delivered
//                 ─── buyer opens dispute ──▶ disputed
//   disputed       ─── admin resolves       ──▶ completed | refunded
//
// Any other transition throws — callers must check the order's current status.
// =============================================================================

import { AppError } from "../middleware/errorHandler";
import type { OrderStatus } from "../types";

export const ORDER_STATUSES: OrderStatus[] = [
  "pending_payment",
  "funds_held",
  "seller_accepted",
  "seller_rejected",
  "in_transit",
  "delivered",
  "completed",
  "disputed",
  "refunded",
  "cancelled",
];

export type ActorRole = "buyer" | "seller" | "system" | "admin";

interface TransitionRule {
  from: OrderStatus[];
  to: OrderStatus;
  by: ActorRole[];
}

// Named transitions — exhaustive. If it isn't here, it cannot happen.
export const TRANSITIONS = {
  PAYMENT_SUCCESS: { from: ["pending_payment"], to: "funds_held", by: ["system"] },
  PAYMENT_FAILURE: { from: ["pending_payment"], to: "cancelled", by: ["system"] },
  SELLER_ACCEPT: { from: ["funds_held"], to: "seller_accepted", by: ["seller"] },
  SELLER_REJECT: { from: ["funds_held"], to: "refunded", by: ["seller"] },
  MARK_SHIPPED: { from: ["seller_accepted"], to: "in_transit", by: ["seller"] },
  MARK_DELIVERED: { from: ["seller_accepted", "in_transit"], to: "delivered", by: ["seller"] },
  BUYER_CONFIRM: { from: ["delivered"], to: "completed", by: ["buyer"] },
  AUTO_RELEASE: { from: ["delivered"], to: "completed", by: ["system"] },
  OPEN_DISPUTE: {
    from: ["funds_held", "seller_accepted", "in_transit", "delivered"],
    to: "disputed",
    by: ["buyer"],
  },
  ADMIN_COMPLETE: { from: ["disputed"], to: "completed", by: ["admin"] },
  ADMIN_REFUND: { from: ["disputed", "delivered", "funds_held"], to: "refunded", by: ["admin"] },
  ADMIN_CANCEL: {
    from: ["pending_payment", "funds_held", "seller_accepted", "in_transit"],
    to: "cancelled",
    by: ["admin"],
  },
} as const satisfies Record<string, TransitionRule>;

export type TransitionName = keyof typeof TRANSITIONS;

/** Validate that an order in `current` status can transition via `name` by `actor`. */
export function assertTransition(
  name: TransitionName,
  current: OrderStatus,
  actor: ActorRole,
): void {
  const rule = TRANSITIONS[name];
  if (!(rule.from as readonly OrderStatus[]).includes(current)) {
    throw new AppError(
      `Cannot ${name.toLowerCase().replace(/_/g, " ")} an order that is ${current}.`,
      409,
    );
  }
  if (!(rule.by as readonly ActorRole[]).includes(actor)) {
    throw new AppError(`Forbidden: ${actor} cannot ${name}.`, 403);
  }
}

export function nextStatus(name: TransitionName): OrderStatus {
  return TRANSITIONS[name].to;
}

/** Compute when an order moved into `delivered` should auto-release to completed. */
export function autoReleaseAt(deliveredAt: Date, days: number): Date {
  const out = new Date(deliveredAt);
  out.setUTCDate(out.getUTCDate() + days);
  return out;
}
