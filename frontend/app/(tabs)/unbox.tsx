import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import CategoryFilters from "../../components/live/CategoryFilters";
import LivePostsGrid from "../../components/live/LivePostsGrid";
import { CategoryFilter, LivePost } from "../../types";
import { ReadyToShareBannerDecoration } from "../../components/shared/ReadyToShareBannerDecoration";
import { GuestSignInPlaceholder } from "../../components/auth/GuestSignInPlaceholder";
import { useAuth } from "../../context/AuthContext";
import { useUserProfile } from "../../context/UserProfileContext";

// Route constants for security
const ROUTES = {
  NOTIFICATIONS: "/notifications",
  CREATE_NEW: "/createnew",
  GO_LIVE: "/golive",
  SELLER_ONBOARDING: "/screens/readytoshare/sellersonboardingscreen",
} as const;

// Category constants - matches type definition
const CATEGORIES = ["New", "Sale", "Trending", "Best", "Limited"] as const satisfies readonly CategoryFilter[];

// Mock data - in production, this would come from an API or state management
const MOCK_LIVE_POSTS: LivePost[] = [
  {
    id: "1",
    sellerName: "Moussa K.",
    imageUrl: require("../../assets/images/seller3.jpeg"),
    sellerAvatar: require("../../assets/images/seller.png"),
    description: "Affordable Mufflers for ladies",
    viewerCount: 1200,
    isLive: true,
  },
  {
    id: "2",
    sellerName: "Helena B.",
    imageUrl: require("../../assets/images/seller4.jpeg"),
    sellerAvatar: require("../../assets/images/seller2.png"),
    description: "Premium watches and accessories",
    viewerCount: 856,
    isLive: true,
  },
  {
    id: "3",
    sellerName: "Divine Shop",
    imageUrl: require("../../assets/images/seller3.jpeg"),
    sellerAvatar: require("../../assets/images/seller.png"),
    description: "Home decor and essentials",
    viewerCount: 2400,
    isLive: true,
  },
  {
    id: "4",
    sellerName: "Paul Styles",
    imageUrl: require("../../assets/images/seller4.jpeg"),
    sellerAvatar: require("../../assets/images/seller2.png"),
    description: "Luxury bags collection",
    viewerCount: 542,
    isLive: true,
  },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TRENDING_NOW = [
  { id: '1', image: require("../../assets/images/fashion.jpg"), title: "Summer fit check", views: "12.3K", seller: "Brenda Style" },
  { id: '2', image: require("../../assets/images/beauty.jpg"), title: "Glow up routine", views: "8.7K", seller: "GlowUp" },
  { id: '3', image: require("../../assets/images/bags.jpg"), title: "Bag haul unboxing", views: "6.1K", seller: "LuxBags" },
  { id: '4', image: require("../../assets/images/jewelry.jpg"), title: "Jewelry collection", views: "5.4K", seller: "Shine Co." },
  { id: '5', image: require("../../assets/images/clothes.jpg"), title: "Thrift finds of the week", views: "9.2K", seller: "ThriftQueen" },
];

const RECOMMENDED = [
  { id: '1', type: 'product' as const, image: require("../../assets/images/shoe2.jpg"), name: "Running Sneakers", price: "18,500 XAF", originalPrice: "22,000 XAF", rating: 4.7 },
  { id: '2', type: 'video' as const, image: require("../../assets/images/outdoor.jpg"), name: "Outdoor style tips", views: "3.8K", seller: "FashionQueen" },
  { id: '3', type: 'product' as const, image: require("../../assets/images/bags.jpg"), name: "Leather Tote Bag", price: "25,000 XAF", originalPrice: "30,000 XAF", rating: 4.5 },
  { id: '4', type: 'product' as const, image: require("../../assets/images/accessories.jpg"), name: "Fashion Sunglasses", price: "6,500 XAF", originalPrice: "9,000 XAF", rating: 4.2 },
  { id: '5', type: 'video' as const, image: require("../../assets/images/beauty.jpg"), name: "My beauty routine", views: "7.1K", seller: "GlowUp" },
  { id: '6', type: 'product' as const, image: require("../../assets/images/clothes.jpg"), name: "Casual Summer Dress", price: "12,000 XAF", originalPrice: "15,000 XAF", rating: 4.3 },
];

export default function LiveScreen() {
  const router = useRouter();
  const { isAuthenticated, isReady } = useAuth();
  const { profile } = useUserProfile();
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("New");
  const [searchQuery, setSearchQuery] = useState("");
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search handler
  const handleSearchChange = useCallback((text: string) => {
    const sanitized = text.replace(/[<>\"']/g, '');
    setSearchQuery(sanitized);

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer for debouncing (300ms delay)
    debounceTimerRef.current = setTimeout(() => {
      // TODO: Implement actual search logic here
      console.log("Searching for:", sanitized);
    }, 300);
  }, []);
   
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

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleNotificationPress = useCallback(() => {
    try {
      router.push(ROUTES.NOTIFICATIONS);
    } catch (error) {
      console.error("Navigation error:", error);
    }
  }, [router]);

  const handleCategoryChange = useCallback((category: CategoryFilter) => {
    setActiveCategory(category);
    // TODO: Filter posts based on category
  }, []);

  // Filter posts based on active category (when category filtering is implemented)
  const filteredPosts = useMemo(() => {
    // For now, return all posts. In production, filter based on category
    if (activeCategory === "New") {
      return MOCK_LIVE_POSTS;
    }
    // TODO: Implement category-based filtering when post categories are added
    return MOCK_LIVE_POSTS;
  }, [activeCategory]);

  if (!isReady) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <View style={styles.centeredLoading}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return (
      <GuestSignInPlaceholder subtitle="Sign in to access live content, create listings, and go live." />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header Section */}
      <View style={[styles.headerOverlay, styles.headerSection]}>
        <View style={styles.headerRow}>
          {/* Search Bar */}
          <View style={styles.searchBarContainer}>
            <Ionicons name="search" size={26} color="#000000" />
            <TextInput
              placeholder="Search Safick..."
              placeholderTextColor="rgba(0, 0, 0, 0.62)"
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={handleSearchChange}
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Search Safick"
              accessibilityRole="search"
            />
          </View>

          {/* Action Icons */}
          <View style={styles.iconContainer}>
            <TouchableOpacity
              accessibilityLabel="Filters"
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="tune-variant" size={24} color="black" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleNotificationPress}
              accessibilityLabel="Notifications"
              accessibilityRole="button"
            >
              <Ionicons name="notifications-outline" size={30} color="#000000" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Live Posts Grid header: banner + filters (scrolls with content) */}
      <LivePostsGrid
        posts={filteredPosts}
        postsPerRow={2}
        ListHeaderComponent={
          <>
            {/* Ready to Share Banner */}
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

            <CategoryFilters
              categories={CATEGORIES}
              activeCategory={activeCategory}
              onCategoryChange={handleCategoryChange}
              showsHorizontalScrollIndicator={false}
            />

            {/* Live Now header */}
            <View style={styles.liveNowHeader}>
              <Text style={styles.liveNowTitle}>Live Now</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
          </>
        }
        ListFooterComponent={
          <>
            {/* Trending Now Section */}
            <View style={styles.trendingSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Trending Now</Text>
                <TouchableOpacity>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.trendingScroll}
              >
                {TRENDING_NOW.map((item) => (
                  <TouchableOpacity key={item.id} style={styles.trendingCard} activeOpacity={0.8}>
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
                    <Text style={styles.trendingTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.trendingSeller}>{item.seller}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Recommended Section */}
            <View style={styles.recommendedSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recommended</Text>
                <TouchableOpacity>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.recommendedGrid}>
                {RECOMMENDED.map((item) => (
                  <TouchableOpacity key={item.id} style={styles.recommendedCard} activeOpacity={0.8}>
                    <View style={[
                      styles.recommendedImageContainer,
                      item.type === 'video' && styles.recommendedVideoImageContainer,
                    ]}>
                      <Image source={item.image} style={styles.recommendedImage} resizeMode="cover" />
                      {item.type === 'video' && (
                        <>
                          <View style={styles.recommendedPlayBtn}>
                            <Ionicons name="play" size={22} color="#FFFFFF" />
                          </View>
                          <View style={styles.recommendedVideoTag}>
                            <Ionicons name="videocam" size={10} color="#FFFFFF" />
                            <Text style={styles.recommendedVideoTagText}>{item.views}</Text>
                          </View>
                        </>
                      )}
                    </View>
                    <View style={styles.recommendedInfo}>
                      <View style={styles.recommendedInfoContent}>
                        <Text style={styles.recommendedName} numberOfLines={1}>{item.name}</Text>
                        {item.type === 'product' ? (
                          <>
                            <View style={styles.recommendedPriceRow}>
                              <Text style={styles.recommendedPrice}>{item.price}</Text>
                              <Text style={styles.recommendedOriginalPrice}>{item.originalPrice}</Text>
                            </View>
                            <View style={styles.recommendedRatingRow}>
                              <Ionicons name="star" size={12} color="#FFD700" />
                              <Text style={styles.recommendedRating}>{item.rating}</Text>
                            </View>
                          </>
                        ) : (
                          <View style={styles.recommendedSellerRow}>
                            <Ionicons name="person-circle-outline" size={14} color="#9CA3AF" />
                            <Text style={styles.recommendedSellerName}>{item.seller}</Text>
                          </View>
                        )}
                      </View>
                      <TouchableOpacity style={styles.recommendedLikeBtn}>
                        <Ionicons name="heart-outline" size={18} color="#FF2800" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
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
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginLeft: 'auto',
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
    gap: 12,
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
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    padding: 6,
    includeFontPadding: false,
    textAlignVertical: 'center',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginTop: 20,
    marginBottom: 4,
  },
  liveNowTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  seeAllText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF2800',
  },
  // Shared section styles
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  // Trending Now
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
  // Recommended
  recommendedSection: {
    marginTop: 28,
    paddingHorizontal: 12,
  },
  recommendedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  recommendedCard: {
    width: (SCREEN_WIDTH - 36) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  recommendedImageContainer: {
    width: '100%',
    height: 170,
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  recommendedVideoImageContainer: {
    height: 210,
  },
  recommendedImage: {
    width: '100%',
    height: '100%',
  },
  recommendedPlayBtn: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -18 }, { translateY: -18 }],
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 2,
  },
  recommendedVideoTag: {
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
  recommendedVideoTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  recommendedInfo: {
    padding: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  recommendedInfoContent: {
    flex: 1,
  },
  recommendedName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  recommendedPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  recommendedPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
  },
  recommendedOriginalPrice: {
    fontSize: 11,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  recommendedRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recommendedRating: {
    fontSize: 12,
    color: '#6B7280',
  },
  recommendedSellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recommendedSellerName: {
    fontSize: 12,
    color: '#6B7280',
  },
  recommendedLikeBtn: {
    padding: 4,
  },
});
