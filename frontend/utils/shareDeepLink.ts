/**
 * Utility functions for validating and normalizing deep link URLs.
 * Used to determine if a URL is a valid deep link for a specific path.
 * @module shareDeepLink
 */
import * as Linking from "expo-linking";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string | undefined): boolean {
  return typeof value === "string" && UUID_RE.test(value.trim());
}

/** Paths opened from WhatsApp / share sheet (must not be overridden by app entry routing). */
export const SHARE_DEEP_LINK_PATHS = new Set(["profile-clips", "productDetails"]);

export function normalizeDeepLinkPath(url: string): string | null {
  const parsed = Linking.parse(url);
  const rawPath = (parsed.path ?? parsed.hostname ?? "").replace(/^\//, "");
  const segment = rawPath.split("/")[0]?.split("?")[0] ?? "";
  if (SHARE_DEEP_LINK_PATHS.has(segment)) {
    return segment;
  }
  return null;
}

export function isShareDeepLinkUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) return false;
  return normalizeDeepLinkPath(url.trim()) !== null;
}

export function validateProfileClipsDeepLink(
  sellerId: string | undefined,
  clipId: string | undefined,
): { ok: true } | { ok: false; reason: "missing_seller" | "invalid_seller" | "invalid_clip" } {
  if (!sellerId?.trim()) {
    return { ok: false, reason: "missing_seller" };
  }
  if (!isUuid(sellerId)) {
    return { ok: false, reason: "invalid_seller" };
  }
  if (clipId?.trim() && !isUuid(clipId)) {
    return { ok: false, reason: "invalid_clip" };
  }
  return { ok: true };
}

export function validateProductDetailsDeepLink(
  productId: string | undefined,
): { ok: true } | { ok: false; reason: "missing" | "invalid" } {
  if (!productId?.trim()) {
    return { ok: false, reason: "missing" };
  }
  if (!isUuid(productId)) {
    return { ok: false, reason: "invalid" };
  }
  return { ok: true };
}
