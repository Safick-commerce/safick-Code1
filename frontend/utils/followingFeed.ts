import { ApiError, apiFetch } from "../lib/apiFetch";
import type { ForYouFeedItem } from "./forYouFeed";

export type FollowingFeedResponse = {
  items: ForYouFeedItem[];
  nextCursor: string | null;
};

/** GET /api/products/feed/following — requires sign-in. */
export async function fetchFollowingFeed(options?: {
  cursor?: string;
  limit?: number;
}): Promise<FollowingFeedResponse> {
  const params = new URLSearchParams();
  if (options?.cursor) params.set("cursor", options.cursor);
  if (options?.limit != null) params.set("limit", String(options.limit));
  const qs = params.toString();

  const data = await apiFetch<FollowingFeedResponse>(
    `/api/products/feed/following${qs ? `?${qs}` : ""}`,
  );

  return {
    items: data.items ?? [],
    nextCursor: data.nextCursor ?? null,
  };
}

export { ApiError };
