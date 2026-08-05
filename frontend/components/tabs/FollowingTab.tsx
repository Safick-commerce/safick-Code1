import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewToken,
} from "react-native";
import { useRouter } from "expo-router";
import ForYouVideoPage from "../forYou/ForYouVideoPage";
import { ForYouFeedSkeleton } from "../shared/ForYouFeedSkeleton";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { recordProductView, type ForYouFeedItem } from "../../utils/forYouFeed";
import { fetchFollowingFeed, ApiError } from "../../utils/followingFeed";
import { useFollowingIds } from "../../hooks/useFollowingIds";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const FEED_PAGE_SIZE = 10;

const ROUTES = {
  PRODUCT_DETAILS: "/productDetails",
  SIGN_IN: "/auth/signin",
  USER_TAB: "/userTab",
} as const;

export type FollowingTabProps = {
  isTabActive?: boolean;
  onDiscoverPress?: () => void;
};

function FollowingEmptyState({
  onDiscoverPress,
}: {
  onDiscoverPress?: () => void;
}) {
  const { t } = useLanguage();
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>{t("home_following_empty_title")}</Text>
      <Text style={styles.emptyBody}>{t("home_following_empty_body")}</Text>
      {onDiscoverPress ? (
        <TouchableOpacity style={styles.discoverButton} onPress={onDiscoverPress} activeOpacity={0.85}>
          <Text style={styles.discoverButtonText}>{t("home_discover_sellers_btn")}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export default function FollowingTab({ onDiscoverPress, isTabActive = true }: FollowingTabProps) {
  const router = useRouter();
  const { isAuthenticated, isReady: authReady } = useAuth();
  const { isFollowing, toggleFollow } = useFollowingIds();

  const [pageHeight, setPageHeight] = useState(0);
  const [items, setItems] = useState<ForYouFeedItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [firstVideoReady, setFirstVideoReady] = useState(false);

  const viewedIds = useRef(new Set<string>());
  const loadMoreLock = useRef(false);

  const loadFeed = useCallback(async (cursor?: string) => {
    if (!isAuthenticated) return;

    const isMore = Boolean(cursor);
    if (isMore) {
      if (loadMoreLock.current) return;
      loadMoreLock.current = true;
      setLoadingMore(true);
    } else {
      setLoading(true);
      setError(null);
    }

    try {
      const res = await fetchFollowingFeed({ cursor, limit: FEED_PAGE_SIZE });
      setNextCursor(res.nextCursor);
      setItems((prev) => (isMore ? [...prev, ...res.items] : res.items));
      if (!isMore) {
        setActiveIndex(0);
        setFirstVideoReady(false);
        viewedIds.current.clear();
      }
    } catch (e) {
      const message =
        e instanceof ApiError ? e.message : "Could not load following feed. Try again.";
      if (!isMore) {
        setItems([]);
        setError(message);
      }
    } finally {
      if (isMore) {
        setLoadingMore(false);
        loadMoreLock.current = false;
      } else {
        setLoading(false);
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!authReady) return;
    if (!isAuthenticated) {
      setItems([]);
      setNextCursor(null);
      setError(null);
      setLoading(false);
      return;
    }
    void loadFeed();
  }, [authReady, isAuthenticated, loadFeed]);

  const [appActive, setAppActive] = useState(AppState.currentState === "active");
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      setAppActive(state === "active");
    });
    return () => sub.remove();
  }, []);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length === 0) return;
      const first = viewableItems[0];
      if (first?.index != null) {
        setActiveIndex(first.index);
      }
    },
    [],
  );

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 75,
  }).current;

  const handleLoadMore = useCallback(() => {
    if (!nextCursor || loadingMore || loading) return;
    void loadFeed(nextCursor);
  }, [nextCursor, loadingMore, loading, loadFeed]);

  const trackView = useCallback((productId: string) => {
    if (viewedIds.current.has(productId)) return;
    viewedIds.current.add(productId);
    void recordProductView(productId).catch(() => {
      viewedIds.current.delete(productId);
    });
  }, []);

  const handleBuyPress = useCallback(
    (item: ForYouFeedItem) => {
      router.push({ pathname: ROUTES.PRODUCT_DETAILS, params: { id: item.id } });
    },
    [router],
  );

  const handleSellerPress = useCallback(
    (item: ForYouFeedItem) => {
      try {
        router.push({ pathname: ROUTES.USER_TAB, params: { userId: item.seller.id } });
      } catch {
        Alert.alert("Seller profile", "Could not open this seller's profile.");
      }
    },
    [router],
  );

  const handleFirstVideoReady = useCallback(() => {
    setFirstVideoReady(true);
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: ForYouFeedItem; index: number }) => {
      const isActive = isTabActive && appActive && index === activeIndex;
      return (
        <ForYouVideoPage
          item={item}
          pageHeight={pageHeight}
          isActive={isActive}
          isFollowing={isFollowing(item.seller.id)}
          onToggleFollow={() => void toggleFollow(item.seller.id)}
          onBuyPress={() => handleBuyPress(item)}
          onSellerPress={() => handleSellerPress(item)}
          onBecameActive={() => trackView(item.id)}
          onFirstFrameReady={index === 0 ? handleFirstVideoReady : undefined}
        />
      );
    },
    [
      activeIndex,
      appActive,
      handleBuyPress,
      handleFirstVideoReady,
      handleSellerPress,
      isFollowing,
      isTabActive,
      pageHeight,
      toggleFollow,
      trackView,
    ],
  );

  if (!authReady) {
    return (
      <View style={styles.container}>
        <ForYouFeedSkeleton />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <FollowingEmptyState onDiscoverPress={onDiscoverPress} />;
  }

  if (error && items.length === 0) {
    return (
      <View style={styles.centeredDark}>
        <Text style={styles.errorTitle}>Could not load Following</Text>
        <Text style={styles.errorBody}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => void loadFeed()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!loading && items.length === 0) {
    return <FollowingEmptyState onDiscoverPress={onDiscoverPress} />;
  }

  const awaitingLayout = pageHeight === 0;
  const awaitingFeed = loading && items.length === 0;
  const awaitingFirstVideo = items.length > 0 && pageHeight > 0 && !firstVideoReady;
  const showFeedSkeleton = awaitingFeed || awaitingLayout || awaitingFirstVideo;
  const canMountFeed = items.length > 0 && pageHeight > 0;

  return (
    <View
      style={styles.container}
      onLayout={(e) => {
        const h = e.nativeEvent.layout.height;
        if (h > 0 && h !== pageHeight) setPageHeight(h);
      }}
    >
      {canMountFeed ? (
        <FlatList
          style={firstVideoReady ? styles.feedVisible : styles.feedHidden}
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          pagingEnabled
          snapToInterval={pageHeight}
          snapToAlignment="start"
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          getItemLayout={(_, index) => ({
            length: pageHeight,
            offset: pageHeight * index,
            index,
          })}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          nestedScrollEnabled
          ListFooterComponent={
            loadingMore ? (
              <View style={[styles.footerLoader, { height: pageHeight * 0.15 }]}>
                <ActivityIndicator color="#FF2800" />
              </View>
            ) : null
          }
        />
      ) : null}
      {showFeedSkeleton ? (
        <View style={styles.skeletonOverlay} pointerEvents="none">
          <ForYouFeedSkeleton />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    flex: 1,
    backgroundColor: "#111827",
  },
  feedHidden: {
    opacity: 0,
  },
  feedVisible: {
    opacity: 1,
  },
  skeletonOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  emptyContainer: {
    flex: 1,
    width: SCREEN_WIDTH,
    backgroundColor: "#FAFAFA",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyBody: {
    fontSize: 15,
    lineHeight: 22,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 28,
  },
  discoverButton: {
    backgroundColor: "#FF2800",
    paddingHorizontal: 32,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  discoverButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  centeredDark: {
    flex: 1,
    width: SCREEN_WIDTH,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "#111827",
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  errorBody: {
    fontSize: 14,
    color: "#D1D5DB",
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#FF2800",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  footerLoader: {
    alignItems: "center",
    justifyContent: "center",
  },
});
