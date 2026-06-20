// =============================================================================
// Interest / product categories — canonical labels for For You feed
// =============================================================================
// Must stay in sync with:
//   • frontend/data/interestCategories.ts (onboarding chips)
//   • backend/supabase/for_you_feed.sql → products_category_check
//
// Icons live only on the frontend; backend uses labels for validation and SQL.
// =============================================================================

export const INTEREST_CATEGORY_LABELS = [
  "Fashion",
  "Beauty",
  "Electronics",
  "Home",
  "Food",
  "Sports",
  "Accessories",
  "Books",
  "Gadgets",
  "Health",
  "Cars",
  "Art",
] as const;

export type InterestCategoryLabel = (typeof INTEREST_CATEGORY_LABELS)[number];

const LABEL_SET = new Set<string>(INTEREST_CATEGORY_LABELS);

/** True when `value` is a valid onboarding / product category label. */
export function isInterestCategoryLabel(value: string): value is InterestCategoryLabel {
  return LABEL_SET.has(value);
}

/** Filters an arbitrary string list to known category labels (e.g. profile interests). */
export function filterInterestCategoryLabels(values: string[]): InterestCategoryLabel[] {
  return values.filter(isInterestCategoryLabel);
}
