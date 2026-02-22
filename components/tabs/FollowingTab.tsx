import { View, Text, StyleSheet, Dimensions, Image, ImageBackground, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DiscoverTab from "./DiscoverTab";
import { FEED_PRODUCTS } from "../../data/feedProducts";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Route constants for security
const ROUTES = {
  DISCOVER_SELLERS: "/components/tabs/DiscoverTab",
} as const;

export default function ForYouTab() {
  const router = useRouter();

  const handleDiscoverSellersPress = useCallback(() => {
    try {
      // Use the DiscoverTab as a component or the correct registered route
      router.push(ROUTES.DISCOVER_SELLERS as any);
    } catch (error) {
      console.error("Navigation error:", error);
    }
  }, [router]);

  return ( 
    <View style={styles.container}>
       {/* Profile Section */}
       <View style={styles.profileSection}>
                <View style={styles.avatarContainer}>
                    <Image
                        style={styles.avatar}
                        resizeMode="cover"
                    />
                </View>
                <Text style={styles.noPostsYetText}>No posts yet</Text>
                <Text style={styles.noPostsYetSubtext}>Follow sellers in Cameroon to see{'\n'}their atest products and deals{'\n'}here</Text>
                <TouchableOpacity 
                style={styles.discoverSellersButton}
                onPress={handleDiscoverSellersPress}>
                  <MaterialCommunityIcons name="apple-safari" size={30} color="#ffffff" />
                    <Text style={styles.discoverSellersButtonText}>Discover Sellers</Text>
                </TouchableOpacity>
            </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 16,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 40,
    alignSelf: 'center',
    backgroundColor: '#E2E8F0',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  noPostsYetText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#0F172A',
    fontFamily: 'Inter',
    alignSelf: 'center',
  },
  noPostsYetSubtext: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  discoverSellersButton: {
    backgroundColor: '#FF2800',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  discoverSellersButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});