// =============================================================================
// Auth Controller
// =============================================================================
// Handles HTTP request/response for auth endpoints.
// Controllers are thin — they extract data from the request, call the service
// layer for business logic, and format the response.
//
// The actual auth logic (password hashing, Google token verification, JWT
// generation) lives in services/auth.service.ts.
//
// TODO: Implement each handler in the next step
// =============================================================================

import { Request, Response, NextFunction } from "express";
import * as authService from "../services/auth.service";
import type { LoginInput } from "../types";

export async function googleSignIn(_req: Request, res: Response, _next: NextFunction) {
  res.status(501).json({ error: "Not implemented yet" });
}

/**
 * POST /api/auth/register
 *
 * Creates a new user account with email and password.
 * The user must complete onboarding afterward.
 *
 * Request body: { name: string, email: string, password: string }
 * Response: { accessToken, refreshToken, user, isNewUser: true }
 */
  // TODO: Implement
  // 1. Validate request body with Zod schema
  // 2. Check if email is already taken
  // 3. Hash password with bcrypt
  // 4. Create user in database
  // 5. Generate tokens
  // 6. Return { accessToken, refreshToken, user, isNewUser: true }
export async function register(_req: Request, res: Response, _next: NextFunction) {
  res.status(501).json({ error: "Not implemented yet" });
}

/**
 * POST /api/auth/login
 *
 * Signs in an existing user with email and password.
 * If the user signed up with Google only (no password), returns an error
 * telling them to use Google Sign-In.
 *
 * Request body: { email: string, password: string }
 * Response: { accessToken, refreshToken, user }
 */
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { identifier, password } = req.body as LoginInput;
    const result = await authService.loginWithPassword(identifier, password);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/refresh
 *
 * Exchanges a valid refresh token for a new access + refresh token pair.
 * The old refresh token is invalidated (rotation for security).
 *
 * Request body: { refreshToken: string }
 * Response: { accessToken, refreshToken }
 */
  // TODO: Implement
  // 1. Find session by refreshToken
  // 2. Check if session is expired
  // 3. Delete old session
  // 4. Create new session with new refresh token
  // 5. Generate new access token
  // 6. Return { accessToken, refreshToken }
export async function refreshToken(_req: Request, res: Response, _next: NextFunction) {
  res.status(501).json({ error: "Not implemented yet" });
}

/**
 * POST /api/auth/logout
 *
 * Invalidates the refresh token by deleting the session.
 * The access token will expire naturally (short-lived).
 *
 * Request body: { refreshToken: string }
 * Response: { success: true }
 */
  // TODO: Implement
  // 1. Extract refreshToken from req.body
  // 2. Delete session from database
  // 3. Return { success: true }
export async function logout(_req: Request, res: Response, _next: NextFunction) {
  res.status(501).json({ error: "Not implemented yet" });
}
