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
// All routes except check-username require authentication (requireAuth middleware).
//
// TODO: Wire up controllers and validation schemas in the next step
// =============================================================================

import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import * as userController from "../controllers/user.controller";

const router = Router();

// Current user's profile (requires login)
router.get("/me", requireAuth, userController.getMe);
router.put("/me", requireAuth, userController.updateMe);

// Onboarding completion — sets username, gender, city, interests in one call
router.put("/me/onboarding", requireAuth, userController.completeOnboarding);

// Public profile — used on seller profile pages (no auth required)
router.get("/:id", userController.getPublicProfile);

// Username availability check — called while user types in the username field
// No auth required so it can be checked before account creation
router.get("/check-username/:username", userController.checkUsername);

export default router;
