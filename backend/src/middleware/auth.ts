// =============================================================================
// JWT Authentication Middleware
// =============================================================================
// Verifies Supabase access tokens (not custom backend JWT — auth stays on Supabase).
//
// Client header: Authorization: Bearer <session.access_token>
// On success: req.userId = Supabase auth user UUID (= profiles.id)
// =============================================================================

import { Request, Response, NextFunction } from "express";
import {
  authFailureMessage,
  isSupabaseAuthConfigured,
  verifyAuthorizationHeader,
} from "../utils/supabaseJwt";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!isSupabaseAuthConfigured()) {
    res.status(503).json({
      error: "Auth not configured",
      message:
        "Set SUPABASE_URL + SUPABASE_ANON_KEY (same as frontend/.env) or SUPABASE_JWT_SECRET in backend/.env.",
    });
    return;
  }

  const result = await verifyAuthorizationHeader(req.headers.authorization);
  if (!result.ok) {
    res.status(401).json({
      error: "Unauthorized",
      message: authFailureMessage(result),
    });
    return;
  }

  req.userId = result.userId;
  next();
}

/**
 * Admin-only header check. The MVP does not have a separate admin login —
 * ops calls the endpoint with `x-admin-token: <ADMIN_API_KEY>`. This is the
 * minimum bar for an MVP refund / moderation API and lets us ship without
 * a separate admin auth surface. Replace with a proper role-based check
 * when an admin UI lands post-launch.
 */
export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) {
    res.status(503).json({
      error: "Admin endpoint disabled",
      message: "Set ADMIN_API_KEY in the backend environment to enable admin actions.",
    });
    return;
  }
  const provided = req.headers["x-admin-token"];
  if (typeof provided !== "string" || provided !== expected) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}

export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  if (isSupabaseAuthConfigured()) {
    const result = await verifyAuthorizationHeader(req.headers.authorization);
    if (result.ok) req.userId = result.userId;
  }
  next();
}
