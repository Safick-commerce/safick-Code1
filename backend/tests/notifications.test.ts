import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { listNotificationsQuerySchema } from "../src/types";

describe("listNotificationsQuerySchema", () => {
  it("defaults limit and offset", () => {
    const parsed = listNotificationsQuerySchema.parse({});
    assert.equal(parsed.limit, 20);
    assert.equal(parsed.offset, 0);
  });

  it("accepts pagination query params", () => {
    const parsed = listNotificationsQuerySchema.parse({ limit: "10", offset: "5" });
    assert.equal(parsed.limit, 10);
    assert.equal(parsed.offset, 5);
  });

  it("rejects limit above 50", () => {
    assert.throws(() => listNotificationsQuerySchema.parse({ limit: 51 }));
  });
});
