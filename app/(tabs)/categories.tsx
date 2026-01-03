import { Text, View, StyleSheet, TouchableOpacity, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState, useCallback } from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

// Route constants for security
const ROUTES = {
  CAMERA: "/camera",
  WISHLIST: "/wishlist",
} as const;

export default function CategoriesScreen() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const handleSearchChange = useCallback((text: string) => {
    const sanitized = text.replace(/[<>\"']/g, '');
    setSearchQuery(sanitized);
  }, []);

  const handleCameraPress = useCallback(() => {
    try {
      router.push(ROUTES.CAMERA as any);
    } catch (error) {
      console.error("Navigation error:", error);
    }
  }, [router]);
  const handleHeartPress = useCallback(() => {
    try {
      router.push(ROUTES.WISHLIST);
    } catch (error) {
      console.error("Navigation error:", error);
    }
  }, [router]);



  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {/* Header Section */}
      <View style={[styles.headerOverlay, styles.headerSection]}>
        {/* Search Bar with Action Icons */}
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
            <TouchableOpacity
              onPress={handleCameraPress}
              accessibilityLabel="Camera"
              accessibilityRole="button"
            >
              <Ionicons name="camera-outline" size={30} color="#000000" />
            </TouchableOpacity>
          </View>

          {/* Action Icon */}
          <View style={styles.iconcontainer}>
            <TouchableOpacity
              onPress={handleHeartPress}
              accessibilityLabel="Heart"
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="heart-box-outline" size={35} color="#000000" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* New Container Below Header */}
      <View style={styles.contentContainer}>
        
        {/* Title Row */}
        <View style={styles.titleRow}>
          <Text style={styles.contentText}>
            Features
          </Text>
          <Text style={styles.contentText}>
            Shop by Category
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  iconcontainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginLeft: 'auto',

  },
  headerSection: {
    paddingHorizontal: 6,
    paddingTop: 55,
    paddingBottom: 0,
    backgroundColor: '#ffffff', // Semi-transparent white
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
    borderColor: '#FF2800', // primary-600
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
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: '#ffffff',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contentText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
});
