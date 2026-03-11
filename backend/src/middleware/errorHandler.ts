// =============================================================================
// Global Error Handler
// =============================================================================
// Catches all errors thrown in route handlers and sends a consistent JSON response.
// Without this, unhandled errors would crash the server or leak stack traces.
//
// How it works:
//   - Express calls this when next(error) is called or an async handler throws
//   - It formats the error into a consistent { error, message, statusCode } shape
//   - In development, it includes the stack trace for debugging
//   - In production, it hides internal details from the client
//
// Usage:
//   This is registered as the LAST middleware in app.ts:
//   app.use(errorHandler);
//
//   In controllers, throw AppError for known errors:
//   throw new AppError("Email already taken", 409);
// =============================================================================

import { Request, Response, NextFunction } from "express";

/**
 * Custom error class for known/expected errors (bad input, not found, etc.).
 * Throw this in controllers and services to return a specific HTTP status code.
 *
 * Example:
 *   throw new AppError("User not found", 404);
 *   throw new AppError("Email already taken", 409);
 *   throw new AppError("Invalid password", 401);
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Distinguishes expected errors from unexpected crashes
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Express error-handling middleware (4 arguments = error handler).
 * Formats all errors into a consistent JSON response.
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Default to 500 Internal Server Error for unexpected errors
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err instanceof AppError ? err.message : "Internal server error";

  // Log the full error in development, just the message in production
  if (process.env.NODE_ENV === "development") {
    console.error(`[ERROR] ${req.method} ${req.path}:`, err);
  } else {
    console.error(`[ERROR] ${req.method} ${req.path}: ${err.message}`);
  }

  res.status(statusCode).json({
    error: message,
    // Only include the stack trace in development (never expose in production)
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}
