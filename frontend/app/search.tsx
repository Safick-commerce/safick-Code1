import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
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
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  fetchPopularSellers,
  formatPriceXaf,
  type ProductSort,
  type SellerPreview,
  searchProducts,
  searchSellers,
} from "../utils/searchApi";
import type { StoreProduct } from "../types/storeProduct";
import type { LivePost } from "../types";
import { MOCK_LIVE_POSTS } from "../data/mockLivePosts";
import { useLanguage } from "../context/LanguageContext";

const RED = "#FF2800";
const DEBOUNCE_MS = 350;
const MIN_QUERY_LEN = 2;

const ROUTES = {
  CATEGORIES: "/(tabs)/categories",
  UNBOX: "/(tabs)/unbox",
} as const;

const TRENDING_SEARCHES = [
  "Robe",
  "Téléphone",
  "Chaussures",
  "Douala",
  "Sac",
  "Beauté",
  "Maquillage",
  "Montre",
] as const;

type ScopeFilter = "all" | "products" | "sellers" | "live";

function sellerLabel(s: SellerPreview, sellerFallback: string): string {
  return s.display_name?.trim() || s.full_name?.trim() || (s.username ? `@${s.username}` : sellerFallback);
}

/** Location line for seller cards (Popular / search results). */
function sellerLocationLine(s: SellerPreview, locationNotSet: string): string {
  const c = s.city?.trim();
  if (c) return c;
  return locationNotSet;
}

function formatViewerCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

