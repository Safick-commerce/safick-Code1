/**
 * Cover image for a clip: prefer server poster, else extract a frame from `videoUrl`.
 */

import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import {
  ActivityIndicator,
  ImageStyle,
  StyleProp,
  StyleSheet,
  View,
} from "react-native";

import { useVideoCoverUri } from "../../hooks/useVideoCoverUri";

type Props = {
  videoUrl: string | null | undefined;
  serverCoverUrl?: string | null;
  /** When set (e.g. Discover batch prefetch), skip async resolve on mount. */
  coverUri?: string | null;
  style: StyleProp<ImageStyle>;
  contentFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  placeholderIcon?: keyof typeof Ionicons.glyphMap;
  placeholderIconSize?: number;
};

export function VideoCoverImage({
  videoUrl,
  serverCoverUrl,
  coverUri: coverUriProp,
  style,
  contentFit = "cover",
  placeholderIcon = "videocam-outline",
  placeholderIconSize = 36,
}: Props) {
  const fromHook = useVideoCoverUri(coverUriProp ? null : videoUrl, {
    serverCoverUrl: coverUriProp ? null : serverCoverUrl,
  });
  const coverUri = coverUriProp?.trim() || fromHook.coverUri;
  const loading = coverUriProp ? false : fromHook.loading;

  if (coverUri) {
    return (
      <Image
        source={{ uri: coverUri }}
        style={style}
        contentFit={contentFit}
        cachePolicy="memory-disk"
        transition={0}
      />
    );
  }

  return (
    <View style={[style, styles.placeholder]}>
      {loading && videoUrl?.trim() ? (
        <ActivityIndicator size="small" color="#9CA3AF" />
      ) : (
        <Ionicons name={placeholderIcon} size={placeholderIconSize} color="#9CA3AF" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E5E7EB",
  },
});
