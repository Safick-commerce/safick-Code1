// =============================================================================
// Auth Routes — /api/auth/*
// =============================================================================
// All authentication-related endpoints:
//   POST /api/auth/google    → Sign in with Google (new or returning user)
//   POST /api/auth/register  → Create account with email + password
//   POST /api/auth/login     → Sign in with email + password
//   POST /api/auth/refresh   → Get new access token using refresh token
//   POST /api/auth/logout    → Invalidate refresh token (end session)
//
// None of these routes require authentication (they CREATE the auth state).
//
// TODO: Wire up controllers and validation schemas in the next step
// =============================================================================

import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { validate } from "../middleware/validate";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyOtpSchema,
} from "../types";

const router = Router();

// Google OAuth — mobile app sends the Google ID token, we verify and create/find user
router.post("/google", authController.googleSignIn);

// Email/password registration — creates a new account
router.post("/register", authController.register);

// Email/password login — returns tokens for an existing account
router.post("/login", authController.login);

// Token refresh — exchanges a valid refresh token for a new access + refresh token pair
router.post("/refresh", authController.refreshToken);

// Logout — deletes the session (invalidates the refresh token)
router.post("/logout", authController.logout);

// Password reset — 4-digit OTP flow (no auth required)
router.post("/forgot-password", validate(forgotPasswordSchema), authController.forgotPassword);
router.post("/verify-otp", validate(verifyOtpSchema), authController.verifyOtp);
router.post("/reset-password", validate(resetPasswordSchema), authController.resetPassword);

export default router;
