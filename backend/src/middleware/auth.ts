// =============================================================================
// JWT Authentication Middleware
// =============================================================================
// Protects routes that require a logged-in user.
//
// How it works:
//   1. Client sends request with header: Authorization: Bearer <accessToken>
//   2. This middleware extracts the token, verifies it with the JWT secret
//   3. If valid, attaches the user's ID to req.userId so controllers can use it
//   4. If invalid/missing, responds with 401 Unauthorized
//
// Usage on routes:
//   import { requireAuth } from "@middleware/auth";
//   router.get("/users/me", requireAuth, userController.getMe);
//
// TODO: Implement in the next step (auth endpoints)
// =============================================================================

import { Request, Response, NextFunction } from "express";

// Extend Express Request to include userId after authentication
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

/**
 * Middleware that verifies the JWT access token from the Authorization header.
 * If valid, sets req.userId and calls next().
 * If invalid or missing, responds with 401.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  // TODO: Implement JWT verification logic
  // 1. Extract token from Authorization header
  // 2. Verify token with jwt.verify(token, env.JWT_ACCESS_SECRET)
  // 3. Set req.userId = decoded.userId
  // 4. Call next() on success, or res.status(401) on failure
  res.status(501).json({ error: "Auth middleware not implemented yet" });
}

/**
 * Optional auth middleware — does NOT reject unauthenticated requests.
 * If a valid token is present, sets req.userId. Otherwise, continues without it.
 * Useful for public endpoints that behave differently for logged-in users
 * (e.g., showing "liked" state on products).
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  // TODO: Implement — same as requireAuth but calls next() instead of 401
  next();
}
