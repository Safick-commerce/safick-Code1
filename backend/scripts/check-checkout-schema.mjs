// Inspects which checkout-related tables and columns exist in the live DB.
// Run with: node scripts/check-checkout-schema.mjs

import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const url = process.env.DIRECT_URL?.trim() ?? process.env.DATABASE_URL?.trim();
if (!url) {
  console.error("DIRECT_URL / DATABASE_URL not set");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: url });

try {
  const expected = ["addresses", "checkouts", "orders", "order_items", "payouts"];
  for (const t of expected) {
    const r = await pool.query(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position`,
      [t],
    );
    if (r.rows.length === 0) {
      console.log(`MISSING table: public.${t}`);
    } else {
      console.log(`OK table: public.${t} (${r.rows.length} cols)`);
    }
  }

  console.log("\n--- profiles payout columns ---");
  const profCols = await pool.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name IN ('payout_momo_number','payout_momo_operator','payout_bank_account') ORDER BY column_name`,
  );
  console.log(profCols.rows.map((r) => r.column_name).join(", ") || "(none)");

  console.log("\n--- messages new columns ---");
  const msgCols = await pool.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='messages' AND column_name IN ('message_type','order_id') ORDER BY column_name`,
  );
  console.log(msgCols.rows.map((r) => r.column_name).join(", ") || "(none)");
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