function LiveSearchCard({ post, onPress }: { post: LivePost; onPress: () => void }) {
  const { t } = useLanguage();
  return (
    <Pressable
      style={styles.liveTile}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${post.sellerName} live`}
    >
      <Image
        source={typeof post.imageUrl === "string" ? { uri: post.imageUrl } : post.imageUrl}
        style={styles.liveThumb}
        resizeMode="cover"
      />
      <View style={styles.liveBadgeRow}>
        <View style={styles.liveDot} />
        <Text style={styles.liveBadgeText}>{t("common_live")}</Text>
      </View>
      <Text style={styles.liveSellerName} numberOfLines={1}>
        {post.sellerName}
      </Text>
      <Text style={styles.liveDesc} numberOfLines={2}>
        {post.description}
      </Text>
      {post.viewerCount != null ? (
        <Text style={styles.liveViewers}>{t("search_watching", { count: formatViewerCount(post.viewerCount ?? 0) })}</Text>
      ) : null}
    </Pressable>
  );
}

function SellerAvatar({ url }: { url: string | null }) {
  if (url) {
    return <Image source={{ uri: url }} style={styles.sellerAvatarImage} resizeMode="cover" />;
  }
  return <Ionicons name="person" size={26} color="#9CA3AF" />;
}

export default function SearchScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const sellerFallback = t("common_seller");
  const locationNotSet = t("search_location_not_set");
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [scope, setScope] = useState<ScopeFilter>("all");
  const [sort, setSort] = useState<ProductSort>("newest");
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [sellers, setSellers] = useState<SellerPreview[]>([]);
  const [popular, setPopular] = useState<SellerPreview[]>([]);
  const [loadingDiscover, setLoadingDiscover] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);

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
      setLoadingDiscover(true);
      try {
        const rows = await fetchPopularSellers(10);
        if (!cancelled) setPopular(rows);
      } finally {
        if (!cancelled) setLoadingDiscover(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (scope === "live") {
      setProducts([]);
      setSellers([]);
      setLoadingResults(false);
      return;
    }
    if (debounced.length < MIN_QUERY_LEN) {
      setProducts([]);
      setSellers([]);
      setLoadingResults(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoadingResults(true);
      try {
        if (scope === "products") {
          const p = await searchProducts(debounced, sort, 40);
          if (!cancelled) {
            setProducts(p);
            setSellers([]);
          }
        } else if (scope === "sellers") {
          const s = await searchSellers(debounced, 30);
          if (!cancelled) {
            setSellers(s);
            setProducts([]);
          }
        } else {
          const [p, s] = await Promise.all([
            searchProducts(debounced, sort, 40),
            searchSellers(debounced, 30),
          ]);
          if (!cancelled) {
            setProducts(p);
            setSellers(s);
          }
        }
      } finally {
        if (!cancelled) setLoadingResults(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [debounced, scope, sort]);

  const handleBack = useCallback(() => {
    Keyboard.dismiss();
    router.back();
  }, [router]);

  const applyTrending = useCallback((term: string) => {
    setQuery(term);
  }, []);

  const openProduct = useCallback(
    (id: string) => {
      Keyboard.dismiss();
      router.push({ pathname: "/productDetails", params: { id } });
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

  const openUnbox = useCallback(() => {
    Keyboard.dismiss();
    try {
      router.push(ROUTES.UNBOX);
    } catch (e) {
      console.error("[search] navigate unbox", e);
    }
  }, [router]);

  const showExplore = debounced.length < MIN_QUERY_LEN;

  const liveFiltered = useMemo(() => {
    if (scope !== "live") return [];
    const q = debounced.trim().toLowerCase();
    if (q.length < MIN_QUERY_LEN) return [];
    return MOCK_LIVE_POSTS.filter(
      (p) =>
        p.sellerName.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
    );
  }, [scope, debounced]);

  const hasResults =
    products.length > 0 ||
    sellers.length > 0 ||
    (scope === "live" && liveFiltered.length > 0);
  const showEmptySearch =
    debounced.length >= MIN_QUERY_LEN && !loadingResults && !hasResults;

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
            placeholder={t("search_placeholder")}
            placeholderTextColor="rgba(0, 0, 0, 0.62)"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel={t("common_search")}
            accessibilityRole="search"
          />
          {query.length > 0 ? (
            <Pressable
              onPress={() => setQuery("")}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t("common_clear_search")}
            >
              <Ionicons name="close-circle" size={22} color="#9CA3AF" />
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.chipsRow}>
        <Text style={styles.chipsLabel}>{t("search_show")}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
          {(
            [
              { key: "all" as const, label: t("search_scope_all") },
              { key: "products" as const, label: t("search_scope_products") },
              { key: "sellers" as const, label: t("search_scope_sellers") },
              { key: "live" as const, label: t("search_scope_live") },
            ] as const
          ).map(({ key, label }) => (
            <Pressable
              key={key}
              onPress={() => setScope(key)}
              style={[styles.chip, scope === key && styles.chipOn]}
              accessibilityRole="button"
              accessibilityState={{ selected: scope === key }}
            >
              <Text style={[styles.chipText, scope === key && styles.chipTextOn]}>{label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {scope !== "sellers" && scope !== "live" && debounced.length >= MIN_QUERY_LEN ? (
        <View style={styles.sortRow}>
          <Text style={styles.chipsLabel}>{t("search_sort_products")}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
            {(
              [
                { key: "newest" as const, label: t("search_sort_newest") },
                { key: "price_asc" as const, label: t("search_sort_price_asc") },
                { key: "price_desc" as const, label: t("search_sort_price_desc") },
              ] as const
            ).map(({ key, label }) => (
              <Pressable
                key={key}
                onPress={() => setSort(key)}
                style={[styles.chip, sort === key && styles.chipOn]}
                accessibilityRole="button"
              >
                <Text style={[styles.chipText, sort === key && styles.chipTextOn]}>{label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={Keyboard.dismiss}
      >
        {showExplore ? (
          scope === "live" ? (
            <>
              <Text style={styles.sectionTitle}>{t("search_live_now")}</Text>
              <Text style={styles.muted}>{t("search_live_preview")}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.liveScroll}
              >
                {MOCK_LIVE_POSTS.map((post) => (
                  <LiveSearchCard key={post.id} post={post} onPress={openUnbox} />
                ))}
              </ScrollView>
            </>
          ) : (
          <>
            <Text style={styles.sectionTitle}>{t("search_trending")}</Text>
            <View style={styles.trendGrid}>
              {TRENDING_SEARCHES.map((term) => (
                <Pressable
                  key={term}
                  onPress={() => applyTrending(term)}
                  style={styles.trendChip}
                  accessibilityRole="button"
                >
                  <Ionicons name="trending-up" size={16} color={RED} />
                  <Text style={styles.trendText}>{term}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.sectionTitle}>{t("search_popular_sellers")}</Text>
            {loadingDiscover ? (
              <ActivityIndicator color={RED} style={styles.blockPad} />
            ) : popular.length === 0 ? (
              <Text style={styles.muted}>{t("search_no_sellers")}</Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.popularSellersScroll}
              >
                {popular.map((s) => (
                  <Pressable
                    key={s.id}
                    style={styles.popularSellerTile}
                    onPress={() => openSeller(s.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`${sellerLabel(s, sellerFallback)}, ${sellerLocationLine(s, locationNotSet)}`}
                  >
                    <View style={styles.popularSellerAvatar}>
                      <SellerAvatar url={s.avatar_url} />
                    </View>
                    <Text style={styles.popularSellerLocation} numberOfLines={1}>
                      {sellerLocationLine(s, locationNotSet)}
                    </Text>
                    <Text style={styles.popularSellerName} numberOfLines={1}>
                      {sellerLabel(s, sellerFallback)}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </>
          )
        ) : null}

        {debounced.length >= MIN_QUERY_LEN && loadingResults ? (
          <ActivityIndicator color={RED} style={styles.blockPad} />
        ) : null}

        {scope !== "sellers" && scope !== "live" && products.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>{t("search_products_count", { count: products.length })}</Text>
            {products.map((p) => (
              <Pressable
                key={p.id}
                style={styles.listRow}
                onPress={() => openProduct(p.id)}
                accessibilityRole="button"
              >
                <View style={styles.rowIcon}>
                  <Ionicons name="pricetag-outline" size={20} color="#6B7280" />
                </View>
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle} numberOfLines={2}>
                    {p.title}
                  </Text>
                  <Text style={styles.rowPrice}>{formatPriceXaf(p.price)}</Text>
                  {p.description ? (
                    <Text style={styles.rowSub} numberOfLines={2}>
                      {p.description}
                    </Text>
                  ) : null}
                </View>
                <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
              </Pressable>
            ))}
          </>
        ) : null}

        {scope !== "products" && scope !== "live" && sellers.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>{t("search_sellers_count", { count: sellers.length })}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.popularSellersScroll}
            >
              {sellers.map((s) => (
                <Pressable
                  key={s.id}
                  style={styles.popularSellerTile}
                  onPress={() => openSeller(s.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`${sellerLabel(s, sellerFallback)}, ${sellerLocationLine(s, locationNotSet)}`}
                >
                  <View style={styles.popularSellerAvatar}>
                    <SellerAvatar url={s.avatar_url} />
                  </View>
                  <Text style={styles.popularSellerLocation} numberOfLines={1}>
                    {sellerLocationLine(s, locationNotSet)}
                  </Text>
                  <Text style={styles.popularSellerName} numberOfLines={1}>
                    {sellerLabel(s, sellerFallback)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </>
        ) : null}

        {scope === "live" && debounced.length >= MIN_QUERY_LEN && liveFiltered.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>{t("search_live_count", { count: liveFiltered.length })}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.liveScroll}
            >
              {liveFiltered.map((post) => (
                <LiveSearchCard key={post.id} post={post} onPress={openUnbox} />
              ))}
            </ScrollView>
          </>
        ) : null}

        {showEmptySearch ? (
          <Text style={styles.emptyText}>{t("search_no_results", { query: debounced })}</Text>
        ) : null}

        {debounced.length === 1 ? (
          <Text style={styles.hint}>{t("search_min_chars", { count: MIN_QUERY_LEN })}</Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#000000', // primary-600
    shadowColor: '#000000',
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
  chipsRow: {
    paddingVertical: 10,
    paddingLeft: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F1F5F9",
  },
  sortRow: {
    paddingVertical: 8,
    paddingLeft: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F1F5F9",
  },
  chipsLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 8,
  },
  chipsScroll: { gap: 8, paddingRight: 16 },
  tabShortcuts: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F1F5F9",
  },
  tabShortcutsRow: { flexDirection: "row", gap: 10 },
  tabShortcut: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  tabShortcutText: { flex: 1, fontSize: 15, fontWeight: "600", color: "#111827" },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  chipOn: {
    backgroundColor: "#FFFFFF",
    borderColor: RED,
  },
  chipText: { fontSize: 14, color: "#475569", fontWeight: "600" },
  chipTextOn: { color: RED },
  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
    marginTop: 8,
  },
  liveScroll: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingRight: 16,
    gap: 12,
  },
  liveTile: {
    width: 120,
    marginRight: 4,
  },
  liveThumb: {
    width: 120,
    height: 160,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
  },
  liveBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: RED,
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: RED,
    letterSpacing: 0.4,
  },
  liveSellerName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    marginTop: 4,
  },
  liveDesc: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  liveViewers: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 4,
    fontWeight: "500",
  },
  trendGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  trendChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  trendText: { fontSize: 14, color: "#334155", fontWeight: "600" },
  popularSellersScroll: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingRight: 16,
    gap: 4,
  },
  popularSellerTile: {
    width: 102,
    alignItems: "center",
    marginRight: 12,
  },
  popularSellerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F1F5F9",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  sellerAvatarImage: { width: "100%", height: "100%" },
  popularSellerLocation: {
    width: "100%",
    fontSize: 11,
    fontWeight: "500",
    color: "#64748B",
    textAlign: "center",
    marginTop: 8,
  },
  popularSellerName: {
    width: "100%",
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginTop: 2,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 12,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 16, fontWeight: "600", color: "#111827" },
  rowSub: { fontSize: 14, color: "#64748B", marginTop: 2 },
  rowPrice: { fontSize: 15, fontWeight: "700", color: RED, marginTop: 4 },
  muted: { fontSize: 14, color: "#94A3B8" },
  emptyText: { fontSize: 15, color: "#64748B", textAlign: "center", marginTop: 24 },
  hint: { fontSize: 14, color: "#94A3B8", marginTop: 12 },
  blockPad: { marginVertical: 20 },
});
