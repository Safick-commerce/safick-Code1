// Prisma ORM 7+ — CLI reads the database URL from here (not from schema.prisma).
// Supabase: use DIRECT_URL for migrate/introspection (direct Postgres); keep DATABASE_URL
// as the pooled string for runtime (database.ts → PrismaPg). See prisma.io Supabase guide.
import "dotenv/config";
import { defineConfig } from "prisma/config";

function prismaCliDatabaseUrl(): string {
  const direct = process.env.DIRECT_URL?.trim();
  if (direct) {
    assertNotSupabasePoolerForPrismaCli(direct, "DIRECT_URL");
    return direct;
  }

  const fallback = process.env.DATABASE_URL?.trim();
  if (fallback) {
    assertNotSupabasePoolerForPrismaCli(fallback, "DATABASE_URL");
    return fallback;
  }

  throw new Error(
    [
      "Set DIRECT_URL or DATABASE_URL in backend/.env.",
      "For Supabase, DIRECT_URL should be Direct connection (db.<ref>.supabase.co:5432).",
      "If Prisma fails with P1001 from your network (IPv6), use Session pooler as DIRECT_URL (*.pooler.supabase.com:5432, user postgres.<ref>).",
      "Keep DATABASE_URL as Transaction pooler :6543 for the running app (PrismaPg).",
    ].join(" "),
  );
}

/**
 * Block transaction pooler (:6543) for Prisma CLI. Session pooler (:5432 on pooler host) is OK
 * when `db.*` is unreachable — common on networks with poor IPv6 routing to Supabase.
 */
function assertNotSupabasePoolerForPrismaCli(url: string, varName: string): void {
  if (!/pooler\.supabase\.com/i.test(url)) return;

  const looksLikeSessionPort = /(^|[/:])5432(\/|$|[?#])/;
  if (looksLikeSessionPort.test(url)) return;

  throw new Error(
    [
      `${varName} uses Supabase Transaction pooler (port 6543). Prisma CLI needs Direct DB or Session pooler on port 5432.`,
      "Dashboard → Database → URI → Session pooler :5432 (user postgres.<project-ref>),",
      "or Direct db.<ref>.supabase.co if reachable (try appending ?sslmode=require).",
    ].join(" "),
  );
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
