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

import { PrismaClient } from "@prisma/client";

// In development, store the client on the global object so it survives hot reloads.
// In production, just create a new client — the server only starts once.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
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
