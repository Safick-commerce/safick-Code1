import * as Linking from "expo-linking";

/**
 * Deep link to watch a seller clip (For You / Following / profile-clips).
 * Uses app scheme `safick://` in dev; set EXPO_PUBLIC_APP_WEB_URL for https links in production shares.
 */
export function buildClipShareUrl(sellerId: string, clipId: string): string {
  const webBase = process.env.EXPO_PUBLIC_APP_WEB_URL?.trim().replace(/\/$/, "");
  if (webBase) {
    const params = new URLSearchParams({ sellerId, clipId });
    return `${webBase}/profile-clips?${params.toString()}`;
  }

  return Linking.createURL("/profile-clips", {
    queryParams: { sellerId, clipId },
  });
}

/** Link to product details (buy flow). */
export function buildProductShareUrl(productId: string): string {
  const webBase = process.env.EXPO_PUBLIC_APP_WEB_URL?.trim().replace(/\/$/, "");
  if (webBase) {
    const params = new URLSearchParams({ id: productId });
    return `${webBase}/productDetails?${params.toString()}`;
  }

  return Linking.createURL("/productDetails", {
    queryParams: { id: productId },
  });
}

/** Params for i18n `clip_share_message`. */
export function clipShareMessageParams(title: string, sellerId: string, clipId: string) {
  const watchUrl = buildClipShareUrl(sellerId, clipId);
  const shopUrl = buildProductShareUrl(clipId);
  return {
    title: title.trim() || "SAFICK",
    watchUrl,
    shopUrl,
  };
}
