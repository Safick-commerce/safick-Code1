import { useCallback, useMemo, useState } from "react";
import {
  Dimensions,
  Image,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { DISCOVER_CATEGORIES, type DiscoverCategoryName } from "../constants/categories";

const RED = "#FF2800";
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GAP = 1;
const PAD = 10;
const CARD_W = (SCREEN_WIDTH - PAD * 2 - GAP) / 2;

const HUB_SEGMENTS = [
  "Recommended",
  "Buy it now",
  "Popular",
  "New",
  "Trending",
  "Sales",
  "Best",
  "Limited",
] as const;

type HubSegment = (typeof HUB_SEGMENTS)[number];

type HubItem = {
  id: string;
  title: string;
  price: string;
  seller: string;
  image: number;
  segments: HubSegment[];
};

/** Preview grid until category + listings API exists. */
function buildHubItems(category: string): HubItem[] {
  const c = category.trim() || "All";
  return [
    
  ];
}

function normalizeParam(v: string | string[] | undefined): string {
  if (v == null) return "";
  const raw = Array.isArray(v) ? v[0] : v;
  return typeof raw === "string" ? raw.trim() : "";
}

function isKnownCategory(name: string): name is DiscoverCategoryName {
  return DISCOVER_CATEGORIES.some((c) => c.name === name);
}

export default function DiscoverCategoryScreen() {
  const router = useRouter();
  const { category: categoryParam } = useLocalSearchParams<{ category?: string | string[] }>();
  const category = normalizeParam(categoryParam);

  const [segment, setSegment] = useState<HubSegment>("Recommended");

  const items = useMemo(() => buildHubItems(category || "Shop"), [category]);

  const filtered = useMemo(() => {
    if (segment === "Recommended") return items;
    return items.filter((it) => it.segments.includes(segment));
  }, [items, segment]);

  const handleBack = useCallback(() => {
    Keyboard.dismiss();
    router.back();
  }, [router]);

  const title = category && isKnownCategory(category) ? category : category || "Browse";

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.headerCluster}>
        <View style={styles.topBar}>
          <Pressable onPress={handleBack} hitSlop={12} style={styles.backBtn} accessibilityRole="button">
            <Ionicons name="chevron-back" size={26} color="#111827" />
          </Pressable>
          <View style={styles.titleBlock}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.segmentScroll}
          style={styles.segmentRow}
          keyboardShouldPersistTaps="handled"
        >
          {HUB_SEGMENTS.map((s) => (
            <Pressable
              key={s}
              onPress={() => setSegment(s)}
              style={[styles.segmentChip, segment === s && styles.segmentChipOn]}
              accessibilityRole="button"
              accessibilityState={{ selected: segment === s }}
            >
              <Text style={[styles.segmentText, segment === s && styles.segmentTextOn]} numberOfLines={1}>
                {s}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {filtered.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>No items for &quot;{segment}&quot; in this preview.</Text>
          <Text style={styles.emptySub}>Try Recommended or another filter.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.gridWrap}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.grid}>
            {filtered.map((item) => (
              <Pressable
                key={item.id}
                style={styles.card}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}, ${item.price}`}
              >
                <Image source={item.image} style={styles.cardImage} resizeMode="cover" />
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.cardSeller} numberOfLines={1}>
                    {item.seller}
                  </Text>
                  <Text style={styles.cardPrice}>{item.price}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  headerCluster: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F1F5F9",
    backgroundColor: "#FFFFFF",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 2,
    gap: 8,
  },
  segmentRow: { marginTop: -2 },
  backBtn: { padding: 6 },
  titleBlock: { flex: 1, minWidth: 0 },
  title: { fontSize: 20, fontWeight: "800", color: "#111827" },
  segmentScroll: {
    paddingHorizontal: PAD,
    paddingTop: 2,
    paddingBottom: 10,
    gap: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  segmentChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  segmentChipOn: {
    borderColor: RED,
    backgroundColor: "#FFF5F5",
  },
  segmentText: { fontSize: 13, fontWeight: "600", color: "#475569" },
  segmentTextOn: { color: RED },
  gridWrap: { padding: PAD, paddingBottom: 40 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: GAP },
  card: {
    width: CARD_W,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  cardImage: { width: "100%", height: CARD_W * 1.15, backgroundColor: "#F1F5F9" },
  cardBody: { padding: 10 },
  cardTitle: { fontSize: 14, fontWeight: "700", color: "#111827", minHeight: 40 },
  cardSeller: { fontSize: 12, color: "#64748B", marginTop: 4 },
  cardPrice: { fontSize: 15, fontWeight: "800", color: RED, marginTop: 6 },
  emptyWrap: {
    flex: 1,
    paddingHorizontal: 32,
    paddingBottom: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: { fontSize: 16, fontWeight: "600", color: "#374151", textAlign: "center" },
  emptySub: { fontSize: 14, color: "#94A3B8", marginTop: 8, textAlign: "center", lineHeight: 20 },
});
