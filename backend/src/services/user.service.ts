// =============================================================================
// User Service
// =============================================================================
// Contains all user-related business logic:
//   - Finding users by ID, email, or username
//   - Updating user profiles
//   - Completing the onboarding flow
//   - Username availability checking
//   - Building public profile data (excludes private fields)
//
// TODO: Implement each function in the next step
// =============================================================================

// --- User Lookup ---

/**
 * Finds a user by their database ID.
 * Returns the full user object (for authenticated endpoints like GET /users/me).
 *
 * @param id - The user's UUID
 * @returns The User record or null
 */
// export async function findById(id: string) { ... }

/**
 * Finds a user by email address.
 * Used during login and registration to check for existing accounts.
 *
 * @param email - The email to look up
 * @returns The User record or null
 */
// export async function findByEmail(email: string) { ... }

// --- Profile Updates ---

/**
 * Updates a user's profile fields.
 * Only allows updating specific fields (not email, role, etc.).
 *
 * Allowed fields: displayName, city, languagePref, avatarUrl, gender
 *
 * @param userId - The user's UUID
 * @param updates - Object with fields to update
 * @returns The updated User record
 */
// export async function updateProfile(userId: string, updates: Partial<...>) { ... }

// --- Onboarding ---

/**
 * Completes the onboarding flow for a user.
 * Sets username, gender, city, interests and marks onboardingCompleted = true.
 *
 * This is called once — after the user finishes all 4 onboarding steps
 * (or 3 steps for Google users who already have a name).
 *
 * Validates:
 *   - Username is unique
 *   - Username format is valid (lowercase, alphanumeric + dots/underscores, 3-30 chars)
 *   - At least 2 interests selected
 *   - City is a valid Cameroonian city
 *
 * @param userId - The user's UUID
 * @param data - { username, displayName?, gender, city, interests }
 * @returns The updated User record with onboardingCompleted = true
 * @throws AppError(409) if username is already taken
 */
// export async function completeOnboarding(userId: string, data: OnboardingData) { ... }

// --- Username ---

/**
 * Checks if a username is available (not taken by another user).
 * Called in real-time as the user types during onboarding.
 *
 * Also validates the username format:
 *   - 3-30 characters
 *   - Lowercase letters, numbers, dots (.) and underscores (_) only
 *   - Cannot start or end with a dot or underscore
 *   - No consecutive dots or underscores
 *
 * @param username - The username to check
 * @returns { available: boolean, reason?: string }
 */
// export async function checkUsernameAvailability(username: string) { ... }

// --- Public Profile ---

/**
 * Returns a user's public profile data (for seller pages, etc.).
 * Strips out private fields like email, passwordHash, googleId.
 *
 * Public fields: id, displayName, username, avatarUrl, city, role,
 *                isVerified, createdAt, lastActiveAt
 *
 * @param userId - The user's UUID
 * @returns Public-safe user data or null if user not found
 */
// export async function getPublicProfile(userId: string) { ... }
