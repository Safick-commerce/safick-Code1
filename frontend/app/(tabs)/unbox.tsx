import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import LivePostsGrid from "../../components/live/LivePostsGrid";
import { MOCK_LIVE_POSTS } from "../../data/mockLivePosts";
import { DISCOVER_CATEGORIES } from "../../constants/categories";
import { filterLivePostsByDiscoverCategory } from "../../utils/liveFeed";
import { ReadyToShareBannerDecoration } from "../../components/shared/ReadyToShareBannerDecoration";
import { GuestSignInPlaceholder } from "../../components/auth/GuestSignInPlaceholder";
import { useAuth } from "../../context/AuthContext";
import { useUserProfile } from "../../context/UserProfileContext";

// Route constants for security
const ROUTES = {
  UNBOX_SEARCH: "/unbox-search",
  NOTIFICATIONS: "/notifications",
  CREATE_NEW: "/createnew",
  GO_LIVE: "/golive",
  SELLER_ONBOARDING: "/screens/readytoshare/sellersonboardingscreen",
} as const;

const TRENDING_NOW = [
  { id: "1", image: require("../../assets/images/fashion.jpg"), title: "Summer fit check", views: "12.3K", seller: "Brenda Style" },
  { id: "2", image: require("../../assets/images/beauty.jpg"), title: "Glow up routine", views: "8.7K", seller: "GlowUp" },
  { id: "3", image: require("../../assets/images/bags.jpg"), title: "Bag haul unboxing", views: "6.1K", seller: "LuxBags" },
  { id: "4", image: require("../../assets/images/jewelry.jpg"), title: "Jewelry collection", views: "5.4K", seller: "Shine Co." },
  { id: "5", image: require("../../assets/images/clothes.jpg"), title: "Thrift finds of the week", views: "9.2K", seller: "ThriftQueen" },
] as const;

