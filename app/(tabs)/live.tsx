import { View, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import CategoryFilters from "../../components/live/CategoryFilters";
import LivePostsGrid from "../../components/live/LivePostsGrid";
import { CategoryFilter, LivePost } from "../../types";

// Route constants for security
const ROUTES = {
  NOTIFICATIONS: "/notifications",
} as const;

// Category constants - matches type definition
const CATEGORIES = ["All", "Shoes", "Women", "Men", "Kids", "Accessories", "Beauty", "Home"] as const satisfies readonly CategoryFilter[];

// Mock data - in production, this would come from an API or state management
const MOCK_LIVE_POSTS: LivePost[] = [
  {
    id: "1",
    sellerName: "Tracy",
    imageUrl: require("../../assets/images/seller3.jpeg"),
    description: "Affordable Mufflers for ladys and 100k givaway to the first 100 customers",
  },
  {
    id: "2",
    sellerName: "Emily shop",
    imageUrl: require("../../assets/images/seller4.jpeg"),
    description: "Affordable Mufflers and Gears for men and 100k givaway to the first 100 customers",
  },
  {
    id: "3",
    sellerName: "Tracy",
    imageUrl: require("../../assets/images/seller3.jpeg"),
    description: "Affordable Mufflers for ladys and 100k givaway to the first 100 customers",
  },
  {
    id: "4",
    sellerName: "Emily shop",
    imageUrl: require("../../assets/images/seller4.jpeg"),
    description: "Affordable Mufflers and Gears for men and 100k givaway to the first 100 customers",
  },
];

export default function LiveScreen() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("All");
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
    if (activeCategory === "All") {
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
              placeholder="Search clipCart..."
              placeholderTextColor="rgba(0, 0, 0, 0.62)"
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={handleSearchChange}
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Search clipCart"
              accessibilityRole="search"
            />
          </View>

          {/* Action Icon */}
          <View style={styles.iconContainer}>
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

      {/* Category Filters */}
      <CategoryFilters
        categories={CATEGORIES}
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
      />

      {/* Live Posts Grid */}
      <LivePostsGrid posts={filteredPosts} postsPerRow={2} />
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
});
