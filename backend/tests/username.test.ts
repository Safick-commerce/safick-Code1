import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateUsernameFormat } from "../src/utils/username";

describe("validateUsernameFormat", () => {
  it("accepts a valid username", () => {
    const result = validateUsernameFormat("safick_user");
    assert.equal(result.valid, true);
    if (result.valid) {
      assert.equal(result.normalized, "safick_user");
    }
  });

  it("normalizes to lowercase", () => {
    const result = validateUsernameFormat("  Safick.User  ");
    assert.equal(result.valid, true);
    if (result.valid) {
      assert.equal(result.normalized, "safick.user");
    }
  });

  it("rejects too-short usernames", () => {
    const result = validateUsernameFormat("ab");
    assert.equal(result.valid, false);
    if (!result.valid) {
      assert.match(result.reason, /at least 3/i);
    }
  });

  it("rejects invalid characters", () => {
    const result = validateUsernameFormat("bad name!");
    assert.equal(result.valid, false);
  });
});
