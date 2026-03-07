import { Text, View, StyleSheet, TouchableOpacity, TextInput, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState, useCallback } from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

// Route constants for security
const ROUTES = {
  CAMERA: "/camera",
  WISHLIST: "/wishlist",
} as const;

// Category data for Shop by Category section
const CATEGORIES = [
  { id: 1, name: 'Shoes', image: require('../../assets/images/shoe2.jpg') },
  { id: 2, name: 'Tools', image: require('../../assets/images/tools.jpg') },
  { id: 3, name: 'Electronics', image: require('../../assets/images/electronics.jpg') },
  { id: 4, name: 'Beauty', image: require('../../assets/images/beauty.jpg') },
  { id: 5, name: 'Home', image: require('../../assets/images/home.jpg') },
  { id: 6, name: 'Sports', image: require('../../assets/images/sports.jpg') },
  { id: 7, name: 'Toys', image: require('../../assets/images/toys.jpg') },
  { id: 8, name: 'Gadgets', image: require('../../assets/images/gadgets.jpg') },
  { id: 9, name: 'Accessories', image: require('../../assets/images/accessories.jpg') },
  { id: 10, name: 'Hardware', image: require('../../assets/images/tools.jpg') },
  { id: 11, name: 'Equipment', image: require('../../assets/images/equipments.jpg') },
  { id: 12, name: 'Furniture', image: require('../../assets/images/furniture.jpg') },
  { id: 13, name: 'Baby', image: require('../../assets/images/baby.jpg') },
  { id: 14, name: 'Bags', image: require('../../assets/images/bags.jpg')},
  { id: 15, name: 'Clothes', image: require('../../assets/images/clothes.jpg')},
  { id: 16, name: 'Jewelry', image: require('../../assets/images/jewelry.jpg')},
  { id: 17, name: 'Office Supplies', image: require('../../assets/images/office.jpg')},
  { id: 18, name: 'Outdoor', image: require('../../assets/images/outdoor.jpg')},
] as const;

// Featured categories data
const FEATURED_CATEGORIES = [
  { id: 1, name: 'Beauty & Health' },
  { id: 2, name: 'Shoes' },
  { id: 3, name: 'Women shoes' },
  { id: 4, name: 'Appliance' },
  { id: 5, name: 'Bags & Luggages' },
  { id: 6, name: 'Clothes & Fashion' },
  { id: 7, name: 'Electronics & Gadgets' },
  { id: 8, name: 'Home & Kitchen' },
  { id: 9, name: 'Sports & Outdoors' },
  { id: 10, name: 'Toys & Games' },
  { id: 11, name: 'Office & school Supplies' },
  { id: 12, name: 'Electrical & Tools' },
  { id: 13, name: 'Electronics & Gadgets' },
  { id: 14, name: 'Furniture & Home Decor' },
  { id: 15, name: 'Men' },
  { id: 16, name: 'Kids Fashion' },
  { id: 17, name: 'Baby & Maternity' },
  { id: 18, name: 'Furniture' },
] as const;

export default function CategoriesScreen() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);

  const handleSearchChange = useCallback((text: string) => {
    const sanitized = text.replace(/[<>\"']/g, '');
    setSearchQuery(sanitized);
  }, []);

  const handleCategoryPress = useCallback((categoryId: number) => {
    setActiveCategoryId(categoryId);
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
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header Section */}
      <View style={[styles.headerOverlay, styles.headerSection]}>
        {/* Search Bar with Action Icons */}
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
      <View style={styles.titleContainer}>
        
        {/* Title Row */}
        <View style={styles.titleRow}>
          <Text style={styles.titleText}>
            Featured
          </Text>
          <Text style={[styles.titleText, styles.shopByCategoryText]}>
            Shop by Category
          </Text>
        </View>
      </View>

      {/* Containers Row Below titleContainer */}
      <View style={styles.containersRow}>
        {/* Featured Container */}
        <View style={styles.newContainer}>
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {FEATURED_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                onPress={() => handleCategoryPress(category.id)}
                style={styles.categoryItemContainer}
              >
                {/* Active tab indicator on the left */}
                {activeCategoryId === category.id && (
                  <View style={styles.activeTab} />
                )}
                <Text style={styles.categoryItem}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Shop by Category Container */}
        <View style={styles.shopByCategoryContainer}>
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Render categories in rows of 3 */}
            {Array.from({ length: Math.ceil(CATEGORIES.length / 3) }).map((_, rowIndex) => (
              <View key={rowIndex} style={styles.circleRow}>
                {CATEGORIES.slice(rowIndex * 3, rowIndex * 3 + 3).map((category) => (
                  <View key={category.id} style={styles.circle}>
                    <TouchableOpacity 
                      style={styles.circleTouchable}
                      accessibilityLabel={category.name}
                      accessibilityRole="button"
                    >
                      <View style={styles.circleInner}>
                        <Image 
                          source={category.image}
                          style={styles.circleImage}
                          resizeMode="cover"
                        />
                      </View>
                    </TouchableOpacity>
                    <Text style={styles.categoryItem2}>{category.name}</Text>
                  </View>
                ))}
                {/* Fill empty spaces if last row has less than 3 items */}
                {CATEGORIES.slice(rowIndex * 3, rowIndex * 3 + 3).length < 3 && 
                  Array.from({ length: 3 - CATEGORIES.slice(rowIndex * 3, rowIndex * 3 + 3).length }).map((_, i) => (
                    <View key={`empty-${i}`} style={styles.circle} />
                  ))
                }
              </View>
            ))}
          </ScrollView>
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
    paddingTop: 2,
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
  titleContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleText: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Arial',
    color: '#000000',
  },
  shopByCategoryText: {
    marginRight: 100, // Shift to the left
  },
  containersRow: {
    flexDirection: 'row',
    flex: 1,
    gap: 12,
    paddingRight: 16, // Only right padding
    paddingLeft: 0, // No left padding
  },
  newContainer: {
    width: '30%', // Featured container width
    minHeight: 1000, // Increased vertical size
    paddingHorizontal: 16,
    paddingTop: 7,
    paddingBottom: 200,
    marginLeft: 0, // No left margin
    backgroundColor: '#F3F3F3', // Grey color
  },
  shopByCategoryContainer: {
    flex: 1, // Takes remaining space
    width: '100%', // Shop by Category container width
    minHeight: 1000, // Increased vertical size
    paddingHorizontal: 10,
    paddingTop: 7,
    paddingBottom: 200,
    backgroundColor: '#ffffff ', // Grey color
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // More space at the bottom for scrolling
  },
  categoryItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
    paddingLeft: 10, // Space for the active tab
  },
  activeTab: {
    position: 'absolute',
    left: 0, // Position on the left edge
    width: 3,
    height: '80%', // Slightly shorter than full height
    backgroundColor: '#FF2800', // primary-600
    borderRadius: 2,
    alignSelf: 'center',
  },
  categoryItem: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Inter',
    color: '#000000',
    flex: 1,
  },
  circleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
    gap: 16,
  },
  circle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleTouchable: {
    width: '100%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleInner: {
    width: '85%',
    aspectRatio: 1,
    borderRadius: 9999,
    backgroundColor: '#ffffff',
    borderWidth: 0.3,
    borderColor: '#000000',
    overflow: 'hidden',
  },
  circleImage: {
    width: '100%',
    height: '100%',
  },
  categoryItem2: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Inter',
    color: '#000000',
    flex: 1,
    textAlign: 'center',
    marginTop: 0,
  },
});
