import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { loginSchema } from "../src/types/index.ts";

describe("loginSchema", () => {
  it("accepts identifier + password", () => {
    const parsed = loginSchema.safeParse({
      identifier: "seller@example.com",
      password: "secret123",
    });
    assert.equal(parsed.success, true);
  });

  it("accepts username as identifier", () => {
    const parsed = loginSchema.safeParse({
      identifier: "my_shop",
      password: "secret123",
    });
    assert.equal(parsed.success, true);
  });

  it("rejects empty identifier", () => {
    const parsed = loginSchema.safeParse({
      identifier: "",
      password: "secret123",
    });
    assert.equal(parsed.success, false);
  });

  it("rejects missing password", () => {
    const parsed = loginSchema.safeParse({
      identifier: "user@example.com",
      password: "",
    });
    assert.equal(parsed.success, false);
  });
});
