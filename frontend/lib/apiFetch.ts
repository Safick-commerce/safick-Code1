import { supabase } from "./supabase";
import { getApiBaseUrl } from "./apiConfig";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

/** Authenticated JSON fetch against the Express API. */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  if (!token) {
    throw new ApiError("Not signed in", 401);
  }

  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("Authorization", `Bearer ${token}`);

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
      ? " On a real phone, localhost is the phone itself — set EXPO_PUBLIC_API_URL to your PC's LAN IP in frontend/.env (e.g. http://192.168.1.5:4000), then restart Expo."
      : " Ensure the backend is running (npm run dev in backend/), phone and PC are on the same Wi‑Fi, and Windows firewall allows port 4000.";
    throw new ApiError(`Network request failed.${hint}`, 0);
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
    throw new ApiError(message, res.status, data);
  }

  return data as T;
}
