import type { ProductCardData } from "../components/shared/ProductCard";

/**
 * Shared product data for video feed tabs (ForYouTab, FollowingTab).
 * Use this for consistency across the app; replace with API data later.
 */
export const FEED_PRODUCTS = {
  workoutSet: {
    name: "Women's workout set",
    price: "15,000 XAF",
    originalPrice: "17,000 XAF",
  } satisfies ProductCardData,
} as const;
