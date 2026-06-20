/** Utility functions for profile clips. */
import { fetchProfileById, type ProfileRow } from "./fetchProfile";
import type { ForYouFeedItem } from "./forYouFeed";
import { getSellerVideoProducts } from "./productApi";
import { formatPriceXaf } from "./searchApi";
import type { StoreProduct } from "../types/storeProduct";

function mapToFeedItem(product: StoreProduct, seller: ProfileRow): ForYouFeedItem | null {
  const videoUrl = product.video_url?.trim();
  if (!videoUrl) return null;

  return {
    id: product.id,
    title: product.title,
    description: product.description,
    price: formatPriceXaf(product.price),
    category: null,
    videoUrl,
    thumbnailUrl: product.thumbnail_url?.trim() ?? null,
    seller: {
      id: seller.id,
      username: seller.username,
      displayName: seller.display_name ?? seller.full_name,
      avatarUrl: seller.avatar_url,
      city: seller.city,
    },
    createdAt: product.created_at,
  };
}

/** All ready video listings for a seller profile, shaped for ForYouVideoPage. */
export async function fetchSellerProfileClips(sellerId: string): Promise<ForYouFeedItem[]> {
  const [products, profile] = await Promise.all([
    getSellerVideoProducts(sellerId),
    fetchProfileById(sellerId),
  ]);

  if (!profile) return [];

  return products
    .map((product) => mapToFeedItem(product, profile))
    .filter((item): item is ForYouFeedItem => item !== null);
}

export function indexOfClip(items: ForYouFeedItem[], clipId: string | undefined): number {
  if (!clipId) return 0;
  const idx = items.findIndex((item) => item.id === clipId);
  return idx >= 0 ? idx : 0;
}
