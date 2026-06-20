/** Component to display a grid of video thumbnails for a seller's profile clips. */
import { useMemo } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { Feather, Ionicons, SimpleLineIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { StoreProduct } from "../../types/storeProduct";

const GRID_GAP = 2;
const COLUMNS = 3;
const HORIZONTAL_PADDING = 2;

type Props = {
  products: StoreProduct[];
  sellerId: string;
  emptyLabel: string;
  viewCounts?: Record<string, number>;
};

function thumbUri(product: StoreProduct): string | null {
  const thumb = product.thumbnail_url?.trim();
  if (thumb) return thumb;
  const image = product.image_url?.trim();
  if (image) return image;
  return null;
}

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
        const uri = thumbUri(product);
        const views = viewCounts?.[product.id] ?? 0;
        return (
          <TouchableOpacity
            key={product.id}
            style={[styles.cell, { width: cellWidth, height: cellHeight }]}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={`${product.title}, ${views} views`}
            onPress={() => {
              if (!sellerId) return;
              router.push({
                pathname: "/profile-clips",
                params: { sellerId, clipId: product.id },
              });
            }}
          >
            {uri ? (
              <Image source={{ uri }} style={styles.thumb} resizeMode="cover" />
            ) : (
              <View style={[styles.thumb, styles.thumbPlaceholder]}>
                <Ionicons name="videocam-outline" size={28} color="#9CA3AF" />
              </View>
            )}
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
  thumbPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1F2937",
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
