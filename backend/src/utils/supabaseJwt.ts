// =============================================================================
// Supabase access token helpers
// =============================================================================
// Mobile app sends: Authorization: Bearer <session.access_token>
//
// Verification (first match wins):
//   1. SUPABASE_URL + SUPABASE_ANON_KEY → supabase.auth.getUser(token) [recommended]
//   2. SUPABASE_JWT_SECRET → local HS256 jwt.verify (legacy projects)
// =============================================================================

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import { parseUuid } from "./uuid";

type SupabaseAccessClaims = jwt.JwtPayload & {
  sub?: string;
  role?: string;
};

export type AuthVerifyFailure =
  | "not_configured"
  | "missing_header"
  | "missing_bearer"
  | "invalid_token"
  | "wrong_role"
  | "invalid_user_id";

export type AuthVerifyResult =
  | { ok: true; userId: string }
  | { ok: false; reason: AuthVerifyFailure; hint?: string };

let supabaseAuthClient: SupabaseClient | null = null;

function getSupabaseAuthClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL?.trim();
  const anonKey = process.env.SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;

  if (!supabaseAuthClient) {
    supabaseAuthClient = createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }
  return supabaseAuthClient;
}

/** Anon Supabase client for server-side password sign-in. */
export function getSupabaseAnonClient(): SupabaseClient {
  const client = getSupabaseAuthClient();
  if (!client) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_ANON_KEY are required for password sign-in",
    );
  }
  return client;
}

function getSupabaseJwtSecret(): string | null {
  const secret = process.env.SUPABASE_JWT_SECRET?.trim();
  return secret || null;
}

export function extractBearerToken(authorizationHeader: string | undefined): string | null {
  if (!authorizationHeader) return null;

  const [scheme, token] = authorizationHeader.trim().split(/\s+/);
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;

  return token;
}

export function isSupabaseAuthConfigured(): boolean {
  return Boolean(getSupabaseAuthClient() || getSupabaseJwtSecret());
}

function verifyWithJwtSecret(token: string): AuthVerifyResult {
  const secret = getSupabaseJwtSecret();
  if (!secret) {
    return { ok: false, reason: "not_configured" };
  }

  try {
    const payload = jwt.verify(token, secret, {
      algorithms: ["HS256"],
    }) as SupabaseAccessClaims;

    if (payload.role !== "authenticated") {
      return {
        ok: false,
        reason: "wrong_role",
        hint: "Token role is not 'authenticated' — use session.access_token, not the anon key.",
      };
    }

    const userId = payload.sub ? parseUuid(payload.sub) : null;
    if (!userId) {
      return { ok: false, reason: "invalid_user_id" };
    }

    return { ok: true, userId };
  } catch (error) {
    const name = error instanceof Error ? error.name : "Error";
    const hint =
      name === "TokenExpiredError"
        ? "Token expired — log in again in the app and copy a fresh access_token."
        : name === "JsonWebTokenError"
          ? "Bad signature — SUPABASE_JWT_SECRET must match Supabase Dashboard → Settings → API → JWT Secret."
          : "Could not verify token with SUPABASE_JWT_SECRET.";

    return { ok: false, reason: "invalid_token", hint };
  }
}

async function verifyWithSupabaseApi(token: string): Promise<AuthVerifyResult> {
  const client = getSupabaseAuthClient();
  if (!client) {
    return { ok: false, reason: "not_configured" };
  }

  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) {
    return {
      ok: false,
      reason: "invalid_token",
      hint:
        error?.message ??
        "Supabase rejected the token — use session.access_token from a logged-in app session.",
    };
  }

  const userId = parseUuid(data.user.id);
  if (!userId) {
    return { ok: false, reason: "invalid_user_id" };
  }

  return { ok: true, userId };
}

/** Verify access token and return auth user id (= profiles.id). */
export async function verifySupabaseAccessToken(token: string): Promise<AuthVerifyResult> {
  if (getSupabaseAuthClient()) {
    return verifyWithSupabaseApi(token);
  }
  return verifyWithJwtSecret(token);
}

export async function verifyAuthorizationHeader(
  authorizationHeader: string | undefined,
): Promise<AuthVerifyResult> {
  if (!isSupabaseAuthConfigured()) {
    return {
      ok: false,
      reason: "not_configured",
      hint: "Set SUPABASE_URL + SUPABASE_ANON_KEY (same as frontend) or SUPABASE_JWT_SECRET in backend/.env.",
    };
  }

  if (!authorizationHeader?.trim()) {
    return {
      ok: false,
      reason: "missing_header",
      hint: 'Add header: Authorization: Bearer <session.access_token>',
    };
  }

  const token = extractBearerToken(authorizationHeader);
  if (!token) {
    return {
      ok: false,
      reason: "missing_bearer",
      hint: 'Format must be: Authorization: Bearer <token> (not just the token alone).',
    };
  }

  return verifySupabaseAccessToken(token);
}

/** @deprecated sync helper — prefer verifyAuthorizationHeader */
export function getUserIdFromAuthorizationHeader(
  authorizationHeader: string | undefined,
): string | null {
  const token = extractBearerToken(authorizationHeader);
  if (!token || !getSupabaseJwtSecret()) return null;
  const result = verifyWithJwtSecret(token);
  return result.ok ? result.userId : null;
}

export function authFailureMessage(result: Extract<AuthVerifyResult, { ok: false }>): string {
  switch (result.reason) {
    case "missing_header":
      return "Missing Authorization header.";
    case "missing_bearer":
      return "Authorization header must be: Bearer <access_token>.";
    case "not_configured":
      return result.hint ?? "Supabase auth is not configured on the server.";
    case "wrong_role":
      return result.hint ?? "Invalid token type.";
    case "invalid_user_id":
      return "Token user id is not a valid UUID.";
    case "invalid_token":
    default:
      return result.hint ?? "Invalid or expired access token.";
  }
}
