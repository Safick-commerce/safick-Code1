/** Short-lived reset token between verify-otp and reset-password screens. */
let pendingResetToken: string | null = null;

export function setPendingResetToken(token: string): void {
  pendingResetToken = token;
}

export function consumePendingResetToken(): string | null {
  const token = pendingResetToken;
  pendingResetToken = null;
  return token;
}

export function clearPendingResetToken(): void {
  pendingResetToken = null;
}
