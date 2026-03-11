// =============================================================================
// Auth Service
// =============================================================================
// Contains all authentication business logic:
//   - Google ID token verification
//   - Password hashing and comparison (bcrypt)
//   - JWT access/refresh token generation
//   - Session creation and management
//   - User lookup/creation for OAuth flows
//
// This is where the actual work happens. Controllers call these functions
// and handle the HTTP request/response layer.
//
// TODO: Implement each function in the next step
// =============================================================================

// --- Google Token Verification ---

/**
 * Verifies a Google ID token using the google-auth-library.
 * Returns the user's Google profile data if the token is valid.
 *
 * @param idToken - The ID token from GoogleSignIn on the mobile app
 * @returns { email, name, googleId, avatarUrl }
 * @throws AppError(401) if the token is invalid or expired
 */
// export async function verifyGoogleToken(idToken: string) { ... }

// --- Password Hashing ---

/**
 * Hashes a plain-text password using bcrypt (12 salt rounds).
 * Used during email/password registration.
 *
 * @param password - The plain-text password from the user
 * @returns The bcrypt hash string
 */
// export async function hashPassword(password: string): Promise<string> { ... }

/**
 * Compares a plain-text password against a bcrypt hash.
 * Used during email/password login.
 *
 * @param password - The plain-text password from the login form
 * @param hash - The stored bcrypt hash from the database
 * @returns true if the password matches, false otherwise
 */
// export async function comparePassword(password: string, hash: string): Promise<boolean> { ... }

// --- JWT Token Generation ---

/**
 * Generates a short-lived JWT access token (15 minutes).
 * Contains the user's ID in the payload.
 * Sent with every API request in the Authorization header.
 *
 * @param userId - The user's database ID
 * @returns The signed JWT access token string
 */
// export function generateAccessToken(userId: string): string { ... }

/**
 * Generates a long-lived refresh token (30 days).
 * Stored in the Session table (hashed) and on the client.
 * Used to get new access tokens without re-authentication.
 *
 * @returns The plain-text refresh token string (hash this before storing in DB)
 */
// export function generateRefreshToken(): string { ... }

// --- Session Management ---

/**
 * Creates a new session with a refresh token for the user.
 * Called after successful login (Google or email/password).
 *
 * @param userId - The user's database ID
 * @param refreshToken - The plain-text refresh token (will be hashed before storage)
 * @returns The created Session record
 */
// export async function createSession(userId: string, refreshToken: string) { ... }

/**
 * Finds a session by its refresh token.
 * Used during token refresh to validate the token.
 *
 * @param refreshToken - The plain-text refresh token from the client
 * @returns The Session record or null if not found
 */
// export async function findSessionByToken(refreshToken: string) { ... }

/**
 * Deletes a session (logout or token rotation).
 *
 * @param sessionId - The session's database ID
 */
// export async function deleteSession(sessionId: string) { ... }

// --- User Lookup for OAuth ---

/**
 * Finds an existing user by Google ID or email, or creates a new one.
 * Used during Google Sign-In flow.
 *
 * Logic:
 *   1. Look up by googleId → found = returning Google user
 *   2. Look up by email → found = user exists with email/password, link Google account
 *   3. Not found → create new user with Google profile data
 *
 * @param googleProfile - { email, name, googleId, avatarUrl }
 * @returns { user, isNewUser }
 */
// export async function findOrCreateGoogleUser(googleProfile: {...}) { ... }
