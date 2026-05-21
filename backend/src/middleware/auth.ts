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
