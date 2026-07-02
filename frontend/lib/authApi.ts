import { getApiBaseUrl } from "./apiConfig";

export class AuthApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = "AuthApiError";
  }
}

/** Unauthenticated JSON fetch for auth endpoints (password reset flow). */
export async function authApiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  const baseUrl = getApiBaseUrl();
  let res: Response;
  try {
    res = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers,
    });
  } catch {
    const localhost =
      baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1");
    const hint = localhost
      ? " On a real phone, set EXPO_PUBLIC_API_URL to your PC's LAN IP in frontend/.env."
      : " Ensure the backend is running and reachable from this device.";
    throw new AuthApiError(`Network request failed.${hint}`, 0);
  }

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const message =
      typeof data === "object" && data && "error" in data && typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : `Request failed (${res.status})`;
    throw new AuthApiError(message, res.status, data);
  }

  return data as T;
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  return authApiFetch("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function verifyOtp(email: string, code: string): Promise<{ resetToken: string }> {
  return authApiFetch("/api/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
}

export async function resetPassword(
  resetToken: string,
  password: string,
): Promise<{ success: true }> {
  return authApiFetch("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ resetToken, password }),
  });
}
