/** This screen is used to display a list of clips for a seller's seller profile account bothe public and private. */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewToken,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import ForYouVideoPage from "../components/forYou/ForYouVideoPage";
import { useAuth } from "../context/AuthContext";
import { fetchSellerProfileClips, indexOfClip } from "../utils/profileClips";
import { recordProductView, type ForYouFeedItem } from "../utils/forYouFeed";

const ROUTES = {
  PRODUCT_DETAILS: "/productDetails",
  SIGN_IN: "/auth/signin",
  USER_TAB: "/userTab",
  SEARCH: "/search",
} as const;

/** Back + search row height (below status bar). */
const HEADER_ROW_HEIGHT = 48;

function normalizeParam(v: string | string[] | undefined): string | undefined {
  if (v == null) return undefined;
  const raw = Array.isArray(v) ? v[0] : v;
  const t = typeof raw === "string" ? raw.trim() : "";
  return t || undefined;
}

export default function ProfileClipsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    sellerId?: string | string[];
    clipId?: string | string[];
  }>();
  const sellerId = normalizeParam(params.sellerId);
  const clipId = normalizeParam(params.clipId);

  const { isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();
  const sellerRowTop = insets.top + HEADER_ROW_HEIGHT + 8;

  const [pageHeight, setPageHeight] = useState(0);
  const [items, setItems] = useState<ForYouFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [followingBySeller, setFollowingBySeller] = useState<Record<string, boolean>>({});
  const [appActive, setAppActive] = useState(AppState.currentState === "active");

  const listRef = useRef<FlatList<ForYouFeedItem>>(null);
  const initialIndexRef = useRef(0);
  const viewedIds = useRef(new Set<string>());

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      setAppActive(state === "active");
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!sellerId) {
      setError("Missing seller.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const clips = await fetchSellerProfileClips(sellerId);
        if (cancelled) return;
        const startIndex = indexOfClip(clips, clipId);
        initialIndexRef.current = startIndex;
        setItems(clips);
        setActiveIndex(startIndex);
        if (clips.length === 0) {
          setError("No clips to play.");
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not load clips.");
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sellerId, clipId]);

  useEffect(() => {
    if (loading || pageHeight <= 0 || items.length === 0) return;
    const idx = initialIndexRef.current;
    if (idx <= 0) return;
    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({ index: idx, animated: false });
    });
  }, [loading, pageHeight, items.length]);

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

  const openProductDetails = useCallback(
    (id: string) => {
      router.push({ pathname: ROUTES.PRODUCT_DETAILS, params: { id } });
    },
    [router],
  );

  const openSearch = useCallback(() => {
    try {
      router.push(ROUTES.SEARCH);
    } catch (e) {
      console.error("[profile-clips] navigate search", e);
    }
  }, [router]);

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

  const toggleFollow = useCallback((id: string) => {
    setFollowingBySeller((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const trackView = useCallback((productId: string) => {
    if (viewedIds.current.has(productId)) return;
    viewedIds.current.add(productId);
    void recordProductView(productId).catch(() => {
      viewedIds.current.delete(productId);
    });
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: ForYouFeedItem; index: number }) => (
      <ForYouVideoPage
        item={item}
        pageHeight={pageHeight}
        variant="profile"
        profileSellerTop={sellerRowTop}
        isActive={appActive && index === activeIndex}
        isFollowing={Boolean(followingBySeller[item.seller.id])}
        onToggleFollow={() => toggleFollow(item.seller.id)}
        onBuyPress={() => handleBuyPress(item)}
        onSellerPress={() => handleSellerPress(item)}
        onBecameActive={() => trackView(item.id)}
      />
    ),
    [
      activeIndex,
      appActive,
      followingBySeller,
      handleBuyPress,
      handleSellerPress,
      pageHeight,
      toggleFollow,
      trackView,
      sellerRowTop,
    ],
  );

  return (
    <View style={styles.root}>
      <View
        style={styles.feedHost}
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (h > 0 && h !== pageHeight) setPageHeight(h);
        }}
      >
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color="#FFFFFF" size="large" />
          </View>
        ) : error && items.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.backChip} onPress={() => router.back()}>
              <Text style={styles.backChipText}>Go back</Text>
            </TouchableOpacity>
          </View>
        ) : pageHeight > 0 && items.length > 0 ? (
          <FlatList
            ref={listRef}
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            pagingEnabled
            snapToInterval={pageHeight}
            snapToAlignment="start"
            decelerationRate="fast"
            showsVerticalScrollIndicator={false}
            initialScrollIndex={initialIndexRef.current}
            getItemLayout={(_, index) => ({
              length: pageHeight,
              offset: pageHeight * index,
              index,
            })}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            onScrollToIndexFailed={(info) => {
              listRef.current?.scrollToOffset({
                offset: info.averageItemLength * info.index,
                animated: false,
              });
            }}
          />
        ) : null}
      </View>

      <View
        style={[styles.headerOverlay, { paddingTop: insets.top }]}
        pointerEvents="box-none"
      >
        <View style={[styles.headerRow, { height: HEADER_ROW_HEIGHT }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Back to profile"
          >
            <MaterialIcons name="keyboard-arrow-left" size={36} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.searchBarContainer}
            onPress={openSearch}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="Search Safick"
          >
            <Ionicons name="search" size={22} color="rgba(255,255,255,0.9)" />
            <Text style={styles.searchPlaceholder} numberOfLines={1}>
              Search Safick...
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000000",
  },
  feedHost: {
    flex: 1,
  },
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "transparent",
    zIndex: 2,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    gap: 4,
    backgroundColor: "transparent",
  },
  backButton: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.35)",
  },
  searchPlaceholder: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.75)",
    includeFontPadding: false,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 16,
  },
  errorText: {
    color: "#F9FAFB",
    fontSize: 15,
    textAlign: "center",
  },
  backChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  backChipText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
