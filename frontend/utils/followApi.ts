import { getApiBaseUrl } from "../lib/apiConfig";
import { apiFetch, ApiError } from "../lib/apiFetch";
import { supabase } from "../lib/supabase";

export type FollowProfileSummary = {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  city: string | null;
};

export type FollowCounts = {
  followers: number;
  following: number;
};

/** Public follower/following counts (no auth required). */
export async function fetchFollowCounts(profileId: string): Promise<FollowCounts> {
  const baseUrl = getApiBaseUrl();
  let res: Response;
  try {
    res = await fetch(`${baseUrl}/api/follows/counts/${encodeURIComponent(profileId)}`);
  } catch {
    throw new ApiError("Could not reach the Safick API.", 0);
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

  return payload as FollowCounts;
}

export async function fetchMyFollowing(limit = 100): Promise<FollowProfileSummary[]> {
  const data = await apiFetch<{ following: FollowProfileSummary[] }>(
    `/api/follows/me?limit=${limit}`,
  );
  return data.following ?? [];
}

/** Returns a Set of seller ids the signed-in user follows. Guests get an empty set. */
export async function fetchMyFollowingIds(): Promise<Set<string>> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session?.access_token) {
    return new Set();
  }

  try {
    const rows = await fetchMyFollowing();
    return new Set(rows.map((row) => row.id));
  } catch {
    return new Set();
  }
}

export async function checkFollowingSeller(sellerId: string): Promise<boolean> {
  const data = await apiFetch<{ following: boolean }>(
    `/api/follows/check/${encodeURIComponent(sellerId)}`,
  );
  return Boolean(data.following);
}

export async function followSeller(sellerId: string): Promise<void> {
  await apiFetch<{ following: boolean }>(`/api/follows/${encodeURIComponent(sellerId)}`, {
    method: "POST",
  });
}

export async function unfollowSeller(sellerId: string): Promise<void> {
  await apiFetch<{ following: boolean }>(`/api/follows/${encodeURIComponent(sellerId)}`, {
    method: "DELETE",
  });
}
