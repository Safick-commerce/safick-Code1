// =============================================================================
// Prisma Client Singleton
// =============================================================================
// Creates a single shared instance of the Prisma client for the entire app.
// In development, this prevents creating too many database connections when
// the server is restarted by the file watcher (tsx watch).
//
// Usage in other files:
//   import { prisma } from "@config/database";
//   const user = await prisma.user.findUnique({ where: { id } });
// =============================================================================

import dotenv from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Add it to backend/.env.");
}

// In development, store the client on the global object so it survives hot reloads.
// In production, just create a new client — the server only starts once.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const adapter = new PrismaPg({ connectionString });

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    // Log queries in development for debugging
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

// Only cache the client on the global object in development
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
