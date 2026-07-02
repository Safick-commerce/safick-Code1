// =============================================================================
// Email Service — nodemailer transport for transactional emails
// =============================================================================

import nodemailer from "nodemailer";
import type Transporter from "nodemailer/lib/mailer";

let transporter: Transporter | null = null;

function isSmtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASS?.trim(),
  );
}

function getTransporter(): Transporter {
  if (!transporter) {
    const host = process.env.SMTP_HOST!.trim();
    const port = Number(process.env.SMTP_PORT) || 587;
    const secure = process.env.SMTP_SECURE === "true" || port === 465;

    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user: process.env.SMTP_USER!.trim(),
        pass: process.env.SMTP_PASS!.trim(),
      },
    });
  }
  return transporter;
}

function getFromAddress(): string {
  return process.env.SMTP_FROM?.trim() || process.env.SMTP_USER?.trim() || "noreply@safick.com";
}

/** Sends a 4-digit password reset OTP to the user's email. */
export async function sendPasswordResetOtpEmail(email: string, code: string): Promise<void> {
  const subject = "Your Safick password reset code";
  const text = `Your Safick password reset code is: ${code}\n\nThis code expires in 10 minutes. If you did not request this, you can ignore this email.`;
  const html = `
    <p>Your Safick password reset code is:</p>
    <p style="font-size: 28px; font-weight: bold; letter-spacing: 6px;">${code}</p>
    <p>This code expires in 10 minutes. If you did not request this, you can ignore this email.</p>
  `;

  if (!isSmtpConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[email] SMTP not configured — password reset OTP for ${email}: ${code}`);
      return;
    }
    throw new Error("Email service is not configured");
  }

  await getTransporter().sendMail({
    from: getFromAddress(),
    to: email,
    subject,
    text,
    html,
  });
}
