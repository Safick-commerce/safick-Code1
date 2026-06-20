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
import {
  fetchForYouFeed,
  recordProductView,
  type ForYouFeedItem,
  type ForYouFeedMode,
} from "../../utils/forYouFeed";
import { ApiError } from "../../lib/apiFetch";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const FEED_PAGE_SIZE = 10;

const ROUTES = {
  PRODUCT_DETAILS: "/productDetails",
  SIGN_IN: "/auth/signin",
  USER_TAB: "/userTab",
} as const;

export type ForYouTabProps = {
  /** False when user swiped to Discover / Following — pauses all videos. */
  isTabActive?: boolean;
};

export default function ForYouTab({ isTabActive = true }: ForYouTabProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [pageHeight, setPageHeight] = useState(0);
  const [items, setItems] = useState<ForYouFeedItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [firstVideoReady, setFirstVideoReady] = useState(false);
  const [followingBySeller, setFollowingBySeller] = useState<Record<string, boolean>>({});

  const viewedIds = useRef(new Set<string>());
  const loadMoreLock = useRef(false);

  const loadFeed = useCallback(async (cursor?: string) => {
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
      const res = await fetchForYouFeed({ cursor, limit: FEED_PAGE_SIZE });
      setNextCursor(res.nextCursor);
      setItems((prev) => (isMore ? [...prev, ...res.items] : res.items));
      if (!isMore) {
        setActiveIndex(0);
        setFirstVideoReady(false);
        viewedIds.current.clear();
      }
    } catch (e) {
      const message =
        e instanceof ApiError ? e.message : "Could not load your feed. Try again.";
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
  }, []);

  useEffect(() => {
    void loadFeed();
  }, [loadFeed]);

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

  const openProductDetails = useCallback(
    (id: string) => {
      router.push({ pathname: ROUTES.PRODUCT_DETAILS, params: { id } });
    },
    [router],
  );

  const handleBuyPress = useCallback(
    (item: ForYouFeedItem) => {
      if (isAuthenticated) {
        openProductDetails(item.id);
        return;
      }
      router.push({
        pathname: ROUTES.SIGN_IN as "/auth/signin",
        params: { redirectTo: ROUTES.PRODUCT_DETAILS, id: item.id },
      });
    },
    [isAuthenticated, openProductDetails, router],
  );

  const handleSellerPress = useCallback(
    (item: ForYouFeedItem) => {
      try {
        router.push({ pathname: ROUTES.USER_TAB, params: { userId: item.seller.id } });
      } catch (err) {
        console.error("Navigation error:", err);
        Alert.alert("Seller profile", "Could not open this seller's profile.");
      }
    },
    [router],
  );

  const toggleFollow = useCallback((sellerId: string) => {
    setFollowingBySeller((prev) => ({
      ...prev,
      [sellerId]: !prev[sellerId],
    }));
  }, []);

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
          isFollowing={Boolean(followingBySeller[item.seller.id])}
          onToggleFollow={() => toggleFollow(item.seller.id)}
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
      followingBySeller,
      handleBuyPress,
      handleFirstVideoReady,
      handleSellerPress,
      isTabActive,
      pageHeight,
      toggleFollow,
      trackView,
    ],
  );

  if (error && items.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Could not load For You</Text>
        <Text style={styles.errorBody}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => void loadFeed()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!loading && items.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>No videos yet</Text>
        <Text style={styles.emptyBody}>
          Listings with product videos will appear here. Check Discover or post a video listing.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => void loadFeed()}>
          <Text style={styles.retryButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
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
  centered: {
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
    fontFamily: "Inter",
    marginBottom: 8,
  },
  errorBody: {
    fontSize: 14,
    color: "#D1D5DB",
    textAlign: "center",
    fontFamily: "Inter",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter",
    marginBottom: 8,
  },
  emptyBody: {
    fontSize: 14,
    color: "#D1D5DB",
    textAlign: "center",
    fontFamily: "Inter",
    lineHeight: 20,
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
    fontFamily: "Inter",
  },
  footerLoader: {
    alignItems: "center",
    justifyContent: "center",
  },
 
});
