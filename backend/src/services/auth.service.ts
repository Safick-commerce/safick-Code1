// =============================================================================
// Auth Service — Supabase password sign-in (proxied for rate limiting)
// =============================================================================

import { AppError } from "../middleware/errorHandler";
import { prisma } from "../config/database";
import { getSupabaseAnonClient } from "../utils/supabaseJwt";

const USERNAME_REGEX = /^[a-z0-9][a-z0-9._]{1,28}[a-z0-9]$/;

function sanitizeUsername(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9._]/g, "");
}

/** Resolve email or username to a Supabase auth email. */
export async function resolveLoginEmail(identifier: string): Promise<string> {
  const trimmed = identifier.trim();
  if (!trimmed) {
    throw new AppError("Invalid login credentials", 401);
  }

  if (trimmed.includes("@")) {
    return trimmed.toLowerCase();
  }

  const username = sanitizeUsername(trimmed);
  if (username.length < 3 || !USERNAME_REGEX.test(username)) {
    throw new AppError("Invalid login credentials", 401);
  }

  const profile = await prisma.profiles.findFirst({
    where: { username },
    select: { email: true },
  });

  const email = profile?.email?.trim().toLowerCase();
  if (!email) {
    throw new AppError("Invalid login credentials", 401);
  }

  return email;
}

export type LoginResult = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: { id: string; email: string | undefined };
};

export async function loginWithPassword(identifier: string, password: string): Promise<LoginResult> {
  const client = getSupabaseAnonClient();
  const email = await resolveLoginEmail(identifier);

  const { data, error } = await client.auth.signInWithPassword({ email, password });

  if (error) {
    const lower = error.message.toLowerCase();
    if (/rate limit|too many|429/.test(lower)) {
      throw new AppError("Too many sign-in attempts. Please try again later.", 429);
    }
    throw new AppError("Invalid login credentials", 401);
  }

  if (!data.session || !data.user) {
    throw new AppError("Could not start session", 500);
  }

  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresIn: data.session.expires_in ?? 3600,
    user: {
      id: data.user.id,
      email: data.user.email,
    },
  };
}
