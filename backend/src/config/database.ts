// =============================================================================
// Prisma Client Singleton
// =============================================================================
// Prisma ORM 7+ uses a PostgreSQL driver adapter (node-pg). Connection URLs:
//   - Runtime (this file): DATABASE_URL — Supabase transaction pooler
//   - CLI (migrate, db pull): prisma.config.ts → DIRECT_URL
//
// Client types are generated to src/generated/prisma — run npm run db:generate
// after schema changes so prisma.profiles and other delegates exist in the IDE.
// =============================================================================

import dotenv from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma";

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Add it to backend/.env (see .env.example).");
}

function databaseHost(url: string): string | null {
  try {
    return new URL(url.replace(/^postgresql:/, "http:")).hostname;
  } catch {
    return null;
  }
}

const runtimeDbHost = databaseHost(connectionString);
const directUrl = process.env.DIRECT_URL?.trim();
const directDbHost = directUrl ? databaseHost(directUrl) : null;

if (
  runtimeDbHost &&
  directDbHost &&
  runtimeDbHost !== directDbHost &&
  (runtimeDbHost.endsWith("prisma.io") || directDbHost.includes("supabase.co"))
) {
  throw new Error(
    [
      `DATABASE_URL host (${runtimeDbHost}) does not match DIRECT_URL host (${directDbHost}).`,
      "The API uses DATABASE_URL at runtime; your Supabase tables live on DIRECT_URL.",
      "Fix backend/.env: set DATABASE_URL to Supabase Transaction pooler (port 6543, ?pgbouncer=true).",
      "For local dev only, you can temporarily set DATABASE_URL to the same value as DIRECT_URL.",
    ].join(" "),
  );
}

const adapter = new PrismaPg({
  connectionString,
  // Supabase uses TLS; if you see SSL errors locally, try:
  // ssl: { rejectUnauthorized: false },
});

function createPrismaClient() {
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

type PrismaClientInstance = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientInstance | undefined;
};

/** Singleton — types come from src/generated/prisma (npm run db:generate). */
export const prisma: PrismaClientInstance =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export type { PrismaClientInstance };
