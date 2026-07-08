import { apiFetch } from "./apiFetch";
import type { LivePost } from "../types";

type LiveFeedRow = {
  id: string;
  title: string;
  category: string | null;
  status: "scheduled" | "live" | "ended";
  viewer_count: number;
  profiles: {
    id: string;
    display_name: string | null;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
  products: {
    id: string;
    title: string;
    price: string | number;
    image_url: string | null;
  } | null;
};

function mapFeedRow(row: LiveFeedRow): LivePost {
  const seller = row.profiles;
  const sellerName =
    seller?.display_name?.trim() ||
    seller?.full_name?.trim() ||
    (seller?.username ? `@${seller.username}` : "Seller");

  return {
    id: row.id,
    sellerId: seller?.id,
    sellerName,
    sellerAvatar: seller?.avatar_url ?? undefined,
    imageUrl: row.products?.image_url ?? "",
    description: row.title,
    isLive: row.status === "live",
    viewerCount: row.viewer_count,
    category: row.category ?? undefined,
  };
}

export async function fetchLiveFeed(): Promise<LivePost[]> {
  const data = await apiFetch<{ items: LiveFeedRow[] }>("/api/live/feed");
  return data.items.map(mapFeedRow);
}

export async function startLiveSession(body: {
  title: string;
  category?: string;
  audience?: "public" | "followers";
  productId?: string;
}) {
  return apiFetch<{
    liveId: string;
    roomName: string;
    token: string;
    url: string;
  }>("/api/live/start", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getLiveViewerToken(liveId: string) {
  return apiFetch<{ token: string; url: string }>(`/api/live/${liveId}/token`, {
    method: "POST",
  });
}

export async function endLiveSession(liveId: string) {
  return apiFetch<{ ok: boolean }>(`/api/live/${liveId}/end`, {
    method: "POST",
  });
}
