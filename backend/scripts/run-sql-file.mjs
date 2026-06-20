// Executes a SQL file against DIRECT_URL (or DATABASE_URL if DIRECT_URL is unset).
// Wraps the whole file in a single transaction. Re-runnable when the SQL is idempotent.
//
// Usage: node scripts/run-sql-file.mjs prisma/sql/2026_05_28_checkout_escrow.sql

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: node scripts/run-sql-file.mjs <sql-file>");
  process.exit(1);
}

const url = process.env.DIRECT_URL?.trim() || process.env.DATABASE_URL?.trim();
if (!url) {
  console.error("Neither DIRECT_URL nor DATABASE_URL is set.");
  process.exit(1);
}

const sql = readFileSync(resolve(filePath), "utf8");
const masked = new URL(url.replace(/^postgresql:/, "http:"));
console.log(`Connecting to ${masked.hostname} (${masked.pathname.replace(/^\//, "") || "default"})...`);

const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  await client.query("BEGIN");
  await client.query(sql);
  await client.query("COMMIT");
  console.log(`OK: ${filePath} applied.`);
} catch (e) {
  await client.query("ROLLBACK").catch(() => {});
  console.error("Migration failed, rolled back:");
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
