import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiBaseUrl } from "../lib/apiConfig";
import { ApiError } from "../lib/apiFetch";
import { supabase } from "../lib/supabase";

const FOR_YOU_CLIENT_ID_KEY = "safick:for_you_client_id";

export type ForYouFeedMode = "personalized" | "random";

export type ForYouFeedSeller = {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  city: string | null;
};

export type ForYouFeedItem = {
  id: string;
  title: string;
  description: string | null;
  price: string;
  category: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  seller: ForYouFeedSeller;
  createdAt: string;
};

export type ForYouFeedResponse = {
  items: ForYouFeedItem[];
  nextCursor: string | null;
  mode: ForYouFeedMode;
};

export type RecordProductViewResponse = {
  ok: true;
  duplicate: boolean;
};

export type SellerProductViewCountsResponse = {
  counts: Record<string, number>;
};

/** Stable anonymous id for guest view tracking (POST /view). */
export async function getOrCreateForYouClientId(): Promise<string> {
  const existing = await AsyncStorage.getItem(FOR_YOU_CLIENT_ID_KEY);
  if (existing && existing.length >= 8) {
    return existing;
  }
  const created = `guest-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  await AsyncStorage.setItem(FOR_YOU_CLIENT_ID_KEY, created);
  return created;
}

async function optionalAuthFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
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
    res = await fetch(`${baseUrl}${path}`, { ...init, headers });
  } catch {
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

/** GET /api/products/feed/for-you — optional auth (personalized vs random). */
export async function fetchForYouFeed(options?: {
  cursor?: string;
  limit?: number;
}): Promise<ForYouFeedResponse> {
  const params = new URLSearchParams();
  if (options?.cursor) params.set("cursor", options.cursor);
  if (options?.limit != null) params.set("limit", String(options.limit));
  const qs = params.toString();
  return optionalAuthFetch<ForYouFeedResponse>(
    `/api/products/feed/for-you${qs ? `?${qs}` : ""}`,
  );
}

/** POST /api/products/:id/view — deduped on the server. */
export async function recordProductView(productId: string): Promise<RecordProductViewResponse> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  const body: { clientId?: string } = {};
  if (!token) {
    body.clientId = await getOrCreateForYouClientId();
  }

  return optionalAuthFetch<RecordProductViewResponse>(
    `/api/products/${productId}/view`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}

/** GET /api/products/seller/:sellerId/view-counts — profile grid totals. */
export async function fetchSellerProductViewCounts(
  sellerId: string,
): Promise<Record<string, number>> {
  const res = await optionalAuthFetch<SellerProductViewCountsResponse>(
    `/api/products/seller/${encodeURIComponent(sellerId)}/view-counts`,
  );
  return res.counts ?? {};
}
