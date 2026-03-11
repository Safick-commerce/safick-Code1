// =============================================================================
// Shared Types & Validation Schemas
// =============================================================================
// Contains TypeScript types and Zod validation schemas used across the backend.
// These types mirror what the frontend expects in API responses.
//
// Zod schemas serve double duty:
//   1. Runtime validation (in the validate middleware)
//   2. TypeScript type inference (via z.infer<typeof schema>)
//
// When adding new endpoints, define the request/response schemas here
// so they're reusable across routes, controllers, and tests.
// =============================================================================

import { z } from "zod";

// =============================================================================
// Auth Schemas — request validation for auth endpoints
// =============================================================================

// POST /api/auth/google — mobile app sends the Google ID token
export const googleSignInSchema = z.object({
  idToken: z.string().min(1, "Google ID token is required"),
});

// POST /api/auth/register — new account with email + password
export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").max(128),
});

// POST /api/auth/login — existing account sign-in
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// POST /api/auth/refresh — token refresh
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

// =============================================================================
// User Schemas — request validation for user endpoints
// =============================================================================

// Username format: lowercase, alphanumeric + dots/underscores, 3-30 chars
// Matches the frontend regex in OnboardingScreen: /[^a-z0-9._]/g
const usernameRegex = /^[a-z0-9][a-z0-9._]{1,28}[a-z0-9]$/;

// PUT /api/users/me/onboarding — completes the onboarding flow
export const onboardingSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(usernameRegex, "Username can only contain lowercase letters, numbers, dots, and underscores"),
  displayName: z.string().min(2).max(100).optional(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]),
  city: z.string().min(1, "City is required"),
  interests: z
    .array(z.string())
    .min(2, "Select at least 2 interests"),
});

// PUT /api/users/me — profile updates (from settings screen)
export const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(100).optional(),
  city: z.string().min(1).optional(),
  languagePref: z.enum(["en", "fr"]).optional(),
  avatarUrl: z.string().url().optional(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
});

// =============================================================================
// Response Types — what the API returns to the frontend
// =============================================================================

// User object returned in API responses (excludes sensitive fields)
export interface UserResponse {
  id: string;
  email: string;
  username: string | null;
  displayName: string | null;
  gender: string | null;
  city: string | null;
  interests: string[];
  avatarUrl: string | null;
  role: string;
  languagePref: string;
  onboardingCompleted: boolean;
  isVerified: boolean;
  createdAt: string; // ISO date string
  lastActiveAt: string;
}

// Auth endpoint response shape
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
  isNewUser: boolean;
}

// Public user profile (for seller pages — even less data than UserResponse)
export interface PublicUserResponse {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  city: string | null;
  role: string;
  isVerified: boolean;
  createdAt: string;
  lastActiveAt: string;
}

// =============================================================================
// Inferred Types — automatically derived from Zod schemas
// =============================================================================
// Use these when you need the TypeScript type for a validated request body.
// Example: const data: OnboardingInput = req.body;
// =============================================================================

export type GoogleSignInInput = z.infer<typeof googleSignInSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
