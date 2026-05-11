import type { ImageSourcePropType } from "react-native";

/**
 * Static image requires for Metro (one place to look up paths under `assets/images/`).
 */
export const appImages = {
  google: require("./images/Google.png") as ImageSourcePropType,
} as const;
