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

// POST /api/auth/forgot-password — send 4-digit OTP to email
export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

// POST /api/auth/verify-otp — verify 4-digit OTP, return reset token
export const verifyOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
  code: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "Verification code must be 4 digits"),
});

// POST /api/auth/reset-password — set new password using reset token
export const resetPasswordSchema = z.object({
  resetToken: z.string().min(1, "Reset token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128)
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
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
  bio: z.string().max(500).optional(),
  phone: z.string().max(32).optional(),
  city: z.string().min(1).optional(),
  languagePref: z.enum(["en", "fr"]).optional(),
  avatarUrl: z.string().url().optional(),
  coverImageUrl: z.string().url().optional(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
});

// =============================================================================
// Response Types — what the API returns to the frontend
// =============================================================================

// User object returned in API responses (private — GET /api/users/me)
export interface UserResponse {
  id: string;
  email: string;
  username: string | null;
  displayName: string | null;
  bio: string | null;
  phone: string | null;
  gender: string | null;
  city: string | null;
  interests: string[];
  avatarUrl: string | null;
  coverImageUrl: string | null;
  role: string;
  languagePref: string;
  onboardingCompleted: boolean;
  isVerified: boolean;
  createdAt: string;
  lastActiveAt: string;
}

// Auth endpoint response shape
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
  isNewUser: boolean;
}

// Public user profile (seller pages — no email, phone, or gender)
export interface PublicUserResponse {
  id: string;
  username: string | null;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  coverImageUrl: string | null;
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
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// =============================================================================
// Conversation / message schemas
// =============================================================================

export const openConversationSchema = z.object({
  productId: z.string().uuid("Invalid product id"),
});

export const sendMessageBodySchema = z.object({
  text: z.string().trim().min(1).max(4000),
  clientId: z.string().max(64).optional(),
});

export const listMessagesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export interface ConversationPeerResponse {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface ConversationLastMessageResponse {
  body: string;
  createdAt: string;
  senderId: string;
}

export interface ConversationResponse {
  id: string;
  productId: string;
  productTitle: string;
  productImageUrl: string | null;
  productPrice: number;
  buyerId: string;
  sellerId: string;
  peer: ConversationPeerResponse;
  lastMessage: ConversationLastMessageResponse | null;
  createdAt: string;
  lastMessageAt: string | null;
}

export type ConversationListItemResponse = ConversationResponse;

export interface MessageResponse {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
}

export type OpenConversationInput = z.infer<typeof openConversationSchema>;
export type SendMessageBodyInput = z.infer<typeof sendMessageBodySchema>;
