import { View, Text, StyleSheet, Dimensions, Image, ImageBackground, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { EvilIcons } from "@expo/vector-icons";
import ProductCard from "../shared/ProductCard";
import VideoSideIcons from "../shared/VideoSideIcons";
import { ForYouFeedSkeleton } from "../shared/ForYouFeedSkeleton";
import { useAuth } from "../../context/AuthContext";
import { getAllProducts, getProductById, type ProductDetail } from "../../utils/productApi";
import { formatPriceXaf } from "../../utils/searchApi";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const FALLBACK_BG = require("../../assets/images/seller4.jpeg");


const ROUTES = {
  PRODUCT_DETAILS: "/productDetails",
  SIGN_IN: "/auth/signin",
  USER_TAB: "/userTab",
} as const;

function sellerLabel(detail: ProductDetail): string {
  return (
    detail.seller?.display_name?.trim() ||
    detail.seller?.full_name?.trim() ||
    (detail.seller?.username ? `@${detail.seller.username}` : "Seller")
  );
}

export default function ForYouTab() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [feedProduct, setFeedProduct] = useState<ProductDetail | null>(null);
  const [feedLoading, setFeedLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setFeedLoading(true);
      try {
        const products = await getAllProducts();
        const first = products[0];
        if (!first) {
          if (!cancelled) setFeedProduct(null);
          return;
        }
        const detail = await getProductById(first.id);
        if (!cancelled) setFeedProduct(detail);
      } catch {
        if (!cancelled) setFeedProduct(null);
      } finally {
        if (!cancelled) setFeedLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const openProductDetails = useCallback(
    (id: string) => {
      router.push({ pathname: ROUTES.PRODUCT_DETAILS, params: { id } });
    },
    [router],
  );

  const handleBuyPress = useCallback(() => {
    try {
      if (!feedProduct) {
        Alert.alert("No listings yet", "Check back soon or browse search for products.");
        return;
      }
      if (isAuthenticated) {
        openProductDetails(feedProduct.id);
        return;
      }
      router.push({
        pathname: ROUTES.SIGN_IN as any,
        params: { redirectTo: ROUTES.PRODUCT_DETAILS, id: feedProduct.id },
      });
    } catch (error) {
      console.error("Navigation error:", error);
    }
  }, [feedProduct, isAuthenticated, openProductDetails, router]);

  const handleUserProfilePress = useCallback(() => {
    const sellerId = feedProduct?.seller_id ?? feedProduct?.seller?.id;
    if (!sellerId) {
      Alert.alert("Seller profile", "No seller profile is linked to this listing yet.");
      return;
    }
    try {
      router.push({ pathname: ROUTES.USER_TAB, params: { userId: sellerId } });
    } catch (error) {
      console.error("Navigation error:", error);
    }
  }, [feedProduct, router]);

  const heroImage =
    feedProduct?.image_url?.trim()
      ? { uri: feedProduct.image_url.trim() }
      : FALLBACK_BG;

  const sellerAvatar =
    feedProduct?.seller?.avatar_url?.trim()
      ? { uri: feedProduct.seller.avatar_url.trim() }
      : FALLBACK_BG;

  const cardProduct = feedProduct
    ? {
        name: feedProduct.title,
        price: formatPriceXaf(feedProduct.price),
      }
    : { name: "Browse listings", price: "—" };

  const locationLabel = feedProduct?.seller?.city?.trim()
    ? feedProduct.seller.city.trim()
    : "Cameroon";

  if (feedLoading) {
    return <ForYouFeedSkeleton />;
  }

  return (
    <ImageBackground source={heroImage} style={styles.container} resizeMode="cover">
      <View style={styles.profileHeaderContainer}>
        <View style={styles.profileCircleContainer}>
          <View style={styles.profileCircle}>
            <Image source={sellerAvatar} style={styles.profileCircleImage} resizeMode="cover" />
          </View>
        </View>
        <TouchableOpacity
          style={styles.usernameContainer}
          onPress={handleUserProfilePress}
          activeOpacity={0.8}
        >
          <Text style={styles.username}>{feedProduct ? sellerLabel(feedProduct) : "Safick Seller"}</Text>
          <View style={styles.locationRow}>
            <EvilIcons name="location" size={16} color="#FFFFFF" />
            <Text style={styles.locationText}>{locationLabel}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.followButton} onPress={() => setIsFollowing(!isFollowing)}>
          <Text style={[styles.followButtonText, isFollowing && styles.followButtonTextActive]}>
            {isFollowing ? "Following" : "Follow"}
          </Text>
        </TouchableOpacity>
      </View>

      <ProductCard
        product={cardProduct}
        onPress={handleBuyPress}
        containerStyle={styles.productCardPosition}
      />

      <View style={styles.userInfoContainer}>
        <Text style={styles.productDescription}>
          {feedProduct?.description?.trim() ||
            "Discover trusted sellers and shop with people you can follow on Safick."}
        </Text>
      </View>

      <VideoSideIcons />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  productCardPosition: {
    bottom: 60,
  },
  userInfoContainer: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 80,
    paddingRight: 16,
  },
  profileHeaderContainer: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 100,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
  followButton: {
    backgroundColor: "rgba(255, 255, 255, 0.35)",
    paddingHorizontal: 20,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  followButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter",
  },
  followButtonTextActive: {
    color: "#000000",
  },
  productDescription: {
    fontSize: 14,
    fontWeight: "400",
    color: "#FFFFFF",
    fontFamily: "Inter",
    lineHeight: 20,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
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
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  profileCircleImage: {
    width: "100%",
    height: "100%",
  },
});
