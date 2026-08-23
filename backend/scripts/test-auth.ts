/**
 * Smoke-test requireAuth against GET /api/users/me.
 *
 * Signs a dummy HS256 JWT with SUPABASE_JWT_SECRET, then:
 *   1. Sends a valid Bearer token (must get past 401)
 *   2. Sends no token (must be 401)
 *   3. Sends a garbage token (must be 401)
 *
 * From the backend directory:
 *   npx tsx scripts/test-auth.ts
 *
 * Requires backend/.env with SUPABASE_JWT_SECRET (and the other env vars
 * validated at startup). Does not need a real Supabase session.
 */

import http from "http";
import jwt from "jsonwebtoken";
import app from "../src/app";
import { env } from "../src/config/env";

const TEST_USER_ID = "test-user-id";
const PATH = "/api/users/me";

function signDummyAccessToken(): string {
  return jwt.sign({ sub: TEST_USER_ID }, env.SUPABASE_JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: "5m",
  });
}

function request(
  port: number,
  headers: Record<string, string>
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path: PATH,
        method: "GET",
        headers,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk as Buffer));
        res.on("end", () => {
          resolve({
            status: res.statusCode ?? 0,
            body: Buffer.concat(chunks).toString("utf8"),
          });
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

async function main() {
  const token = signDummyAccessToken();

  const server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Could not determine test server port");
  }
  const { port } = address;

  try {
    const authed = await request(port, { Authorization: `Bearer ${token}` });
    const missing = await request(port, {});
    const garbage = await request(port, { Authorization: "Bearer not-a-jwt" });

    const authedPassed = authed.status !== 401;
    const missingRejected = missing.status === 401;
    const garbageRejected = garbage.status === 401;

    console.log(`Protected route: GET ${PATH}`);
    console.log(
      `Valid token:     status ${authed.status}  ${authedPassed ? "PASS (got past 401)" : "FAIL (still 401)"}  body=${authed.body}`
    );
    console.log(
      `Missing token:   status ${missing.status}  ${missingRejected ? "PASS (401)" : "FAIL (expected 401)"}  body=${missing.body}`
    );
    console.log(
      `Garbage token:   status ${garbage.status}  ${garbageRejected ? "PASS (401)" : "FAIL (expected 401)"}  body=${garbage.body}`
    );

    if (authedPassed && missingRejected && garbageRejected) {
      console.log("\nrequireAuth smoke test: all checks passed.");
      process.exitCode = 0;
    } else {
      console.log("\nrequireAuth smoke test: one or more checks failed.");
      process.exitCode = 1;
    }
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
}

main().catch((err) => {
  console.error("requireAuth smoke test crashed:", err);
  process.exit(1);
});
