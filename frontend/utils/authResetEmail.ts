/** Supabase Auth blocks OTP resends for ~60s; match common error text without showing a timer. */
export function isAuthEmailRateLimited(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("60 second") ||
    lower.includes("rate limit") ||
    lower.includes("too many") ||
    lower.includes("over_email_send_rate_limit") ||
    lower.includes("429")
  );
}
