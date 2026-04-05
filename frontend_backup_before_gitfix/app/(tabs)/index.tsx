import { Text, View, TextInput, TouchableOpacity, StyleSheet, ScrollView, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, AntDesign, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "expo-router";
import DiscoverTab from "../../components/tabs/DiscoverTab";
import ForYouTab from "../../components/tabs/ForYouTab";
import FollowingTab from "../../components/tabs/FollowingTab";

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TABS = ["Discover", "For you", "Following"] as const;

// Route constants for security
const ROUTES = {
  SAVED: "/wishlist",
  MESSAGES: "/messages",
  NOTIFICATIONS: "/notifications",
} as const;

export default function Index() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("For you");
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Navigation handlers with error handling
  const handleSavedPress = useCallback(() => {
    try {
      router.push(ROUTES.SAVED);
    } catch (error) {
      console.error("Navigation error:", error);
      // Could show user-friendly error message
    }
  }, [router]);

  const handleMessagePress = useCallback(() => {
    try {
      router.push(ROUTES.MESSAGES);
    } catch (error) {
      console.error("Navigation error:", error);
    }
  }, [router]);

  const handleNotificationPress = useCallback(() => {
    try {
      router.push(ROUTES.NOTIFICATIONS);
    } catch (error) {
      console.error("Navigation error:", error);
    }
  }, [router]);

  // Handle tab press and scroll to the selected tab
  const handleTabPress = useCallback((tab: (typeof TABS)[number]) => {
    const index = TABS.indexOf(tab);
    if (index === -1) {
      console.warn("Invalid tab:", tab);
      return;
    }
    setActiveTab(tab);
    // Scroll to the selected tab
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: index * SCREEN_WIDTH,
        animated: true,
      });
    }
  }, []);

  // Handle scroll and update active tab with proper typing
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / SCREEN_WIDTH);
    
    // Bounds checking to prevent array index out of bounds
    if (index >= 0 && index < TABS.length) {
      setActiveTab(TABS[index]);
    }
  }, []);

  const handleDiscoverSellersPress = useCallback(() => {
    handleTabPress("Discover");
  }, [handleTabPress]);

  // Input validation for search
  const [searchQuery, setSearchQuery] = useState("");
  const handleSearchChange = useCallback((text: string) => {
    // Basic sanitization - remove potentially dangerous characters
    const sanitized = text.replace(/[<>\"']/g, '');
    setSearchQuery(sanitized);
    // TODO: Add debouncing and actual search logic
  }, []);

  // Initialize scroll position to "For you" tab (index 1)
  useEffect(() => {
    const initialIndex = TABS.indexOf("For you");
    if (initialIndex === -1) return;

    // Use InteractionManager or onLayout instead of setTimeout
    const timer = setTimeout(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({
          x: initialIndex * SCREEN_WIDTH,
          animated: false,
        });
      }
    }, 100);
    
    timeoutRef.current = timer;

    // Cleanup to prevent memory leaks
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []); // Only run once on mount

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header Section */}
      <View style={[styles.headerOverlay, styles.headerSection]}>
        {/* Search Bar with Action Icons */}
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
          <View style={styles.iconsContainer}>
            {/* Saved / Wishlist Icon */}
            <TouchableOpacity 
              onPress={handleSavedPress}
              accessibilityLabel="Saved items"
              accessibilityRole="button"
            >
              <FontAwesome5 name="heart" size={30} color="#000000" />
            </TouchableOpacity>

            {/* Message Icon */}
            <TouchableOpacity 
              onPress={handleMessagePress}
              accessibilityLabel="Messages"
              accessibilityRole="button"
            >
              <AntDesign name="message" size={30} color="#000000" />
            </TouchableOpacity>

            {/* Notification Icon with Badge */}
            <TouchableOpacity 
              style={styles.notificationContainer}
              onPress={handleNotificationPress}
              accessibilityLabel="Notifications"
              accessibilityRole="button"
            >
              <Ionicons name="notifications-outline" size={30} color="#000000" />
              <View style={styles.badge} accessibilityLabel="Unread notifications" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <View style={styles.tabsRow}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => handleTabPress(tab)}
              style={styles.tabButton}
              accessibilityLabel={`${tab} tab`}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === tab }}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.tabTextActive,
                ]}
              >
                {tab}
              </Text>
              {activeTab === tab && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Swipeable Content Area */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={SCREEN_WIDTH}
        snapToAlignment="center"
      >
        {/* Discover Tab */}
        <DiscoverTab />

        {/* For you Tab */}
        <ForYouTab />

        {/* Following Tab */}
        <FollowingTab onDiscoverPress={handleDiscoverSellersPress} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  headerSection: {
    paddingHorizontal: 6,
    paddingTop: 2,
    paddingBottom: 0,
    backgroundColor: '#ffffff', // Semi-transparent white
  },
  headerOverlay: {
    position: 'relative',
    zIndex: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexDirection: 'row',
    paddingBottom: 0,
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
    borderColor: '#000000', // primary-600
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
    padding: 6, // Remove default padding
    includeFontPadding: false, // Better text alignment on Android
    textAlignVertical: 'center',
  },
  iconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 35,
    marginLeft: 'auto', // Pushes icons to the right
  },
  notificationContainer: {
    position: 'relative',
    marginRight: 18,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 8,
    height: 8,
    backgroundColor: '#EF4444',
    borderRadius: 4,
  },
  tabContainer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#ffffff',
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 34,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  tabTextActive: {
    color: '#FF2800',
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -12,
    width: 32,
    height: 2,
    backgroundColor: '#FF2800',
    borderRadius: 1,
  },
});
