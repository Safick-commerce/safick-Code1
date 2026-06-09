import type { TranslationKey } from "../i18n/types";

export const INTEREST_CATEGORIES: {
  label: string;
  labelKey: TranslationKey;
  icon:
    | "shirt-outline"
    | "color-palette-outline"
    | "phone-portrait-outline"
    | "home-outline"
    | "restaurant-outline"
    | "football-outline"
    | "watch-outline"
    | "book-outline"
    | "game-controller-outline"
    | "fitness-outline"
    | "car-outline"
    | "brush-outline";
}[] = [
  { label: "Fashion", labelKey: "cat_fashion", icon: "shirt-outline" },
  { label: "Beauty", labelKey: "cat_beauty", icon: "color-palette-outline" },
  { label: "Electronics", labelKey: "cat_electronics", icon: "phone-portrait-outline" },
  { label: "Home", labelKey: "cat_home", icon: "home-outline" },
  { label: "Food", labelKey: "cat_food", icon: "restaurant-outline" },
  { label: "Sports", labelKey: "cat_sports", icon: "football-outline" },
  { label: "Accessories", labelKey: "cat_accessories", icon: "watch-outline" },
  { label: "Books", labelKey: "cat_books", icon: "book-outline" },
  { label: "Gadgets", labelKey: "cat_gadgets", icon: "game-controller-outline" },
  { label: "Health", labelKey: "cat_health", icon: "fitness-outline" },
  { label: "Cars", labelKey: "cat_cars", icon: "car-outline" },
  { label: "Art", labelKey: "cat_art", icon: "brush-outline" },
] as const;
