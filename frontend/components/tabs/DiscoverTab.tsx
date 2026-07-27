import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";

import { DISCOVER_CATEGORIES } from "../../constants/categories";
import { DiscoverTabSkeleton } from "../shared/DiscoverTabSkeleton";
import { VideoCoverImage } from "../shared/VideoCoverImage";
import { useLanguage } from "../../context/LanguageContext";
import { fetchDiscoverFeed } from "../../utils/discoverFeed";
import type { ForYouFeedItem } from "../../utils/forYouFeed";
import { ApiError } from "../../lib/apiFetch";
import { getNetworkProfile } from "../../utils/networkProfile";
import { prefetchDiscoverCovers } from "../../utils/videoCoverResolve";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const CONTENT_PADDING = 1;
const CARD_GAP = 6;
const CARD_WIDTH = (SCREEN_WIDTH - CONTENT_PADDING * 2 - CARD_GAP) / 2;
const IMAGE_HEIGHT = Math.round(SCREEN_HEIGHT * 0.36);
const DISCOVER_PAGE_SIZE = 24;

type DiscoverCard = {
  id: string;
  sellerId: string;
  seller: string;
  name: string;
  price: string;
  videoUri: string;
  serverCoverUri: string | null;
  coverUri: string | null;
  sellerAvatarUri: string | null;
};

function sellerDisplayName(item: ForYouFeedItem): string {
  const s = item.seller;
  return (
    s.displayName?.trim() ||
    (s.username ? `@${s.username}` : "Seller")
  );
}

function mapFeedItemToCard(item: ForYouFeedItem, coverUri: string | null): DiscoverCard {
  return {
    id: item.id,
    sellerId: item.seller.id,
    seller: sellerDisplayName(item),
    name: item.title,
    price: item.price,
    videoUri: item.videoUrl,
    serverCoverUri: item.thumbnailUrl?.trim() || null,
    coverUri,
    sellerAvatarUri: item.seller.avatarUrl?.trim() || null,
  };
}

export type DiscoverTabProps = {
  isLoading?: boolean;
};

