import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { followListQuerySchema } from "../src/types/follow.ts";
import { isValidUuid, parseUuid } from "../src/utils/uuid.ts";

describe("followListQuerySchema", () => {
  it("defaults limit to 50", () => {
    const parsed = followListQuerySchema.parse({});
    assert.equal(parsed.limit, 50);
  });

  it("accepts limit within 1–100", () => {
    const parsed = followListQuerySchema.parse({ limit: "25" });
    assert.equal(parsed.limit, 25);
  });

  it("rejects limit above 100", () => {
    assert.throws(() => followListQuerySchema.parse({ limit: 101 }));
  });

  it("rejects limit below 1", () => {
    assert.throws(() => followListQuerySchema.parse({ limit: 0 }));
  });
});

describe("follow route seller id validation", () => {
  it("accepts valid UUIDs for seller params", () => {
    const id = "550e8400-e29b-41d4-a716-446655440000";
    assert.equal(isValidUuid(id), true);
    assert.equal(parseUuid(id), id);
  });

  it("rejects malformed seller ids", () => {
    assert.equal(parseUuid("not-a-uuid"), null);
    assert.equal(parseUuid(""), null);
  });
});
