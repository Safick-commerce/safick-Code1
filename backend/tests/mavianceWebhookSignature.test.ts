// =============================================================================
// Maviance webhook signature smoke tests
// =============================================================================
// Required by `testing-minimum-bar` since the webhook is the ONLY way a
// buyer payment becomes funds_held. A signature regression silently routes
// fraudulent webhook calls into our escrow logic, so we lock the contract:
//   - valid signature passes
//   - tampered body fails
//   - missing signature fails
//   - wrong-length signature fails (replay with a different scheme)
// =============================================================================

import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

const SECRET = "test_secret_for_webhook_signature_check_min32";

before(() => {
  // The maviance service reads the secret from env at import time via `env`.
  // We patch it before requiring the module.
  process.env.MAVIANCE_S3P_WEBHOOK_SECRET = SECRET;
});

describe("maviance.verifyWebhookSignature", () => {
  it("accepts a correctly signed payload", async () => {
    const { verifyWebhookSignature } = await import("../src/services/maviance.service");
    const body = JSON.stringify({ ptn: "PTN123", trid: "chk_abc", status: "SUCCESS" });
    const signature = crypto.createHmac("sha256", SECRET).update(body, "utf8").digest("hex");
    assert.equal(verifyWebhookSignature(body, signature), true);
  });

  it("rejects a tampered payload", async () => {
    const { verifyWebhookSignature } = await import("../src/services/maviance.service");
    const body = JSON.stringify({ ptn: "PTN123", trid: "chk_abc", status: "SUCCESS" });
    const signature = crypto.createHmac("sha256", SECRET).update(body, "utf8").digest("hex");
    const tampered = body.replace("SUCCESS", "FAILED");
    assert.equal(verifyWebhookSignature(tampered, signature), false);
  });

  it("rejects a missing signature", async () => {
    const { verifyWebhookSignature } = await import("../src/services/maviance.service");
    const body = JSON.stringify({ ptn: "PTN123", trid: "chk_abc", status: "SUCCESS" });
    assert.equal(verifyWebhookSignature(body, null), false);
  });

  it("rejects a wrong-length signature (length-mismatch attack)", async () => {
    const { verifyWebhookSignature } = await import("../src/services/maviance.service");
    const body = JSON.stringify({ ptn: "PTN123", trid: "chk_abc", status: "SUCCESS" });
    // 16-byte hex (32 chars) instead of the expected 32-byte sha256 (64 chars).
    assert.equal(verifyWebhookSignature(body, "deadbeefdeadbeefdeadbeefdeadbeef"), false);
  });
});

describe("maviance.extractSignatureHeader", () => {
  it("reads the first known header variant present", async () => {
    const { extractSignatureHeader } = await import("../src/services/maviance.service");
    assert.equal(
      extractSignatureHeader({ "x-maviance-signature": "abc123" }),
      "abc123",
    );
    assert.equal(
      extractSignatureHeader({ "x-smobilpay-signature": "def456" }),
      "def456",
    );
    assert.equal(extractSignatureHeader({}), null);
  });

  it("flattens array-valued headers (some proxies set them this way)", async () => {
    const { extractSignatureHeader } = await import("../src/services/maviance.service");
    assert.equal(
      extractSignatureHeader({ "x-signature": ["primary", "secondary"] }),
      "primary",
    );
  });
});
