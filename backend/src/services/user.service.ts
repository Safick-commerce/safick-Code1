// =============================================================================
// User Service
// =============================================================================
// Business logic for profiles — no HTTP here (that's the controller's job).
//
// Data source: public.profiles (Supabase), synced via Prisma after db pull.
// profiles.id matches auth.users.id from Supabase Auth.
//
// Layering:
//   Route → Controller → Service (this file) → prisma.profiles → PostgreSQL
//
// Implemented: username check, public profile, response mappers.
// Next: updateProfile, completeOnboarding (after requireAuth uses Supabase JWT).
// =============================================================================

import type { ProfileRow } from "../types/prisma";
import { prisma } from "../config/database";
import { AppError } from "../middleware/errorHandler";
import type {
  PublicUserResponse,
  SellerPayoutInput,
  SellerPayoutResponse,
  UserResponse,
} from "../types";
import { Prisma } from "../generated/prisma";
import { validateUsernameFormat } from "../utils/username";

// =============================================================================
// Types
// =============================================================================

/** Returned by checkUsernameAvailability — matches frontend onboarding hints. */
export type UsernameAvailabilityResult = {
  available: boolean;
  reason?: string;
};

export type CheckUsernameOptions = {
  /** When editing profile, treat this user's current username as available. */
  excludeUserId?: string;
};

// =============================================================================
// Lookups
// =============================================================================

/**
 * Load a profile by primary key.
 * Same UUID Supabase assigns on sign-up (profiles.id → auth.users.id).
 */
export async function findProfileById(id: string): Promise<ProfileRow | null> {
  return prisma.profiles.findUnique({
    where: { id },
  });
}

// =============================================================================
// Username availability (onboarding / edit profile)
// =============================================================================

/**
 * Check whether a username is free to use.
 *
 * Steps:
 *   1. Validate format (length, allowed chars) — no DB hit if invalid.
 *   2. Query profiles for a matching username (case-normalized to lowercase).
 *
 * Used by GET /api/users/check-username/:username
 */
export async function checkUsernameAvailability(
  rawUsername: string,
  options: CheckUsernameOptions = {},
): Promise<UsernameAvailabilityResult> {
  const format = validateUsernameFormat(rawUsername);
  if (!format.valid) {
    return { available: false, reason: format.reason };
  }

  const existing = await prisma.profiles.findFirst({
    where: {
      username: format.normalized,
      ...(options.excludeUserId ? { NOT: { id: options.excludeUserId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    return { available: false, reason: "Username is already taken" };
  }

  return { available: true };
}

// =============================================================================
// Public profile (seller pages)
// =============================================================================

/**
 * Full profile for GET /api/users/me (authenticated — includes private fields).
 */
export async function getMeProfile(userId: string): Promise<UserResponse | null> {
  const profile = await findProfileById(userId);
  if (!profile) return null;
  return toUserResponse(profile);
}

/**
 * Public-safe profile for GET /api/users/:id.
 * Omits email, phone, and gender via toPublicUserResponse.
 */
export async function getPublicProfile(userId: string): Promise<PublicUserResponse | null> {
  const profile = await findProfileById(userId);
  if (!profile) return null;
  return toPublicUserResponse(profile);
}

// =============================================================================
// Response mappers — DB snake_case → API camelCase
// =============================================================================
// Prisma introspection uses column names from Postgres (snake_case).
// The mobile app expects camelCase in JSON (UserResponse / PublicUserResponse).

/** Full profile for authenticated endpoints (GET /api/users/me). */
export function toUserResponse(profile: ProfileRow): UserResponse {
  return {
    id: profile.id,
    email: profile.email ?? "",
    username: profile.username,
    displayName: profile.display_name ?? profile.full_name,
    bio: profile.bio,
    phone: profile.phone,
    gender: profile.gender,
    city: profile.city,
    interests: profile.interests ?? [],
    avatarUrl: profile.avatar_url,
    coverImageUrl: profile.cover_image_url,
    role: profile.role,
    languagePref: "en", // profiles table has no language column yet — default for MVP
    onboardingCompleted: profile.onboarding_completed,
    isVerified: false, // future feature — not on profiles row today
    createdAt: profile.created_at.toISOString(),
    lastActiveAt: (profile.updated_at ?? profile.created_at).toISOString(),
  };
}

/** Subset of fields safe to expose without authentication (no email / phone / gender). */
export function toPublicUserResponse(profile: ProfileRow): PublicUserResponse {
  return {
    id: profile.id,
    username: profile.username,
    displayName: profile.display_name ?? profile.full_name,
    bio: profile.bio,
    avatarUrl: profile.avatar_url,
    coverImageUrl: profile.cover_image_url,
    city: profile.city,
    role: profile.role,
    isVerified: false,
    createdAt: profile.created_at.toISOString(),
    lastActiveAt: (profile.updated_at ?? profile.created_at).toISOString(),
  };
}

// =============================================================================
// Helpers
// =============================================================================

// =============================================================================
// Seller payout destination (PUT /api/users/me/payout)
// =============================================================================
// =============================================================================
// Seller payout settings — MoMo only (Maviance S3P cashin).
// =============================================================================

function toSellerPayoutResponse(profile: ProfileRow): SellerPayoutResponse {
  return {
    payoutMomoNumber: profile.payout_momo_number ?? null,
    payoutMomoOperator:
      profile.payout_momo_operator === "mtn" || profile.payout_momo_operator === "orange"
        ? profile.payout_momo_operator
        : null,
  };
}

export async function getSellerPayout(userId: string): Promise<SellerPayoutResponse> {
  const profile = await findProfileById(userId);
  assertProfileExists(profile);
  return toSellerPayoutResponse(profile);
}

export async function updateSellerPayout(
  userId: string,
  input: SellerPayoutInput,
): Promise<SellerPayoutResponse> {
  const profile = await findProfileById(userId);
  assertProfileExists(profile);

  const updated = await prisma.profiles.update({
    where: { id: userId },
    data: {
      payout_momo_number: input.payoutMomoNumber,
      payout_momo_operator: input.payoutMomoOperator,
      // Clear any legacy bank destination — MVP pays out via MoMo only.
      payout_bank_account: Prisma.JsonNull,
    },
  });
  return toSellerPayoutResponse(updated);
}

/** Throw AppError(404) when a profile lookup returned null — use in protected routes. */
export function assertProfileExists(
  profile: ProfileRow | null,
  message = "User not found",
): asserts profile is ProfileRow {
  if (!profile) {
    throw new AppError(message, 404);
  }
}
