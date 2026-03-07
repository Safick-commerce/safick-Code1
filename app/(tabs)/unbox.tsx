import { View, Text, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import CategoryFilters from "../../components/live/CategoryFilters";
import LivePostsGrid from "../../components/live/LivePostsGrid";
import { CategoryFilter, LivePost } from "../../types";

// Route constants for security
const ROUTES = {
  NOTIFICATIONS: "/notifications",
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

export default function LiveScreen() {
  const router = useRouter();
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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header Section */}
      <View style={[styles.headerOverlay, styles.headerSection]}>
        <View style={styles.headerRow}>
          {/* Search Bar */}
          <View style={styles.searchBarContainer}>
            <Ionicons name="search" size={26} color="#000000" />
            <TextInput
              placeholder="Search wispaCart..."
              placeholderTextColor="rgba(0, 0, 0, 0.62)"
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={handleSearchChange}
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Search wispaCart"
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

      {/* Live Posts Grid with Category Filters + Ready to Share banner as header */}
      <LivePostsGrid
        posts={filteredPosts}
        postsPerRow={2}
        ListHeaderComponent={
          <>
            <CategoryFilters
              categories={CATEGORIES}
              activeCategory={activeCategory}
              onCategoryChange={handleCategoryChange}
            />

            {/* Ready to Share Banner */}
            <View style={styles.bannerContainer}>
              <Text style={styles.bannerTitle}>Ready to share?</Text>
              <Text style={styles.bannerSubtitle}>Start a stream or upload new products</Text>
              <View style={styles.bannerButtons}>
                <TouchableOpacity style={styles.createNewButton} activeOpacity={0.8}>
                  <Ionicons name="add-circle-outline" size={20} color="#000000" />
                  <Text style={styles.createNewText}>Create New</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.goLiveButton} activeOpacity={0.8}>
                  <MaterialCommunityIcons name="television-classic" size={18} color="#FFFFFF" />
                  <Text style={styles.goLiveText}>Go Live</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Live Now header */}
            <View style={styles.liveNowHeader}>
              <Text style={styles.liveNowTitle}>Live Now</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
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
    gap: 8,
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
    gap: 8,
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
});
