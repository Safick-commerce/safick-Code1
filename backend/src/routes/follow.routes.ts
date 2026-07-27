// =============================================================================
// Follow routes — /api/follows/*
// =============================================================================
//   GET    /api/follows/me                 — list sellers the viewer follows (auth)
//   GET    /api/follows/check/:sellerId    — { following: boolean } (auth)
//   GET    /api/follows/counts/:sellerId   — public follower/following counts
//   POST   /api/follows/:sellerId          — follow seller (auth)
//   DELETE /api/follows/:sellerId          — unfollow seller (auth)
// =============================================================================

import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validateQuery } from "../middleware/validate";
import { followListQuerySchema } from "../types/follow";
import * as followController from "../controllers/follow.controller";

const router = Router();

router.get("/counts/:sellerId", followController.getFollowCounts);

router.use(requireAuth);

router.get("/me", validateQuery(followListQuerySchema), followController.listFollowing);
router.get("/check/:sellerId", followController.checkFollowing);
router.post("/:sellerId", followController.follow);
router.delete("/:sellerId", followController.unfollow);

export default router;
