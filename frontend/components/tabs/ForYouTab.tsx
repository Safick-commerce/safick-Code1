import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { EvilIcons } from "@expo/vector-icons";
import FeedProductCard from "../shared/FeedProductCard";
import { getAllProducts } from "../../utils/productApi";
import type { StoreProduct } from "../../types/storeProduct";
import { useAuth } from "../../context/AuthContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const ROUTES = {
  PRODUCT_DETAILS: "/(tabs)/productDetails",
  SIGN_IN: "/auth/signin",
  USER_PROFILE: "/userprofile",
} as const;

export default function ForYouTab() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const list = await getAllProducts();
      setProducts(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load products.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void load();
  }, [load]);

  const handleBuyPress = useCallback(() => {
    try {
      if (isAuthenticated) {
        router.push(ROUTES.PRODUCT_DETAILS);
        return;
      }
      router.push({
        pathname: ROUTES.SIGN_IN as any,
        params: { redirectTo: ROUTES.PRODUCT_DETAILS },
      });
    } catch (err) {
      console.error("Navigation error:", err);
    }
  }, [isAuthenticated, router]);

  const handleUserProfilePress = useCallback(() => {
    try {
      router.push(ROUTES.USER_PROFILE);
    } catch (err) {
      console.error("Navigation error:", err);
    }
  }, [router]);

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/seller4.jpeg")}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
      <View style={styles.scrim} />

      <View style={styles.profileHeaderContainer}>
        <View style={styles.profileCircleContainer}>
          <View style={styles.profileCircle}>
            <Image
              source={require("../../assets/images/seller4.jpeg")}
              style={styles.profileCircleImage}
              contentFit="cover"
            />
          </View>
        </View>
        <TouchableOpacity
          style={styles.usernameContainer}
          onPress={handleUserProfilePress}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          <Text style={styles.username}>For you</Text>
          <View style={styles.locationRow}>
            <EvilIcons name="location" size={16} color="#FFFFFF" />
            <Text style={styles.locationText}>Discover listings</Text>
          </View>
        </TouchableOpacity>
      </View>

      {loading && products.length === 0 ? (
        <View style={styles.feedLoading}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      ) : error ? (
        <View style={styles.feedLoading}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No products yet. Sellers can add listings from Profile.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.cardRow}>
              <View style={styles.cardInner}>
                <FeedProductCard product={item} onPress={handleBuyPress} />
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    flex: 1,
    backgroundColor: "#111827",
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  profileHeaderContainer: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    zIndex: 2,
  },
  profileCircleContainer: {},
  profileCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#000000",
    overflow: "hidden",
  },
  profileCircleImage: {
    width: "100%",
    height: "100%",
  },
  usernameContainer: {
    flexShrink: 0,
  },
  username: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    fontFamily: "Inter",
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontFamily: "Inter",
    marginLeft: 2,
  },
  list: {
    flex: 1,
    marginTop: 88,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  feedLoading: {
    flex: 1,
    marginTop: 100,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  cardRow: {
    marginBottom: 16,
  },
  cardInner: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 16,
    padding: 12,
    overflow: "hidden",
  },
  emptyText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 24,
  },
  errorText: {
    color: "#FECACA",
    textAlign: "center",
    fontSize: 14,
  },
});
