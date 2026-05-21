import { describe, it } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import {
  authFailureMessage,
  extractBearerToken,
  verifyAuthorizationHeader,
  verifySupabaseAccessToken,
} from "../src/utils/supabaseJwt";

const TEST_SECRET = "test-supabase-jwt-secret-for-unit-tests-only";
const TEST_USER_ID = "a1b2c3d4-e5f6-4789-abcd-ef1234567890";

describe("extractBearerToken", () => {
  it("parses a Bearer token", () => {
    assert.equal(extractBearerToken("Bearer abc.def.ghi"), "abc.def.ghi");
  });

  it("returns null for missing header", () => {
    assert.equal(extractBearerToken(undefined), null);
  });
});

describe("verifySupabaseAccessToken (JWT secret fallback)", () => {
  it("returns user id for a valid authenticated token", async () => {
    const prevSecret = process.env.SUPABASE_JWT_SECRET;
    const prevUrl = process.env.SUPABASE_URL;
    const prevAnon = process.env.SUPABASE_ANON_KEY;

    process.env.SUPABASE_JWT_SECRET = TEST_SECRET;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_ANON_KEY;

    const token = jwt.sign(
      { sub: TEST_USER_ID, role: "authenticated" },
      TEST_SECRET,
      { algorithm: "HS256", expiresIn: "1h" },
    );

    const result = await verifySupabaseAccessToken(token);
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.userId, TEST_USER_ID);

    process.env.SUPABASE_JWT_SECRET = prevSecret;
    if (prevUrl) process.env.SUPABASE_URL = prevUrl;
    else delete process.env.SUPABASE_URL;
    if (prevAnon) process.env.SUPABASE_ANON_KEY = prevAnon;
    else delete process.env.SUPABASE_ANON_KEY;
  });
});

describe("verifyAuthorizationHeader", () => {
  it("reports missing Authorization header", async () => {
    const result = await verifyAuthorizationHeader(undefined);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(authFailureMessage(result), /Missing Authorization/i);
    }
  });
});
