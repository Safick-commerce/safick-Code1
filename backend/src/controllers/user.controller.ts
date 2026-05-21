// =============================================================================
// User Controller
// =============================================================================
// Thin HTTP layer: read req → call user.service → send JSON.
// Controllers should not contain business rules or direct Prisma calls.
//
// Pattern for every handler:
//   1. Extract params / body / req.userId (from requireAuth)
//   2. Delegate to user.service
//   3. res.status(...).json(...) or next(error) for global errorHandler
// =============================================================================

import { Request, Response, NextFunction } from "express";
import * as userService from "../services/user.service";
import { parseUuid } from "../utils/uuid";

/**
 * GET /api/users/me
 *
 * Returns the currently authenticated user's full profile.
 * Requires: Authorization: Bearer <Supabase access_token>
 * Response: { user: UserResponse }
 */
export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const user = await userService.getMeProfile(userId);
    if (!user) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/users/me
 *
 * Updates profile fields from the settings screen.
 * Requires: Authorization header
 * Body: Partial<{ displayName, city, avatarUrl, gender }> (see updateProfileSchema)
 * Response: { user: UserResponse }
 */
export async function updateMe(req: Request, res: Response, next: NextFunction) {
  // TODO: validate body → userService.updateProfile
  res.status(501).json({ error: "Not implemented yet" });
}

/**
 * PUT /api/users/me/onboarding
 *
 * Completes onboarding in one call (username, gender, city, interests).
 * Requires: Authorization header
 * Body: OnboardingInput (see onboardingSchema in types/index.ts)
 * Response: { user: UserResponse }
 */
export async function completeOnboarding(req: Request, res: Response, next: NextFunction) {
  // TODO: validate body → userService.completeOnboarding
  res.status(501).json({ error: "Not implemented yet" });
}

/**
 * GET /api/users/:id
 *
 * Public profile for seller / user pages. No auth required.
 * Response: { user: PublicUserResponse } or 404
 */
export async function getPublicProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseUuid(String(req.params.id));
    if (!id) {
      res.status(400).json({
        error: "Invalid user id",
        message: "Use a real profile UUID from Supabase (e.g. a1b2c3d4-e5f6-7890-abcd-ef1234567890).",
      });
      return;
    }

    const user = await userService.getPublicProfile(id);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/users/check-username/:username
 *
 * Real-time username availability (onboarding). No auth required.
 * Response: { available: boolean, reason?: string }
 */
export async function checkUsername(req: Request, res: Response, next: NextFunction) {
  try {
    const username = String(req.params.username);
    const result = await userService.checkUsernameAvailability(username);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
