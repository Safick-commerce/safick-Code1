import { Text, View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState, useCallback, useEffect } from "react";
import { Image } from "expo-image";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { useUserProfile } from "../../stores/userProfileStore";
import { CategoriesTabSkeleton } from "../../components/shared/CategoriesTabSkeleton";
import { preloadBundledImages } from "../../utils/preloadBundledImages";

// Route constants for security
const ROUTES = {
  WISHLIST: "/wishlist",
  SEARCH: "/search",
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
  { id: 10, name: 'Hardware', image: require('../../assets/images/hardware.jpg') },
  { id: 11, name: 'Equipment', image: require('../../assets/images/equipments.jpg') },
  { id: 12, name: 'Furniture', image: require('../../assets/images/furniture.jpg') },
  { id: 13, name: 'Baby', image: require('../../assets/images/baby.jpg') },
  { id: 14, name: 'Bags', image: require('../../assets/images/bags.jpg')},
  { id: 15, name: 'Clothes', image: require('../../assets/images/clothes.jpg')},
  { id: 16, name: 'Jewelry', image: require('../../assets/images/jewelry.jpg')},
  { id: 17, name: 'Office Supplies', image: require('../../assets/images/office.jpg')},
  { id: 18, name: 'Outdoor', image: require('../../assets/images/outdoor.jpg')},
] as const;

const UNIQUE_CATEGORY_IMAGES = [...new Set(CATEGORIES.map((c) => c.image))];

export default function CategoriesScreen() {
  const router = useRouter();
  const { isReady: authReady } = useAuth();
  const { isLoaded: profileLoaded } = useUserProfile();

  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const bootstrapReady = authReady && profileLoaded;

  const warmImageCache = useCallback(() => {
    if (!bootstrapReady) return;
    void preloadBundledImages(UNIQUE_CATEGORY_IMAGES);
  }, [bootstrapReady]);

  useEffect(() => {
    warmImageCache();
  }, [warmImageCache]);

  useFocusEffect(
    useCallback(() => {
      warmImageCache();
    }, [warmImageCache]),
  );

  const handleCategoryPress = useCallback((categoryId: number) => {
    setActiveCategoryId(categoryId);
  }, []);

  const handleHeartPress = useCallback(() => {
    try {
      router.push(ROUTES.WISHLIST);
    } catch (error) {
      console.error("Navigation error:", error);
    }
  }, [router]);

  const handleSearchPress = useCallback(() => {
    try {
      router.push(ROUTES.SEARCH);
    } catch (error) {
      console.error("Navigation error:", error);
    }
  }, [router]);

  if (!bootstrapReady) {
    return <CategoriesTabSkeleton />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        {/* Header Section */}
        <View style={[styles.headerOverlay, styles.headerSection]}>
          <View style={styles.headerRow}>
            <View style={styles.searchBarContainer}>
              <TouchableOpacity
                style={styles.searchBarTapArea}
                onPress={handleSearchPress}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Search categories"
              >
                <Ionicons name="search" size={26} color="#000000" />
                <Text style={styles.searchPlaceholder} numberOfLines={1}>
                  Search categories...
                </Text>
              </TouchableOpacity>
            </View>

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

        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            <Text style={[styles.titleText, styles.shopByCategoryText]}>
              Shop by Category
            </Text>
          </View>
        </View>

        <View style={styles.containersRow}>
          <View style={styles.shopByCategoryContainer}>
            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {Array.from({ length: Math.ceil(CATEGORIES.length / 3) }).map((_, rowIndex) => (
                <View key={rowIndex} style={styles.circleRow}>
                  {CATEGORIES.slice(rowIndex * 3, rowIndex * 3 + 3).map((category) => (
                    <View key={category.id} style={styles.circle}>
                      <TouchableOpacity
                        style={styles.circleTouchable}
                        onPress={() => handleCategoryPress(category.id)}
                        activeOpacity={0.88}
                        accessibilityLabel={category.name}
                        accessibilityRole="button"
                        accessibilityState={{ selected: activeCategoryId === category.id }}
                      >
                        <View
                          style={[
                            styles.circleInner,
                            activeCategoryId === category.id && styles.circleInnerSelected,
                          ]}
                        >
                          <Image
                            source={category.image}
                            style={styles.circleImage}
                            contentFit="cover"
                            cachePolicy="memory-disk"
                            transition={120}
                            recyclingKey={`category-${category.id}`}
                          />
                        </View>
                        <Text style={styles.categoryItem2}>{category.name}</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                  {CATEGORIES.slice(rowIndex * 3, rowIndex * 3 + 3).length < 3 &&
                    Array.from({ length: 3 - CATEGORIES.slice(rowIndex * 3, rowIndex * 3 + 3).length }).map((_, i) => (
                      <View key={`empty-${i}`} style={styles.circle} />
                    ))}
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
  searchBarTapArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
  },
  searchPlaceholder: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    paddingVertical: 6,
    color: "rgba(0, 0, 0, 0.62)",
    includeFontPadding: false,
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
    marginRight: 100,
  },
  containersRow: {
    flexDirection: 'row',
    flex: 1,
    minHeight: 0,
    gap: 12,
    paddingRight: 16,
    paddingLeft: 0,
  },
  shopByCategoryContainer: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    paddingHorizontal: 10,
    paddingTop: 7,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
    flexGrow: 1,
  },
  circleInnerSelected: {
    borderWidth: 2,
    borderColor: '#FF2800',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleInner: {
    width: '85%',
    aspectRatio: 1,
    borderRadius: 9999,
    backgroundColor: '#E5E7EB',
    borderWidth: 0.3,
    borderColor: '#E5E7EB',
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
    marginTop: 10,
    marginBottom: 10,
  },
});
