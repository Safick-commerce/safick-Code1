// =============================================================================
// Escrow state-machine smoke tests
// =============================================================================
// Per the `testing-minimum-bar` rule, checkout/escrow is a launch-critical flow.
// These deterministic unit tests pin down which transitions are legal so a
// future refactor cannot quietly weaken the rules. Whenever a new transition
// is added to escrow.service, add an `it()` here so the contract stays
// reviewable in one place.
// =============================================================================

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  TRANSITIONS,
  assertTransition,
  autoReleaseAt,
  nextStatus,
} from "../src/services/escrow.service";

describe("escrow.assertTransition", () => {
  it("allows the buyer to confirm delivery only from `delivered`", () => {
    assert.doesNotThrow(() => assertTransition("BUYER_CONFIRM", "delivered", "buyer"));
    assert.throws(() => assertTransition("BUYER_CONFIRM", "funds_held", "buyer"), /funds_held/);
  });

  it("only the system may transition pending_payment -> funds_held", () => {
    assert.doesNotThrow(() => assertTransition("PAYMENT_SUCCESS", "pending_payment", "system"));
    assert.throws(() => assertTransition("PAYMENT_SUCCESS", "pending_payment", "buyer"), /Forbidden/);
    assert.throws(() => assertTransition("PAYMENT_SUCCESS", "pending_payment", "seller"), /Forbidden/);
  });

  it("only the seller may accept or ship", () => {
    assert.doesNotThrow(() => assertTransition("SELLER_ACCEPT", "funds_held", "seller"));
    assert.doesNotThrow(() => assertTransition("MARK_SHIPPED", "seller_accepted", "seller"));
    assert.throws(() => assertTransition("SELLER_ACCEPT", "funds_held", "buyer"), /Forbidden/);
    assert.throws(() => assertTransition("MARK_SHIPPED", "seller_accepted", "buyer"), /Forbidden/);
  });

  it("seller rejection from funds_held returns the order to refunded", () => {
    assert.doesNotThrow(() => assertTransition("SELLER_REJECT", "funds_held", "seller"));
    assert.equal(nextStatus("SELLER_REJECT"), "refunded");
  });

  it("buyer can open a dispute from any active state", () => {
    for (const from of ["funds_held", "seller_accepted", "in_transit", "delivered"] as const) {
      assert.doesNotThrow(() => assertTransition("OPEN_DISPUTE", from, "buyer"));
    }
    // ...but not after the order is completed or refunded.
    assert.throws(() => assertTransition("OPEN_DISPUTE", "completed", "buyer"));
    assert.throws(() => assertTransition("OPEN_DISPUTE", "refunded", "buyer"));
  });

  it("auto-release is system-only and only from delivered", () => {
    assert.doesNotThrow(() => assertTransition("AUTO_RELEASE", "delivered", "system"));
    assert.throws(() => assertTransition("AUTO_RELEASE", "in_transit", "system"));
    assert.throws(() => assertTransition("AUTO_RELEASE", "delivered", "buyer"));
  });

  it("every transition declares at least one allowed actor", () => {
    for (const [name, rule] of Object.entries(TRANSITIONS)) {
      assert.ok(rule.by.length > 0, `transition ${name} has no allowed actor`);
      assert.ok(rule.from.length > 0, `transition ${name} has no 'from' states`);
    }
  });
});

describe("escrow.autoReleaseAt", () => {
  it("adds the requested days in UTC without DST drift", () => {
    const deliveredAt = new Date("2026-05-19T12:00:00.000Z");
    const release = autoReleaseAt(deliveredAt, 7);
    assert.equal(release.toISOString(), "2026-05-26T12:00:00.000Z");
  });

  it("treats 0 days as same-instant (used when admin force-completes)", () => {
    const deliveredAt = new Date("2026-05-19T12:00:00.000Z");
    const release = autoReleaseAt(deliveredAt, 0);
    assert.equal(release.toISOString(), deliveredAt.toISOString());
  });
});
