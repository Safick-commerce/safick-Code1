// =============================================================================
// User Routes — /api/users/*
// =============================================================================
// User profile and onboarding endpoints:
//   GET  /api/users/me              → Get current user's profile
//   PUT  /api/users/me              → Update current user's profile (name, city, etc.)
//   PUT  /api/users/me/onboarding   → Complete onboarding (set username, gender, city, interests)
//   GET  /api/users/:id             → Get another user's public profile (for seller pages)
//   GET  /api/users/check-username/:username → Check if a username is available
//
// Implemented: check-username, public profile by id, GET /me (Supabase JWT).
// TODO: requireAuth is wired; implement PUT /me and PUT /me/onboarding.
// =============================================================================

import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import * as userController from "../controllers/user.controller";

const router = Router();

// Username check MUST be registered before /:id or Express treats "check-username" as an id.
router.get("/check-username/:username", userController.checkUsername);

// Current user's profile (requires login)
router.get("/me", requireAuth, userController.getMe);
router.put("/me", requireAuth, userController.updateMe);

// Onboarding completion — sets username, gender, city, interests in one call
router.put("/me/onboarding", requireAuth, userController.completeOnboarding);

// Seller payout destination — capturable from onboarding or settings.
router.get("/me/payout", requireAuth, userController.getPayout);
router.put("/me/payout", requireAuth, userController.updatePayout);

// Public profile — used on seller profile pages (no auth required)
router.get("/:id", userController.getPublicProfile);

export default router;
