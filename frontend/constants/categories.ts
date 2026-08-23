import type { ImageSourcePropType } from "react-native";

/** Shared category rail used by Discover, Unbox filters, and the search hub. */
export const DISCOVER_CATEGORIES = [
  { id: 1, name: "Fashion", image: require("../assets/images/fashion.jpg") },
  { id: 2, name: "Shoes", image: require("../assets/images/shoe2.jpg") },
  { id: 3, name: "Electronics", image: require("../assets/images/electronics.jpg") },
  { id: 4, name: "Beauty", image: require("../assets/images/beauty.jpg") },
  { id: 5, name: "Home", image: require("../assets/images/home.jpg") },
  { id: 6, name: "Sports", image: require("../assets/images/sports.jpg") },
  { id: 7, name: "Toys", image: require("../assets/images/toys.jpg") },
  { id: 8, name: "Books", image: require("../assets/images/gadgets.jpg") },
  { id: 9, name: "Gadgets", image: require("../assets/images/accessories.jpg") },
  { id: 10, name: "Accessories", image: require("../assets/images/tools.jpg") },
] as const satisfies readonly { id: number; name: string; image: ImageSourcePropType }[];

export type DiscoverCategoryName = (typeof DISCOVER_CATEGORIES)[number]["name"];
