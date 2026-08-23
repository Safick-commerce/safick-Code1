/// <reference types="node" />

// Prisma ORM 7+ — CLI reads the database URL from here (not from schema.prisma).
import "dotenv/config";
import { defineConfig } from "prisma/config";

function prismaCliDatabaseUrl(): string {
  const direct = process.env.DIRECT_URL?.trim();
  if (direct) return direct;

  const fallback = process.env.DATABASE_URL?.trim();
  if (fallback) return fallback;

  throw new Error("Set DIRECT_URL or DATABASE_URL in backend/.env.");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: prismaCliDatabaseUrl(),
  },
});
