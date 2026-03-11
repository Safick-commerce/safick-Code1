// =============================================================================
// Request Validation Middleware (Zod)
// =============================================================================
// Validates incoming request data (body, params, query) against a Zod schema
// BEFORE the controller runs. If validation fails, returns 400 with error details.
//
// This keeps controllers clean — they can trust that req.body is already validated.
//
// Usage on routes:
//   import { validate } from "@middleware/validate";
//   import { registerSchema } from "../types";
//
//   router.post("/auth/register", validate(registerSchema), authController.register);
//
// The schema should define what shape req.body (or req.query/req.params) must have.
// =============================================================================

import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

/**
 * Creates a middleware that validates req.body against the given Zod schema.
 * If validation passes, the parsed (and type-safe) data replaces req.body.
 * If validation fails, returns 400 with details about what's wrong.
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // parse() throws ZodError if validation fails
      // It also strips unknown fields and applies transforms/defaults
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod errors into a readable list for the client
        const errors = error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));

        res.status(400).json({
          error: "Validation failed",
          details: errors,
        });
        return;
      }
      next(error);
    }
  };
}

/**
 * Same as validate(), but for query parameters instead of body.
 * Useful for GET requests with filters, pagination, etc.
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));

        res.status(400).json({
          error: "Validation failed",
          details: errors,
        });
        return;
      }
      next(error);
    }
  };
}
