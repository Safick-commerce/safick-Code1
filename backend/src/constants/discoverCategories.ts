// =============================================================================
// Discover tab category labels — must match frontend/constants/categories.ts
// =============================================================================

export const DISCOVER_CATEGORY_LABELS = [
  "Fashion",
  "Shoes",
  "Electronics",
  "Beauty",
  "Home",
  "Sports",
  "Toys",
  "Books",
  "Gadgets",
  "Accessories",
] as const;

export type DiscoverCategoryLabel = (typeof DISCOVER_CATEGORY_LABELS)[number];

const DISCOVER_SET = new Set<string>(DISCOVER_CATEGORY_LABELS);

export function isDiscoverCategoryLabel(value: string): value is DiscoverCategoryLabel {
  return DISCOVER_SET.has(value);
}
