import { Text, View, StyleSheet, TouchableOpacity, TextInput, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";

// Route constants for security
const ROUTES = {
  CAMERA: "/camera",
  NOTIFICATIONS: "/notifications",
} as const;

export default function CategoriesScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("All");

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
      router.push(ROUTES.NOTIFICATIONS);
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
          </View>

          {/* Action Icon */}
          <View style={styles.iconcontainer}>
            <TouchableOpacity
              onPress={handleHeartPress}
              accessibilityLabel="Heart"
              accessibilityRole="button"
            >
              <Ionicons name="notifications-outline" size={30} color="#000000" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Filter Containers */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
        style={styles.filtersScrollView}
      >
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeTab === "All" && styles.filterButtonActive,
          ]}
          onPress={() => setActiveTab("All")}
        >
          <Text
            style={[
              styles.filterText,
              activeTab === "All" && styles.filterTextActive,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeTab === "Shoes" && styles.filterButtonActive,
          ]}
          onPress={() => setActiveTab("Shoes")}
        >
          <Text 
          style={[
            styles.filterText,
            activeTab === "Shoes" && styles.filterTextActive,
          ]}> 
            Shoes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeTab === "Women" && styles.filterButtonActive,
          ]}
          onPress={() => setActiveTab("Women")}
        >
          <Text 
          style={[
            styles.filterText,
            activeTab === "Women" && styles.filterTextActive,
          ]}>
            Women

          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeTab === "Men" && styles.filterButtonActive,
          ]}
          onPress={() => setActiveTab("Men")}
        >
          <Text 
          style={[
            styles.filterText,
            activeTab === "Men" && styles.filterTextActive,
          ]}>
            Men
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeTab === "Kids" && styles.filterButtonActive,
          ]}
          onPress={() => setActiveTab("Kids")}
        >
          <Text style={[styles.filterText, activeTab === "Kids" && styles.filterTextActive]}>Kids</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeTab === "Accessories" && styles.filterButtonActive,
          ]}
          onPress={() => setActiveTab("Accessories")}
        >
          <Text style={[styles.filterText, activeTab === "Accessories" && styles.filterTextActive]}>Accessories</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeTab === "Beauty" && styles.filterButtonActive,
          ]}
          onPress={() => setActiveTab("Beauty")}
        >
          <Text style={[styles.filterText, activeTab === "Beauty" && styles.filterTextActive]}>Beauty</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeTab === "Home" && styles.filterButtonActive,
          ]}
          onPress={() => setActiveTab("Home")}
        >
          <Text style={[styles.filterText, activeTab === "Home" && styles.filterTextActive]}>Home</Text>
        </TouchableOpacity>
      </ScrollView>
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
  filtersScrollView: {
    maxHeight: 60,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 15,
    alignItems: 'center',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  filterButtonActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
