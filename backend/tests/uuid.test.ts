import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isValidUuid, parseUuid } from "../src/utils/uuid";

describe("parseUuid", () => {
  it("accepts a valid UUID", () => {
    const id = "a1b2c3d4-e5f6-4789-abcd-ef1234567890";
    assert.equal(parseUuid(id), id);
  });

  it("rejects placeholder text", () => {
    assert.equal(parseUuid("<real-uuid-from-supabase-profiles>"), null);
  });

  it("rejects arbitrary strings", () => {
    assert.equal(isValidUuid("not-a-uuid"), false);
  });
});
