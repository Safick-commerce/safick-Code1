// =============================================================================
// Environment Variable Validation
// =============================================================================
// Loads and validates all environment variables at startup using Zod.
// If any required variable is missing or invalid, the server crashes immediately
// with a clear error message — much better than discovering it at runtime.
//
// Usage in other files:
//   import { env } from "@config/env";
//   console.log(env.PORT); // Type-safe, guaranteed to exist
// =============================================================================

import { z } from "zod";
import dotenv from "dotenv";

// Load .env file into process.env
dotenv.config();

// Define the shape and validation rules for every env variable
const envSchema = z.object({
  // Server
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // Database
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid PostgreSQL connection string"),

  // Redis
  REDIS_URL: z.string().url("REDIS_URL must be a valid Redis connection string"),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  JWT_ACCESS_EXPIRY: z.string().default("15m"),
  JWT_REFRESH_EXPIRY: z.string().default("30d"),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required for Google Sign-In"),
  GOOGLE_ANDROID_CLIENT_ID: z.string().optional(),
  GOOGLE_IOS_CLIENT_ID: z.string().optional(),

  // CORS
  CORS_ORIGINS: z.string().default("http://localhost:8081,http://localhost:19006"),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),

  // Maviance S3P (Smobilpay) — payment provider
  // All optional at boot so the backend can run without Maviance configured (e.g. for local UI work).
  // Service-layer code throws a clear AppError when these are missing but checkout is attempted.
  MAVIANCE_S3P_BASE_URL: z.string().url().optional(),
  MAVIANCE_S3P_API_USER: z.string().optional(),
  MAVIANCE_S3P_API_PASSWORD: z.string().optional(),
  MAVIANCE_S3P_PUBLIC_KEY: z.string().optional(),
  MAVIANCE_S3P_WEBHOOK_SECRET: z.string().optional(),
  // Maviance assigns per-merchant service IDs per telco; collect and disburse are separate.
  MAVIANCE_SERVICE_ID_MTN_COLLECT: z.string().optional(),
  MAVIANCE_SERVICE_ID_ORANGE_COLLECT: z.string().optional(),
  MAVIANCE_SERVICE_ID_EXPRESS_UNION_COLLECT: z.string().optional(),
  MAVIANCE_SERVICE_ID_CARD_COLLECT: z.string().optional(),
  MAVIANCE_SERVICE_ID_MTN_CASHIN: z.string().optional(),
  MAVIANCE_SERVICE_ID_ORANGE_CASHIN: z.string().optional(),

  // Escrow timing
  ESCROW_AUTO_RELEASE_DAYS: z.coerce.number().int().min(1).default(7),

  // Admin moderation surface — header-based gate on POST /api/admin/* endpoints.
  // Optional so the backend boots without it; admin routes 503 until it is set.
  ADMIN_API_KEY: z.string().min(16).optional(),
  // Optional Slack-compatible webhook to ping when a buyer opens a dispute.
  OPS_DISPUTE_WEBHOOK_URL: z.string().url().optional(),
});

// Validate process.env against the schema
// If validation fails, the error will list every missing/invalid variable
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

// Export the validated, type-safe env object
export const env = parsed.data;

// Export the type so other files can reference it
export type Env = z.infer<typeof envSchema>;
