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
