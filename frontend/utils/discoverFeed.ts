import { getApiBaseUrl } from "../lib/apiConfig";
import { fetchWithTimeout, isFetchTimeoutError } from "../lib/fetchWithTimeout";
import { ApiError } from "../lib/apiFetch";
import { supabase } from "../lib/supabase";
import type { ForYouFeedItem } from "./forYouFeed";

export type DiscoverFeedResponse = {
  items: ForYouFeedItem[];
  nextCursor: string | null;
};

async function optionalAuthFetch<T>(
  path: string,
  init: RequestInit = {},
  timeoutMs?: number,
): Promise<T> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const baseUrl = getApiBaseUrl();
  let res: Response;
  try {
    res = await fetchWithTimeout(`${baseUrl}${path}`, { ...init, headers }, timeoutMs);
  } catch (e) {
    if (isFetchTimeoutError(e)) {
      throw new ApiError(
        "Safick API timed out. Phone and PC must be on the same network, or update EXPO_PUBLIC_API_URL to your PC IP (ipconfig). Tunnel mode only loads the app — not the API.",
        0,
      );
    }
    throw new ApiError(
      "Could not reach the Safick API. Check EXPO_PUBLIC_API_URL and that the backend is running.",
      0,
    );
  }

  const text = await res.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!res.ok) {
    const message =
      typeof payload === "object" &&
      payload &&
      "error" in payload &&
      typeof (payload as { error: unknown }).error === "string"
        ? (payload as { error: string }).error
        : `Request failed (${res.status})`;
    throw new ApiError(message, res.status, payload);
  }

  return payload as T;
}

/** GET /api/products/feed/discover — optional auth, category filter. */
export async function fetchDiscoverFeed(options?: {
  category?: string | null;
  cursor?: string;
  limit?: number;
  timeoutMs?: number;
}): Promise<DiscoverFeedResponse> {
  const params = new URLSearchParams();
  if (options?.category) params.set("category", options.category);
  if (options?.cursor) params.set("cursor", options.cursor);
  if (options?.limit != null) params.set("limit", String(options.limit));
  const qs = params.toString();

  const data = await optionalAuthFetch<DiscoverFeedResponse>(
    `/api/products/feed/discover${qs ? `?${qs}` : ""}`,
    {},
    options?.timeoutMs,
  );

  return {
    items: data.items ?? [],
    nextCursor: data.nextCursor ?? null,
  };
}
