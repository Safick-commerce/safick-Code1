// =============================================================================
// For You feed & product view — request validation + API response shapes
// =============================================================================
// Used by feed.routes (Step 6) and feed.service (Step 4).
// =============================================================================

import { z } from "zod";
import { INTEREST_CATEGORY_LABELS } from "../constants/interestCategories";

// Re-export for product create/update schemas in a later step.
export const productCategorySchema = z.enum(INTEREST_CATEGORY_LABELS);

export type ProductCategory = z.infer<typeof productCategorySchema>;

// -----------------------------------------------------------------------------
// GET /api/products/feed/for-you
// -----------------------------------------------------------------------------

export const forYouFeedQuerySchema = z.object({
  /** Opaque cursor from a previous response `nextCursor`; omit on first page. */
  cursor: z.string().trim().min(1).max(512).optional(),
  /** Page size (video items). Capped to protect mobile bandwidth. */
  limit: z.coerce.number().int().min(1).max(20).optional().default(10),
});

export type ForYouFeedQuery = z.infer<typeof forYouFeedQuerySchema>;

/** How the server built this page (for debugging / optional UI). */
export type ForYouFeedMode = "personalized" | "random";

export interface ForYouFeedSellerResponse {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  city: string | null;
}

export interface ForYouFeedItemResponse {
  id: string;
  title: string;
  description: string | null;
  price: string;
  category: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  seller: ForYouFeedSellerResponse;
  createdAt: string;
}

export interface ForYouFeedResponse {
  items: ForYouFeedItemResponse[];
  nextCursor: string | null;
  mode: ForYouFeedMode;
}

// -----------------------------------------------------------------------------
// POST /api/products/:id/view
// -----------------------------------------------------------------------------

export const productIdParamSchema = z.object({
  id: z.string().uuid("Invalid product id"),
});

export type ProductIdParam = z.infer<typeof productIdParamSchema>;

/**
 * Body for view tracking.
 * Signed-in users: `viewer_id` comes from JWT; `clientId` is ignored.
 * Guests: must send `clientId` (stable device id from the app).
 */
export const recordProductViewBodySchema = z
  .object({
    clientId: z
      .string()
      .trim()
      .min(8, "clientId must be at least 8 characters")
      .max(128, "clientId must be at most 128 characters")
      .optional(),
  })
  .default({});

export type RecordProductViewBody = z.infer<typeof recordProductViewBodySchema>;

export interface RecordProductViewResponse {
  ok: true;
  /** True when this watch was already counted inside the dedupe window. */
  duplicate: boolean;
}

// -----------------------------------------------------------------------------
// GET /api/products/seller/:sellerId/view-counts
// -----------------------------------------------------------------------------

export interface SellerProductViewCountsResponse {
  /** Total views per product id (includes products with zero views). */
  counts: Record<string, number>;
}