export default function LiveScreen() {
  const router = useRouter();
  const { isAuthenticated, isReady } = useAuth();
  const { profile, isLoaded: profileLoaded } = useUserProfile();
  const [activeDiscoverCategory, setActiveDiscoverCategory] = useState<string | null>(null);

  const filteredPosts = useMemo(
    () => filterLivePostsByDiscoverCategory(MOCK_LIVE_POSTS, activeDiscoverCategory),
    [activeDiscoverCategory]
  );

  const categoryEmptyHint = useMemo(
    () => (
      <View style={styles.emptyCategoryWrap}>
        <Text style={styles.emptyCategoryTitle}>
          {activeDiscoverCategory
            ? `No lives in ${activeDiscoverCategory} right now`
            : "No lives to show yet"}
        </Text>
        <Text style={styles.emptyCategorySub}>Try another category or check back soon.</Text>
      </View>
    ),
    [activeDiscoverCategory]
  );

  const handleCreateNew = useCallback(() => {
    try {
      if (!profile.readyToSharePromptSeen) {
        router.push(ROUTES.SELLER_ONBOARDING as any);
        return;
      }
      if (profile.readyToShareMode === "seller" && !profile.readyToShareSellerOnboardingCompleted) {
        router.push({ pathname: ROUTES.SELLER_ONBOARDING as any, params: { skipRolechoice: "1" } });
        return;
      }
      router.push(ROUTES.CREATE_NEW);
    } catch (error) {
      console.error("Navigation error:", error);
    }
  }, [profile.readyToShareMode, profile.readyToSharePromptSeen, profile.readyToShareSellerOnboardingCompleted, router]);

  const handleGoLive = useCallback(() => {
    try {
      if (!profile.readyToSharePromptSeen) {
        router.push(ROUTES.SELLER_ONBOARDING as any);
        return;
      }
      if (profile.readyToShareMode === "seller" && !profile.readyToShareSellerOnboardingCompleted) {
        router.push({ pathname: ROUTES.SELLER_ONBOARDING as any, params: { skipRolechoice: "1" } });
        return;
      }
      router.push(ROUTES.GO_LIVE);
    } catch (error) {
      console.error("Navigation error:", error);
    }
  }, [profile.readyToShareMode, profile.readyToSharePromptSeen, profile.readyToShareSellerOnboardingCompleted, router]);

  const openUnboxSearch = useCallback(() => {
    try {
      router.push(ROUTES.UNBOX_SEARCH);
    } catch (e) {
      console.error("[unbox] navigate unbox-search", e);
    }
  }, [router]);

  const openLiveAlerts = useCallback(() => {
    try {
      router.push({ pathname: ROUTES.NOTIFICATIONS, params: { from: "unbox" } });
    } catch (e) {
      console.error("[unbox] navigate notifications", e);
    }
  }, [router]);

  if (!isReady || !profileLoaded) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <View style={styles.centeredLoading}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated || profile.isGuestUser) {
    return (
      <GuestSignInPlaceholder subtitle="Sign in to access live content, create listings, and go live." />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header Section */}
      <View style={[styles.headerOverlay, styles.headerSection]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.searchBarContainer}
            onPress={openUnboxSearch}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="Search live and replays"
          >
            <Ionicons name="search" size={26} color="#000000" />
            <Text style={styles.searchPlaceholder}>Search live…</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerBellButton}
            onPress={openLiveAlerts}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Live alerts and activity"
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
          >
            <Ionicons name="notifications-outline" size={30} color="#000000" />
          </TouchableOpacity>
        </View>
      </View>

      <LivePostsGrid
        posts={filteredPosts}
        postsPerRow={2}
        ListHeaderComponent={
          <>
            {profile.readyToShareMode !== "buyer" ? (
              <View style={styles.bannerContainer}>
                <ReadyToShareBannerDecoration variant="dark" />
                <Text style={styles.bannerTitle}>Ready to share?</Text>
                <Text style={styles.bannerSubtitle}>Start a stream or upload new products</Text>
                <View style={styles.bannerButtons}>
                  <TouchableOpacity style={styles.createNewButton} activeOpacity={0.8} onPress={handleCreateNew} accessibilityRole="button" accessibilityLabel="Create new product">
                    <Ionicons name="add-circle-outline" size={20} color="#000000" />
                    <Text style={styles.createNewText}>Create New</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.goLiveButton} activeOpacity={0.8} onPress={handleGoLive} accessibilityRole="button" accessibilityLabel="Go live">
                    <MaterialCommunityIcons name="television-classic" size={18} color="#FFFFFF" />
                    <Text style={styles.goLiveText}>Go Live</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            {/* Categories */}
            <View style={styles.liveNowHeader}>
              <Text style={styles.liveNowTitle}>Live Now</Text>
            </View>
            <View style={styles.discoverCategoriesWrap}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.discoverCircleScroll}
              >
                <View style={styles.circleContainer}>
                  <TouchableOpacity
                    style={[styles.discoverCircle, activeDiscoverCategory === null && styles.discoverCircleSelected]}
                    onPress={() => setActiveDiscoverCategory(null)}
                    activeOpacity={0.88}
                    accessibilityRole="button"
                    accessibilityLabel="All categories"
                    accessibilityState={{ selected: activeDiscoverCategory === null }}
                  >
                    <MaterialCommunityIcons name="view-grid-outline" size={28} color="#111827" />
                  </TouchableOpacity>
                  <Text style={styles.discoverCircleLabel}>All</Text>
                </View>
                {DISCOVER_CATEGORIES.map((cat) => (
                  <View key={cat.id} style={styles.circleContainer}>
                    <TouchableOpacity
                      style={[
                        styles.discoverCircle,
                        activeDiscoverCategory === cat.name && styles.discoverCircleSelected,
                      ]}
                      onPress={() => setActiveDiscoverCategory(cat.name)}
                      activeOpacity={0.88}
                      accessibilityRole="button"
                      accessibilityLabel={cat.name}
                      accessibilityState={{ selected: activeDiscoverCategory === cat.name }}
                    >
                      <Image source={cat.image} style={styles.discoverCircleImage} resizeMode="cover" />
                    </TouchableOpacity>
                    <Text style={styles.discoverCircleLabel} numberOfLines={1}>
                      {cat.name}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          </>
        }
        ListEmptyComponent={categoryEmptyHint}
        ListFooterComponent={
          <View style={styles.trendingSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Trending Now</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.trendingScroll}
            >
              {TRENDING_NOW.map((item) => (
                <TouchableOpacity key={item.id} style={styles.trendingCard} activeOpacity={0.8} accessibilityRole="button">
                  <View style={styles.trendingImageContainer}>
                    <Image source={item.image} style={styles.trendingImage} resizeMode="cover" />
                    <View style={styles.trendingPlayButton}>
                      <Ionicons name="play" size={20} color="#FFFFFF" />
                    </View>
                    <View style={styles.trendingViewsTag}>
                      <Ionicons name="eye-outline" size={11} color="#FFFFFF" />
                      <Text style={styles.trendingViewsText}>{item.views}</Text>
                    </View>
                  </View>
                  <Text style={styles.trendingTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.trendingSeller}>{item.seller}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  centeredLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "600",
  },
  headerSection: {
    paddingHorizontal: 6,
    paddingTop: 5,
    paddingBottom: 10,
    backgroundColor: '#ffffff',
  },
  headerOverlay: {
    position: 'relative',
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerBellButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#000000',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchPlaceholder: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.45)',
  },
  bannerContainer: {
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 4,
    backgroundColor: '#1C1C2E',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  bannerSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  bannerButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    marginTop: 16,
  },
  createNewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  createNewText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  goLiveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FF2800',
  },
  goLiveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  liveNowHeader: {
    paddingHorizontal: 12,
    marginTop: 20,
    marginBottom: 4,
  },
  liveNowTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  liveNowSub: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '500',
  },
  discoverCategoriesWrap: {
    marginBottom: 4,
  },
  discoverCircleScroll: {
    paddingHorizontal: 5,
    alignItems: "center",
    paddingTop: 4,
    paddingBottom: 8,
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
  discoverCircleLabel: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "500",
    color: "#000000",
    textAlign: "center",
    alignSelf: "stretch",
  },
  emptyCategoryWrap: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  emptyCategoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  emptyCategorySub: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  sectionHeader: {
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  trendingSection: {
    marginTop: 28,
  },
  trendingScroll: {
    paddingLeft: 12,
    gap: 12,
    paddingRight: 12,
  },
  trendingCard: {
    width: 140,
  },
  trendingImageContainer: {
    width: 140,
    height: 190,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#E5E7EB',
  },
  trendingImage: {
    width: '100%',
    height: '100%',
  },
  trendingPlayButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -16 }, { translateY: -16 }],
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 2,
  },
  trendingViewsTag: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  trendingViewsText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  trendingTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
    marginTop: 8,
  },
  trendingSeller: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
});
