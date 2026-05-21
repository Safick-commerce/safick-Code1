import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { LivePost } from "../types";
import { fetchLiveFeed, filterLivePostsByQuery } from "../utils/liveFeed";
import { fetchPopularSellers, type SellerPreview } from "../utils/searchApi";
import { GuestSignInPlaceholder } from "../components/auth/GuestSignInPlaceholder";
import { useAuth } from "../context/AuthContext";
import LivePostsGrid from "../components/live/LivePostsGrid";
import { DISCOVER_CATEGORIES } from "../constants/categories";

const DEBOUNCE_MS = 300;
const RED = "#FF2800";

const LIVE_SUGGESTION_CHIPS = [
  "Fashion",
  "Beauty",
  "Electronics",
  "Shoes",
  "Home",
  "Accessories",
  "Douala sellers",
  "Live deals",
] as const;

function sellerLabel(s: SellerPreview): string {
  return s.display_name?.trim() || s.full_name?.trim() || (s.username ? `@${s.username}` : "Seller");
}

function findCategoryByText(q: string) {
  const t = q.trim().toLowerCase();
  if (!t) return undefined;
  return DISCOVER_CATEGORIES.find((c) => c.name.toLowerCase() === t);
}

function categoryFromSuggestion(label: string): string | undefined {
  const hit = DISCOVER_CATEGORIES.find(
    (c) => c.name.toLowerCase() === label.trim().toLowerCase()
  );
  return hit?.name;
}

/** True if this profile has at least one `isLive` row in the current feed (id match, then name match). */
function sellerIsCurrentlyLive(s: SellerPreview, posts: LivePost[]): boolean {
  return posts.some((p) => {
    if (p.isLive !== true) return false;
    if (p.sellerId && p.sellerId === s.id) return true;
    const sn = p.sellerName.trim().toLowerCase();
    const candidates = [s.display_name, s.full_name, s.username]
      .filter(Boolean)
      .map((x) => String(x).trim().toLowerCase().replace(/^@/, ""));
    return candidates.some((c) => c && (sn === c || sn.includes(c) || c.includes(sn)));
  });
}

