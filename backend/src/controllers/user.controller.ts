// =============================================================================
// User Controller
// =============================================================================
// Handles HTTP request/response for user profile and onboarding endpoints.
// Controllers are thin — they extract data from the request, call the service
// layer for business logic, and format the response.
//
// TODO: Implement each handler in the next step
// =============================================================================

import { Request, Response, NextFunction } from "express";

/**
 * GET /api/users/me
 *
 * Returns the currently authenticated user's full profile.
 * Used on app launch to restore the user session.
 *
 * Requires: Authorization header with valid access token
 * Response: { user: User }
 */
export async function getMe(req: Request, res: Response, next: NextFunction) {
  // TODO: Implement
  // 1. Get userId from req.userId (set by requireAuth middleware)
  // 2. Call userService.findById(userId)
  // 3. Return { user }
  res.status(501).json({ error: "Not implemented yet" });
}

/**
 * PUT /api/users/me
 *
 * Updates the current user's profile fields.
 * Used from the profile settings screen (change name, city, avatar, etc.).
 *
 * Requires: Authorization header
 * Request body: Partial<{ displayName, city, languagePref, avatarUrl }>
 * Response: { user: User }
 */
export async function updateMe(req: Request, res: Response, next: NextFunction) {
  // TODO: Implement
  // 1. Get userId from req.userId
  // 2. Validate request body with Zod schema (only allowed fields)
  // 3. Call userService.updateProfile(userId, updates)
  // 4. Return { user }
  res.status(501).json({ error: "Not implemented yet" });
}

/**
 * PUT /api/users/me/onboarding
 *
 * Completes the onboarding flow — sets username, gender, city, interests
 * in a single request and marks onboardingCompleted = true.
 *
 * For Google users: displayName may already be set from Google, but
 * the user can edit it. Username is always required (picked during onboarding).
 *
 * Requires: Authorization header
 * Request body: { username, displayName?, gender, city, interests }
 * Response: { user: User }
 */
export async function completeOnboarding(req: Request, res: Response, next: NextFunction) {
  // TODO: Implement
  // 1. Get userId from req.userId
  // 2. Validate request body with onboarding Zod schema
  // 3. Check username uniqueness
  // 4. Call userService.completeOnboarding(userId, data)
  // 5. Return { user }
  res.status(501).json({ error: "Not implemented yet" });
}

/**
 * GET /api/users/:id
 *
 * Returns a user's public profile (for seller profile pages).
 * Only returns public fields (no email, no auth details).
 *
 * No auth required — anyone can view a seller's public profile.
 * Response: { user: PublicUser }
 */
export async function getPublicProfile(req: Request, res: Response, next: NextFunction) {
  // TODO: Implement
  // 1. Get id from req.params.id
  // 2. Call userService.getPublicProfile(id)
  // 3. Return { user } (only public fields: displayName, username, avatar, city, etc.)
  res.status(501).json({ error: "Not implemented yet" });
}

/**
 * GET /api/users/check-username/:username
 *
 * Checks if a username is available.
 * Called in real-time as the user types during onboarding.
 *
 * No auth required — needs to work before account exists.
 * Response: { available: boolean }
 */
export async function checkUsername(req: Request, res: Response, next: NextFunction) {
  // TODO: Implement
  // 1. Get username from req.params.username
  // 2. Validate format (lowercase, alphanumeric + dots/underscores, 3-30 chars)
  // 3. Check if username exists in database
  // 4. Return { available: boolean }
  res.status(501).json({ error: "Not implemented yet" });
}
