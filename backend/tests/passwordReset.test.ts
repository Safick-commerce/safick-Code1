import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  generateOtpCode,
  signPasswordResetToken,
  verifyPasswordResetToken,
  PASSWORD_RESET_PURPOSE,
} from "../src/services/passwordReset.service";

const TEST_SECRET = "test-password-reset-secret-at-least-32-chars";

describe("generateOtpCode", () => {
  it("returns a 4-digit string", () => {
    for (let i = 0; i < 20; i++) {
      const code = generateOtpCode();
      assert.match(code, /^\d{4}$/);
      const num = Number(code);
      assert.ok(num >= 1000 && num <= 9999);
    }
  });
});

describe("password reset JWT", () => {
  it("signs and verifies a reset token", () => {
    const prev = process.env.PASSWORD_RESET_TOKEN_SECRET;
    process.env.PASSWORD_RESET_TOKEN_SECRET = TEST_SECRET;

    const payload = {
      email: "user@example.com",
      purpose: PASSWORD_RESET_PURPOSE,
      otpId: "a1b2c3d4-e5f6-4789-abcd-ef1234567890",
    };

    const token = signPasswordResetToken(payload);
    const decoded = verifyPasswordResetToken(token);

    assert.equal(decoded.email, payload.email);
    assert.equal(decoded.purpose, PASSWORD_RESET_PURPOSE);
    assert.equal(decoded.otpId, payload.otpId);

    if (prev) process.env.PASSWORD_RESET_TOKEN_SECRET = prev;
    else delete process.env.PASSWORD_RESET_TOKEN_SECRET;
  });

  it("rejects a tampered token", () => {
    const prev = process.env.PASSWORD_RESET_TOKEN_SECRET;
    process.env.PASSWORD_RESET_TOKEN_SECRET = TEST_SECRET;

    assert.throws(
      () => verifyPasswordResetToken("not.a.valid.token"),
      /Invalid or expired reset token/,
    );

    if (prev) process.env.PASSWORD_RESET_TOKEN_SECRET = prev;
    else delete process.env.PASSWORD_RESET_TOKEN_SECRET;
  });
});
