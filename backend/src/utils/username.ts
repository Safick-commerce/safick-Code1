// =============================================================================
// Username validation (shared rules)
// =============================================================================
// Pure functions — no database, no Express. Easy to unit-test (see tests/username.test.ts).
//
// Keep in sync with the mobile app:
//   - frontend/context/AuthContext.tsx
//   - frontend/app/(tabs)/edit_profile.tsx
//   - backend/src/types/index.ts (onboardingSchema regex)
//
// Supabase enforces uniqueness via profiles_username_unique index; this module
// gives friendly feedback before the user submits the form.
// =============================================================================

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;

/** Lowercase letters, numbers, dots, underscores; 3–30 chars; no leading/trailing . or _ */
export const USERNAME_REGEX = /^[a-z0-9][a-z0-9._]{1,28}[a-z0-9]$/;

export type UsernameFormatResult =
  | { valid: true; normalized: string }
  | { valid: false; reason: string };

/** Trim and lowercase before any validation or DB lookup. */
export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

/**
 * Validate username format only (does not check the database).
 * Call checkUsernameAvailability in user.service for uniqueness.
 */
export function validateUsernameFormat(raw: string): UsernameFormatResult {
  const normalized = normalizeUsername(raw);

  if (normalized.length < USERNAME_MIN_LENGTH) {
    return {
      valid: false,
      reason: `Username must be at least ${USERNAME_MIN_LENGTH} characters`,
    };
  }

  if (normalized.length > USERNAME_MAX_LENGTH) {
    return {
      valid: false,
      reason: `Username must be at most ${USERNAME_MAX_LENGTH} characters`,
    };
  }

  if (!USERNAME_REGEX.test(normalized)) {
    return {
      valid: false,
      reason:
        "Username can only contain lowercase letters, numbers, dots, and underscores",
    };
  }

  return { valid: true, normalized };
}