function TopSellerTile({
  seller,
  isLive,
  onPress,
}: {
  seller: SellerPreview;
  isLive: boolean;
  onPress: () => void;
}) {
  const ringOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isLive) {
      ringOpacity.setValue(1);
      return;
    }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(ringOpacity, {
          toValue: 0.28,
          duration: 650,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(ringOpacity, {
          toValue: 1,
          duration: 650,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [isLive, ringOpacity]);

  const label = sellerLabel(seller);
  const city = seller.city?.trim() || "";
  const a11y = [label, city || undefined, isLive ? "live now" : undefined].filter(Boolean).join(", ");
  return (
    <Pressable
      style={styles.sellerTile}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11y}
    >
      <View style={styles.sellerAvatarShell}>
        {isLive ? (
          <Animated.View
            pointerEvents="none"
            style={[styles.sellerLiveRing, { opacity: ringOpacity }]}
          />
        ) : null}
        <View style={styles.sellerAvatar}>
          {seller.avatar_url ? (
            <Image source={{ uri: seller.avatar_url }} style={styles.sellerAvatarImg} resizeMode="cover" />
          ) : (
            <Ionicons name="person" size={22} color="#9CA3AF" />
          )}
        </View>
      </View>
      <View style={styles.sellerTextBlock}>
        {city ? (
          <Text style={styles.sellerLocation} numberOfLines={1}>
            {city}
          </Text>
        ) : null}
        <Text style={styles.sellerName} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

export default function UnboxSearchScreen() {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);
  const { isAuthenticated, isReady } = useAuth();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [posts, setPosts] = useState<LivePost[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sellers, setSellers] = useState<SellerPreview[]>([]);
  const [sellersLoading, setSellersLoading] = useState(true);

  const showExplore = debounced.length === 0;

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await fetchLiveFeed();
        if (!cancelled) {
          setPosts(rows);
          setLoadError(null);
        }
      } catch {
        if (!cancelled) {
          setLoadError("Could not load live feed.");
          setPosts([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setSellersLoading(true);
      try {
        const rows = await fetchPopularSellers(12);
        if (!cancelled) setSellers(rows);
      } finally {
        if (!cancelled) setSellersLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => filterLivePostsByQuery(posts, debounced), [posts, debounced]);
  const matchedCategory = useMemo(() => findCategoryByText(debounced), [debounced]);

  const handleBack = useCallback(() => {
    Keyboard.dismiss();
    router.back();
  }, [router]);

  const openCategoryHub = useCallback(
    (name: string) => {
      Keyboard.dismiss();
      try {
        router.push({ pathname: "/discover-category", params: { category: name } });
      } catch (e) {
        console.error("[unbox-search] discover-category", e);
      }
    },
    [router]
  );

  const openSeller = useCallback(
    (sellerId: string) => {
      Keyboard.dismiss();
      router.push({ pathname: "/userTab", params: { userId: sellerId } });
    },
    [router]
  );

  const onSubmitSearch = useCallback(() => {
    const m = findCategoryByText(query);
    if (m) {
      openCategoryHub(m.name);
      return;
    }
    Keyboard.dismiss();
  }, [query, openCategoryHub]);

  const onSuggestionPress = useCallback(
    (label: string) => {
      const cat = categoryFromSuggestion(label);
      if (cat) {
        openCategoryHub(cat);
        return;
      }
      setQuery(label.replace(/\s+sellers?$/i, "").trim() || label);
    },
    [openCategoryHub]
  );

  const listHeader = useMemo(
    () => (
      <>
        {loadError ? <Text style={styles.errorBanner}>{loadError}</Text> : null}
        {!showExplore && matchedCategory ? (
          <Pressable
            style={styles.categoryHubBanner}
            onPress={() => openCategoryHub(matchedCategory.name)}
            accessibilityRole="button"
            accessibilityLabel={`Open ${matchedCategory.name} hub`}
          >
            <Ionicons name="grid" size={22} color={RED} />
            <View style={styles.categoryHubBannerText}>
              <Text style={styles.categoryHubTitle}>Open {matchedCategory.name} hub</Text>
              <Text style={styles.categoryHubSub}>Filters · deals · trending (preview)</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </Pressable>
        ) : null}
        <Text style={styles.hint}>
          {showExplore
            ? ""
            : `${filtered.length} live result${filtered.length === 1 ? "" : "s"}`}
        </Text>
      </>
    ),
    [loadError, showExplore, matchedCategory, filtered.length, openCategoryHub]
  );

  const listEmpty = useMemo(() => {
    if (loadError) {
      return (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>Check the banner above, then try again.</Text>
        </View>
      );
    }
    if (posts.length === 0) {
      return (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>Nothing in the feed yet.</Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyText}>No lives or replays match &quot;{debounced}&quot;.</Text>
      </View>
    );
  }, [loadError, posts.length, debounced]);

  const onScrollBeginDrag = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  if (!isReady) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <View style={styles.centered}>
          <Text style={styles.muted}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return (
      <GuestSignInPlaceholder subtitle="Sign in to search live and replays on Unbox." />
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.topBar}>
        <Pressable onPress={handleBack} hitSlop={12} style={styles.backBtn} accessibilityRole="button">
          <Ionicons name="chevron-back" size={26} color="#111827" />
        </Pressable>
        <View style={styles.inputWrap}>
          <Ionicons name="search" size={22} color="#000000" />
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Search lives, sellers, or a category…"
            placeholderTextColor="rgba(0, 0, 0, 0.62)"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={onSubmitSearch}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Search live"
            accessibilityRole="search"
          />
          {query.length > 0 ? (
            <Pressable
              onPress={() => setQuery("")}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Ionicons name="close-circle" size={22} color="#9CA3AF" />
            </Pressable>
          ) : null}
        </View>
      </View>

      {showExplore ? (
        <ScrollView
          style={styles.exploreScroll}
          contentContainerStyle={styles.exploreContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={Keyboard.dismiss}
        >
          {loadError ? <Text style={styles.errorBanner}>{loadError}</Text> : null}

          <Text style={[styles.sectionTitle, styles.sectionTitleFirst]}>Suggestions</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {LIVE_SUGGESTION_CHIPS.map((label) => (
              <Pressable
                key={label}
                style={styles.suggestionChip}
                onPress={() => onSuggestionPress(label)}
                accessibilityRole="button"
              >
                <Text style={styles.suggestionChipText}>{label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.sectionTitle}>Top live sellers</Text>
          {sellersLoading ? (
            <ActivityIndicator color={RED} style={styles.sellersSpinner} />
          ) : sellers.length === 0 ? (
            <Text style={styles.mutedSmall}>No sellers to highlight yet.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sellerRow}>
              {sellers.map((s) => (
                <TopSellerTile
                  key={s.id}
                  seller={s}
                  isLive={sellerIsCurrentlyLive(s, posts)}
                  onPress={() => openSeller(s.id)}
                />
              ))}
            </ScrollView>
          )}

        </ScrollView>
      ) : (
        <LivePostsGrid
          posts={filtered}
          postsPerRow={2}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={listEmpty}
          onScrollBeginDrag={onScrollBeginDrag}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  backBtn: { padding: 6 },
  inputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#000000",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
    padding: 0,
    marginLeft: 10,
  },
  exploreScroll: { flex: 1 },
  exploreContent: { paddingBottom: 32 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    paddingHorizontal: 18,
    marginTop: 20,
  },
  sectionTitleFirst: {
    marginTop: 18,
    marginBottom: 10,
  },
  chipRow: { flexDirection: "row", gap: 8, paddingHorizontal: 14, paddingBottom: 4 },
  suggestionChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginRight: 8,
  },
  suggestionChipText: { fontSize: 14, fontWeight: "600", color: "#334155" },
  sellersSpinner: { marginVertical: 16 },
  mutedSmall: { fontSize: 14, color: "#94A3B8", paddingHorizontal: 16, marginBottom: 8 },
  sellerRow: { flexDirection: "row", gap: 4, paddingHorizontal: 16, paddingVertical: 8 },
  sellerTile: { width: 88, alignItems: "center", marginRight: 12 },
  sellerAvatarShell: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
  },
  sellerLiveRing: {
    position: "absolute",
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: RED,
  },
  sellerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  sellerAvatarImg: { width: "100%", height: "100%" },
  sellerTextBlock: {
    marginTop: 6,
    width: "100%",
    alignItems: "center",
  },
  sellerLocation: {
    fontSize: 11,
    fontWeight: "500",
    color: "#64748B",
    textAlign: "center",
    width: "100%",
    marginBottom: 2,
  },
  sellerName: { fontSize: 12, fontWeight: "600", color: "#111827", textAlign: "center", width: "100%" },
  livePreviewRow: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 8, gap: 10 },
  livePreviewCard: { width: 120 },
  livePreviewImg: {
    width: 120,
    height: 160,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
  },
  livePreviewSeller: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    marginTop: 8,
  },
  categoryHubBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    padding: 14,
    backgroundColor: "#FFF5F5",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  categoryHubBannerText: { flex: 1, minWidth: 0 },
  categoryHubTitle: { fontSize: 16, fontWeight: "800", color: "#111827" },
  categoryHubSub: { fontSize: 12, color: "#64748B", marginTop: 2 },
  errorBanner: {
    color: "#B91C1C",
    fontSize: 14,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    fontWeight: "600",
  },
  hint: {
    fontSize: 13,
    color: "#64748B",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  emptyWrap: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
  },
  emptyText: { fontSize: 15, color: "#64748B", textAlign: "center", lineHeight: 22 },
  muted: { fontSize: 16, color: "#6B7280" },
});
