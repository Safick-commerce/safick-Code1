// This script checks the database tables for the backend
// it is used to check if the database tables are created and if they are not it will create them
//cd backend
//npm run db:check
//That runs the script to check the database tables

import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const label = process.argv[2] ?? "DATABASE_URL";
const connectionString = process.env[label]?.trim();
if (!connectionString) {
  console.error(`${label} is not set`);
  process.exit(1);
}

const pool = new pg.Pool({ connectionString });

try {
  const parsed = new URL(connectionString.replace(/^postgresql:/, "http:"));
  console.log(`[${label}] host:`, parsed.hostname);
  console.log(`[${label}] database:`, parsed.pathname.replace(/^\//, "") || "(default)");

  const tables = await pool.query(`
    SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_name IN ('conversations', 'messages', 'products', 'profiles')
    ORDER BY table_schema, table_name
  `);
  console.log(`[${label}] target tables:`, tables.rows.length ? tables.rows : "(none found)");

  const publicTables = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);
  console.log(
    `[${label}] all public tables:`,
    publicTables.rows.map((r) => r.table_name).join(", ") || "(none)",
  );
} catch (error) {
  console.error("Query failed:", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
