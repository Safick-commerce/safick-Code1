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
import * as passwordResetService from "../services/passwordReset.service";

/**
 * POST /api/auth/google
 *
 * Receives a Google ID token from the mobile app, verifies it,
 * and returns JWT tokens + user data.
 *
 * Request body: { idToken: string }
 * Response: { accessToken, refreshToken, user, isNewUser }
 */
export async function googleSignIn(req: Request, res: Response, next: NextFunction) {
  // TODO: Implement
  // 1. Extract idToken from req.body
  // 2. Call authService.verifyGoogleToken(idToken) → { email, name, googleId }
  // 3. Call authService.findOrCreateGoogleUser({ email, name, googleId })
  // 4. Call authService.generateTokens(user.id) → { accessToken, refreshToken }
  // 5. Return { accessToken, refreshToken, user, isNewUser }
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
export async function register(req: Request, res: Response, next: NextFunction) {
  // TODO: Implement
  // 1. Validate request body with Zod schema
  // 2. Check if email is already taken
  // 3. Hash password with bcrypt
  // 4. Create user in database
  // 5. Generate tokens
  // 6. Return { accessToken, refreshToken, user, isNewUser: true }
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
  // TODO: Implement
  // 1. Find user by email
  // 2. If no user found → 401 "Invalid credentials"
  // 3. If user has no passwordHash → 400 "Please sign in with Google"
  // 4. Compare password with hash using bcrypt
  // 5. Generate tokens
  // 6. Return { accessToken, refreshToken, user }
  res.status(501).json({ error: "Not implemented yet" });
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
export async function refreshToken(req: Request, res: Response, next: NextFunction) {
  // TODO: Implement
  // 1. Find session by refreshToken
  // 2. Check if session is expired
  // 3. Delete old session
  // 4. Create new session with new refresh token
  // 5. Generate new access token
  // 6. Return { accessToken, refreshToken }
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
export async function logout(req: Request, res: Response, next: NextFunction) {
  // TODO: Implement
  // 1. Extract refreshToken from req.body
  // 2. Delete session from database
  // 3. Return { success: true }
  res.status(501).json({ error: "Not implemented yet" });
}

/**
 * POST /api/auth/forgot-password
 *
 * Generates a 4-digit OTP, stores a bcrypt hash, and emails the code.
 *
 * Request body: { email: string }
 * Response: { message: string }
 */
export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body as { email: string };
    const result = await passwordResetService.requestPasswordReset(email);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/verify-otp
 *
 * Validates the 4-digit OTP and returns a short-lived reset token.
 *
 * Request body: { email: string, code: string }
 * Response: { resetToken: string }
 */
export async function verifyOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, code } = req.body as { email: string; code: string };
    const result = await passwordResetService.verifyPasswordResetOtp(email, code);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/reset-password
 *
 * Validates the reset token and updates the user's password via Supabase admin API.
 *
 * Request body: { resetToken: string, password: string }
 * Response: { success: true }
 */
export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { resetToken, password } = req.body as { resetToken: string; password: string };
    const result = await passwordResetService.resetPasswordWithToken(resetToken, password);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
