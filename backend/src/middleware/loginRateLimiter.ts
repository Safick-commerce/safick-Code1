// =============================================================================
// Login rate limiter — POST /api/auth/login only
// =============================================================================
// Counts failed sign-in attempts per IP + identifier (email/username).
// Successful logins are not counted (skipSuccessfulRequests).
// =============================================================================

import rateLimit from "express-rate-limit";
import type { Request } from "express";

const WINDOW_MS = Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
const MAX_ATTEMPTS = Number(process.env.LOGIN_RATE_LIMIT_MAX) || 5;

function loginRateLimitKey(req: Request): string {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const body = req.body as { identifier?: string; email?: string } | undefined;
  const raw = (body?.identifier ?? body?.email ?? "").trim().toLowerCase();
  return `${ip}:${raw || "unknown"}`;
}

export const loginRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: MAX_ATTEMPTS,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: loginRateLimitKey,
  message: {
    error: "Too many sign-in attempts. Please try again in 15 minutes.",
  },
});
