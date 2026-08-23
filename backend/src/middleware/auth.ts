// =============================================================================
// Supabase JWT Authentication Middleware
// =============================================================================
// Protects routes that require a logged-in user.
//
// The Expo app authenticates with Supabase and sends the access token as:
//   Authorization: Bearer <supabase_access_token>
//
// This middleware verifies that JWT locally (HS256 + SUPABASE_JWT_SECRET).
// It does not call the Supabase API and does not use Prisma User/Session.
//
// On success, req.userId is the Supabase user id (`sub` claim).
// On missing/invalid/expired token, responds 401 { error: "Unauthorized" }.
// =============================================================================

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

// Extend Express Request to include userId after authentication
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

function unauthorized(res: Response): void {
  res.status(401).json({ error: "Unauthorized" });
}

function extractBearerToken(header: string | undefined): string | null {
  if (!header) return null;
  const [scheme, ...rest] = header.split(" ");
  if (scheme !== "Bearer" || rest.length === 0) return null;
  const token = rest.join(" ").trim();
  return token.length > 0 ? token : null;
}

/**
 * Verifies a Supabase access token locally.
 * Returns the `sub` (Supabase user UUID) or null if verification fails.
 */
function userIdFromSupabaseToken(token: string): string | null {
  try {
    const decoded = jwt.verify(token, env.SUPABASE_JWT_SECRET, {
      algorithms: ["HS256"],
    });

    if (typeof decoded === "string") return null;
    if (typeof decoded.sub !== "string" || decoded.sub.length === 0) return null;

    return decoded.sub;
  } catch {
    return null;
  }
}

/**
 * Middleware that verifies the Supabase JWT from the Authorization header.
 * If valid, sets req.userId and calls next().
 * If invalid or missing, responds with 401.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractBearerToken(req.headers.authorization);
  if (!token) {
    unauthorized(res);
    return;
  }

  const userId = userIdFromSupabaseToken(token);
  if (!userId) {
    unauthorized(res);
    return;
  }

  req.userId = userId;
  next();
}

/**
 * Optional auth middleware — does NOT reject unauthenticated requests.
 * If a valid token is present, sets req.userId. Otherwise, continues without it.
 * Useful for public endpoints that behave differently for logged-in users
 * (e.g., showing "liked" state on products).
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractBearerToken(req.headers.authorization);
  if (token) {
    const userId = userIdFromSupabaseToken(token);
    if (userId) {
      req.userId = userId;
    }
  }
  next();
}
