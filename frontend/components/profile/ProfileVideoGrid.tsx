/** Component to display a grid of video thumbnails for a seller's profile clips. */
import { useMemo } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { Feather, SimpleLineIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { VideoCoverImage } from "../shared/VideoCoverImage";
import type { StoreProduct } from "../../types/storeProduct";
import { resolveVideoCoverUrl } from "../../utils/videoCover";

const GRID_GAP = 2;
const COLUMNS = 3;
const HORIZONTAL_PADDING = 2;

type Props = {
  products: StoreProduct[];
  /** Fallback when a row has no `seller_id` (own profile grid). */
  sellerId?: string;
  emptyLabel: string;
  viewCounts?: Record<string, number>;
};

function formatViewCount(n: number): string {
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (n >= 1000) {
    return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return String(n);
}

export function ProfileVideoGrid({ products, sellerId, emptyLabel, viewCounts }: Props) {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();

  const cellWidth = useMemo(() => {
    const totalGap = GRID_GAP * (COLUMNS - 1);
    const totalPad = HORIZONTAL_PADDING * 2;
    return (screenWidth - totalPad - totalGap) / COLUMNS;
  }, [screenWidth]);

  const cellHeight = cellWidth * (16 / 9);

  if (products.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyText}>{emptyLabel}</Text>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {products.map((product) => {
        const videoUrl = product.video_url?.trim() ?? null;
        const serverCoverUrl = videoUrl
          ? resolveVideoCoverUrl(videoUrl, product.thumbnail_url)
          : null;
        const views = viewCounts?.[product.id] ?? 0;
        return (
          <TouchableOpacity
            key={product.id}
            style={[styles.cell, { width: cellWidth, height: cellHeight }]}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={`${product.title}, ${views} views`}
            onPress={() => {
              const resolvedSellerId = product.seller_id?.trim() || sellerId?.trim();
              if (!resolvedSellerId) return;
              router.push({
                pathname: "/profile-clips",
                params: { sellerId: resolvedSellerId, clipId: product.id },
              });
            }}
          >
            <VideoCoverImage
              videoUrl={videoUrl}
              serverCoverUrl={serverCoverUrl}
              style={styles.thumb}
              contentFit="cover"
              placeholderIconSize={28}
            />
            <View style={styles.productBadge}>
              <Feather name="shopping-bag" size={14} color="#FFFFFF" />
            </View>
            <View style={styles.viewBadge}>
              <SimpleLineIcons name="control-play" size={8} color="#FFFFFF" />
              <Text style={styles.viewBadgeText}>{formatViewCount(views)}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingBottom: 24,
    width: "100%",
  },
  cell: {
    backgroundColor: "#111827",
    borderRadius: 4,
    overflow: "hidden",
    position: "relative",
  },
  thumb: {
    width: "100%",
    height: "100%",
  },
  productBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    padding: 4,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0)",
    alignItems: "center",
    justifyContent: "center",
  },
  viewBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  viewBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
  emptyWrap: {
    minHeight: 200,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyText: {
    color: "#000000",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 22,
  },
});