export default function DiscoverTab({ isLoading = false }: DiscoverTabProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [activeDiscoverCategory, setActiveDiscoverCategory] = useState<string | null>(null);
  const [cards, setCards] = useState<DiscoverCard[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState<string | null>(null);

  const loadDiscover = useCallback(async (category: string | null) => {
    setFeedLoading(true);
    setFeedError(null);
    setCards([]);
    try {
      const network = await getNetworkProfile();
      if (!network.isConnected) {
        setFeedError("No internet connection. Check your network and try again.");
        return;
      }

      const res = await fetchDiscoverFeed({
        category,
        limit: DISCOVER_PAGE_SIZE,
        timeoutMs: network.apiTimeoutMs,
      });

      const coverById = await prefetchDiscoverCovers(res.items, {
        concurrency: network.coverConcurrency,
        deadlineMs: network.coverDeadlineMs,
      });

      setCards(
        res.items.map((item) => mapFeedItemToCard(item, coverById.get(item.id) ?? null)),
      );
    } catch (e) {
      setCards([]);
      setFeedError(
        e instanceof ApiError ? e.message : "Could not load discover clips. Try again.",
      );
    } finally {
      setFeedLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoading) return;
    void loadDiscover(activeDiscoverCategory);
  }, [activeDiscoverCategory, isLoading, loadDiscover]);

  const popularRows = useMemo(() => {
    const rows: DiscoverCard[][] = [];
    for (let i = 0; i < cards.length; i += 2) {
      rows.push(cards.slice(i, i + 2));
    }
    return rows;
  }, [cards]);

  const openClip = useCallback(
    (card: DiscoverCard) => {
      router.push({
        pathname: "/profile-clips",
        params: { sellerId: card.sellerId, clipId: card.id },
      });
    },
    [router],
  );

  if (isLoading || feedLoading) {
    return <DiscoverTabSkeleton />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        scrollEventThrottle={16}
        nestedScrollEnabled
      >
        <View style={styles.topContainer}>
          <ScrollView
            horizontal
            nestedScrollEnabled
            style={styles.categoryRailScroll}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.circleScrollContainer}
            scrollEventThrottle={16}
          >
            <View style={styles.circleContainer}>
              <TouchableOpacity
                style={[styles.discoverCircle, activeDiscoverCategory === null && styles.discoverCircleSelected]}
                onPress={() => setActiveDiscoverCategory(null)}
                activeOpacity={0.88}
                accessibilityRole="button"
                accessibilityLabel={t("a11y_all_categories")}
                accessibilityState={{ selected: activeDiscoverCategory === null }}
              >
                <MaterialCommunityIcons name="view-grid-outline" size={28} color="#111827" />
              </TouchableOpacity>
              <Text style={styles.circleText}>{t("common_all")}</Text>
            </View>
            {DISCOVER_CATEGORIES.map((category) => (
              <View key={category.id} style={styles.circleContainer}>
                <TouchableOpacity
                  style={[
                    styles.discoverCircle,
                    activeDiscoverCategory === category.name && styles.discoverCircleSelected,
                  ]}
                  onPress={() => setActiveDiscoverCategory(category.name)}
                  activeOpacity={0.88}
                  accessibilityRole="button"
                  accessibilityLabel={category.name}
                  accessibilityState={{ selected: activeDiscoverCategory === category.name }}
                >
                  <Image source={category.image} style={styles.discoverCircleImage} resizeMode="cover" />
                </TouchableOpacity>
                <Text style={styles.circleText} numberOfLines={1}>
                  {category.name}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.titleRow}>
          <View style={styles.titleContainer}>
            <Text style={styles.popularText}>{t("discover_popular_now")}</Text>
            <Text style={styles.recommendedSubText}>
              {activeDiscoverCategory ? `${activeDiscoverCategory} ` : t("discover_recommended")}
            </Text>
          </View>
        </View>

        {feedError && cards.length === 0 ? (
          <View style={styles.emptyCategoryWrap}>
            <Text style={styles.emptyCategoryTitle}>{feedError}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => void loadDiscover(activeDiscoverCategory)}
              accessibilityRole="button"
            >
              <Text style={styles.retryButtonText}>{t("common_try_again")}</Text>
            </TouchableOpacity>
          </View>
        ) : cards.length === 0 ? (
          <View style={styles.emptyCategoryWrap}>
            <Text style={styles.emptyCategoryTitle}>
              {t("home_no_picks", { category: activeDiscoverCategory ?? "" })}
            </Text>
            <Text style={styles.emptyCategorySub}>{t("home_try_another_category")}</Text>
          </View>
        ) : (
          popularRows.map((row, rowIndex) => (
            <View key={`row-${rowIndex}`} style={styles.downContainer}>
              <View style={styles.triangleScrollContainer}>
                {row.map((card, index) => (
                  <TouchableOpacity
                    key={card.id}
                    style={[styles.triangleContainer, index === 1 && styles.triangleContainerLast]}
                    activeOpacity={0.88}
                    accessibilityRole="button"
                    accessibilityLabel={`${card.name}, ${card.price}`}
                    onPress={() => openClip(card)}
                  >
                    <View style={styles.triangle}>
                      <VideoCoverImage
                        videoUrl={card.videoUri}
                        serverCoverUrl={card.serverCoverUri}
                        coverUri={card.coverUri}
                        style={styles.triangleImage}
                        contentFit="cover"
                      />
                      <View style={styles.clipBadge}>
                        <Ionicons name="play" size={12} color="#FFFFFF" />
                      </View>
                      <View style={styles.sellerRow}>
                        <View style={styles.avatarContainer}>
                          {card.sellerAvatarUri ? (
                            <Image source={{ uri: card.sellerAvatarUri }} style={styles.avatarImage} resizeMode="cover" />
                          ) : (
                            <View style={[styles.avatarImage, styles.avatarPlaceholder]}>
                              <Ionicons name="person" size={14} color="#6B7280" />
                            </View>
                          )}
                        </View>
                        <Text style={styles.sellerName} numberOfLines={1}>
                          {card.seller}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.productName} numberOfLines={2}>
                      {card.name}
                    </Text>
                    <Text style={styles.productPrice}>{card.price}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: "stretch",
    backgroundColor: "#ffffff",
  },
  popularText: {
    color: "#000000",
    marginTop: 8,
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "Inter",
  },
  scrollContent: {
    paddingHorizontal: CONTENT_PADDING,
    paddingTop: 10,
    paddingBottom: 32,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    marginTop: 20,
    marginBottom: 4,
  },
  topContainer: {
    width: "100%",
    marginBottom: 16,
  },
  /** Android: without an explicit width, nested horizontal ScrollViews expand to fit all chips and never scroll. */
  categoryRailScroll: {
    width: SCREEN_WIDTH - CONTENT_PADDING * 2,
    flexGrow: 0,
  },
  circleScrollContainer: {
    paddingHorizontal: 5,
    alignItems: "center",
    paddingTop: 4,
    paddingBottom: 4,
  },
  circleContainer: {
    marginHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    maxWidth: 80,
  },
  discoverCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#F3F4F6",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  discoverCircleSelected: {
    borderColor: "#FF2800",
    borderWidth: 2,
  },
  discoverCircleImage: {
    width: "100%",
    height: "100%",
  },
  triangleScrollContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  triangleContainer: {
    width: CARD_WIDTH,
    marginRight: CARD_GAP,
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
  triangleContainerLast: {
    marginRight: 0,
  },
  sellerRow: {
    position: "absolute",
    bottom: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  sellerName: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: "Inter",
    textShadowColor: "rgba(0, 0, 0, 0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    maxWidth: CARD_WIDTH * 0.45,
  },
  triangle: {
    width: CARD_WIDTH,
    height: IMAGE_HEIGHT,
    borderRadius: 10,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  triangleImage: {
    width: "100%",
    height: "100%",
  },
  thumbPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1F2937",
  },
  clipBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  avatarContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    overflow: "hidden",
    backgroundColor: "#E5E7EB",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D1D5DB",
  },
  productName: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
    paddingHorizontal: 2,
    maxWidth: CARD_WIDTH,
    fontFamily: "Inter",
  },
  productPrice: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "700",
    color: "#FF2800",
    paddingHorizontal: 2,
    fontFamily: "Inter",
  },
  titleContainer: {
    flexDirection: "column",
  },
  recommendedSubText: {
    color: "#666666",
    marginTop: 4,
    fontSize: 14,
    fontWeight: "normal",
    fontFamily: "Inter",
  },
  downContainer: {
    width: "100%",
    marginTop: 20,
  },
  circleText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "500",
    color: "#000000",
    textAlign: "center",
    alignSelf: "stretch",
  },
  emptyCategoryWrap: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    alignItems: "center",
  },
  emptyCategoryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
  },
  emptyCategorySub: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#111827",
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
});
