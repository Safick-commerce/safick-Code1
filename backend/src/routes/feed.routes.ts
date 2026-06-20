// =============================================================================
// Product feed routes — /api/products/*
// =============================================================================
//   GET  /api/products/feed/for-you              — optional auth, query: cursor?, limit?
//   GET  /api/products/seller/:sellerId/view-counts — public aggregate for profile grids
//   POST /api/products/:id/view                  — optional auth, body: { clientId? }
//
// Register /feed/for-you before /:id so Express does not treat "feed" as an id.
// =============================================================================

import { Router } from "express";
import { optionalAuth } from "../middleware/auth";
import { validate, validateQuery } from "../middleware/validate";
import * as feedController from "../controllers/feed.controller";
import {
  forYouFeedQuerySchema,
  recordProductViewBodySchema,
} from "../types/feed";

const router = Router();

router.get(
  "/feed/for-you",
  optionalAuth,
  validateQuery(forYouFeedQuerySchema),
  feedController.getForYouFeed,
);

router.get(
  "/seller/:sellerId/view-counts",
  feedController.getSellerProductViewCounts,
);

router.post(
  "/:id/view",
  optionalAuth,
  validate(recordProductViewBodySchema),
  feedController.recordProductView,
);

export default router;
