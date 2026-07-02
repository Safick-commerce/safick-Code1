// =============================================================================
// Password Reset Service — OTP generation, verification, and Supabase password update
// =============================================================================

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../config/database";
import { AppError } from "../middleware/errorHandler";
import { sendPasswordResetOtpEmail } from "./email.service";
import { getSupabaseAdminClient } from "../utils/supabaseAdmin";

const OTP_EXPIRY_MS = 10 * 60 * 1000;
const BCRYPT_ROUNDS = 10;
const RESET_TOKEN_EXPIRY = "15m";

export const PASSWORD_RESET_PURPOSE = "password_reset";

export type PasswordResetTokenPayload = {
  email: string;
  purpose: typeof PASSWORD_RESET_PURPOSE;
  otpId: string;
};

/** Generates a random 4-digit OTP string (1000–9999). */
export function generateOtpCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export function getPasswordResetTokenSecret(): string {
  const secret =
    process.env.PASSWORD_RESET_TOKEN_SECRET?.trim() ||
    process.env.SUPABASE_JWT_SECRET?.trim() ||
    process.env.JWT_ACCESS_SECRET?.trim();

  if (!secret) {
    throw new AppError("Password reset is not configured", 503);
  }

  return secret;
}

export function signPasswordResetToken(payload: PasswordResetTokenPayload): string {
  return jwt.sign(payload, getPasswordResetTokenSecret(), { expiresIn: RESET_TOKEN_EXPIRY });
}

export function verifyPasswordResetToken(token: string): PasswordResetTokenPayload {
  try {
    const decoded = jwt.verify(token, getPasswordResetTokenSecret()) as PasswordResetTokenPayload;
    if (decoded.purpose !== PASSWORD_RESET_PURPOSE || !decoded.email || !decoded.otpId) {
      throw new AppError("Invalid or expired reset token", 401);
    }
    return decoded;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Invalid or expired reset token", 401);
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

const GENERIC_RESET_MESSAGE =
  "If an account exists for this email, a verification code has been sent.";

/** Step 1: generate OTP, store hash, email the code. */
export async function requestPasswordReset(email: string): Promise<{ message: string }> {
  const normalizedEmail = normalizeEmail(email);

  const user = await prisma.users.findFirst({
    where: { email: normalizedEmail, deleted_at: null },
    select: { id: true },
  });

  if (!user) {
    return { message: GENERIC_RESET_MESSAGE };
  }

  await prisma.password_reset_otps.deleteMany({
    where: { email: normalizedEmail },
  });

  const code = generateOtpCode();
  const hashedCode = await bcrypt.hash(code, BCRYPT_ROUNDS);

  await prisma.password_reset_otps.create({
    data: {
      email: normalizedEmail,
      hashed_code: hashedCode,
      expires_at: new Date(Date.now() + OTP_EXPIRY_MS),
      verified: false,
    },
  });

  await sendPasswordResetOtpEmail(normalizedEmail, code);

  return { message: GENERIC_RESET_MESSAGE };
}

/** Step 2: verify OTP and return a short-lived reset JWT. */
export async function verifyPasswordResetOtp(
  email: string,
  code: string,
): Promise<{ resetToken: string }> {
  const normalizedEmail = normalizeEmail(email);
  const trimmedCode = code.trim();

  const record = await prisma.password_reset_otps.findFirst({
    where: {
      email: normalizedEmail,
      verified: false,
      expires_at: { gt: new Date() },
    },
    orderBy: { created_at: "desc" },
  });

  if (!record) {
    throw new AppError("Invalid or expired verification code", 400);
  }

  const valid = await bcrypt.compare(trimmedCode, record.hashed_code);
  if (!valid) {
    throw new AppError("Invalid or expired verification code", 400);
  }

  await prisma.password_reset_otps.update({
    where: { id: record.id },
    data: { verified: true },
  });

  const resetToken = signPasswordResetToken({
    email: normalizedEmail,
    purpose: PASSWORD_RESET_PURPOSE,
    otpId: record.id,
  });

  return { resetToken };
}

/** Step 3: validate reset token and update password via Supabase admin API. */
export async function resetPasswordWithToken(
  resetToken: string,
  password: string,
): Promise<{ success: true }> {
  const payload = verifyPasswordResetToken(resetToken);

  const record = await prisma.password_reset_otps.findFirst({
    where: {
      id: payload.otpId,
      email: payload.email,
      verified: true,
      expires_at: { gt: new Date() },
    },
  });

  if (!record) {
    throw new AppError("Invalid or expired reset token", 401);
  }

  const user = await prisma.users.findFirst({
    where: { email: payload.email, deleted_at: null },
    select: { id: true },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const admin = getSupabaseAdminClient();
  const { error } = await admin.auth.admin.updateUserById(user.id, { password });

  if (error) {
    console.error("[passwordReset] Supabase admin updateUserById failed:", error.message);
    throw new AppError("Could not reset password. Please try again.", 500);
  }

  await prisma.password_reset_otps.delete({ where: { id: record.id } });

  return { success: true };
}
