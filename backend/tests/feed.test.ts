import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  filterInterestCategoryLabels,
  isInterestCategoryLabel,
} from "../src/constants/interestCategories";
import {
  forYouFeedQuerySchema,
  recordProductViewBodySchema,
} from "../src/types/feed";

describe("forYouFeedQuerySchema", () => {
  it("defaults limit to 10", () => {
    const parsed = forYouFeedQuerySchema.parse({});
    assert.equal(parsed.limit, 10);
  });

  it("accepts limit within 1–20", () => {
    const parsed = forYouFeedQuerySchema.parse({ limit: "15" });
    assert.equal(parsed.limit, 15);
  });

  it("rejects limit above 20", () => {
    assert.throws(() => forYouFeedQuerySchema.parse({ limit: 21 }));
  });

  it("accepts optional cursor", () => {
    const parsed = forYouFeedQuerySchema.parse({ cursor: "abc123" });
    assert.equal(parsed.cursor, "abc123");
  });
});

describe("recordProductViewBodySchema", () => {
  it("defaults empty body for signed-in POSTs", () => {
    const parsed = recordProductViewBodySchema.parse(undefined);
    assert.deepEqual(parsed, {});
  });

  it("accepts guest clientId", () => {
    const parsed = recordProductViewBodySchema.parse({
      clientId: "guest-device-abc12345",
    });
    assert.equal(parsed.clientId, "guest-device-abc12345");
  });

  it("rejects short clientId", () => {
    assert.throws(() =>
      recordProductViewBodySchema.parse({ clientId: "short" }),
    );
  });
});

describe("interest category helpers", () => {
  it("recognizes onboarding labels", () => {
    assert.equal(isInterestCategoryLabel("Fashion"), true);
    assert.equal(isInterestCategoryLabel("Shoes"), false);
  });

  it("filters profile interests to known categories", () => {
    const filtered = filterInterestCategoryLabels([
      "Fashion",
      "invalid",
      "Beauty",
    ]);
    assert.deepEqual(filtered, ["Fashion", "Beauty"]);
  });
});
