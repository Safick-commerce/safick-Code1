import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Alert,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons, MaterialIcons, FontAwesome6 } from "@expo/vector-icons";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useWishlist } from "../context/WishlistContext";
import { startConversationChat } from "../utils/startConversationChat";
import { getProductById, getRelatedProducts, type ProductDetail } from "../utils/productApi";
import { formatPriceXaf } from "../utils/searchApi";
import type { StoreProduct } from "../types/storeProduct";
import { ProductDetailsSkeleton } from "../components/shared/ProductDetailsSkeleton";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PLACEHOLDER_IMAGE = require("../assets/images/clothes.jpg");

function productImageSource(url: string | null | undefined) {
  const trimmed = url?.trim();
  return trimmed ? { uri: trimmed } : PLACEHOLDER_IMAGE;
}

function sellerDisplayName(detail: ProductDetail): string {
  const seller = detail.seller;
  if (!seller) return "Seller";
  return (
    seller.display_name?.trim() ||
    seller.full_name?.trim() ||
    (seller.username ? `@${seller.username}` : "Seller")
  );
}

function sellerHandle(detail: ProductDetail): string {
  const username = detail.seller?.username?.trim();
  return username ? `@${username}` : "";
}

export default function ProductDetails() {
  const router = useRouter();
  const { id: productId } = useLocalSearchParams<{ id?: string | string[] }>();
  const resolvedProductId = typeof productId === "string" ? productId : productId?.[0];
  const { toggleWishlist, isSaved } = useWishlist();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const imageScrollViewRef = useRef<ScrollView>(null);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(Boolean(resolvedProductId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!resolvedProductId) {
      setProduct(null);
      setRelatedProducts([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [detail, related] = await Promise.all([
          getProductById(resolvedProductId),
          getRelatedProducts(resolvedProductId, 6),
        ]);
        if (cancelled) return;
        if (!detail) {
          setProduct(null);
          setRelatedProducts([]);
          setError("This listing could not be found.");
          return;
        }
        setProduct(detail);
        setRelatedProducts(related);
      } catch (e) {
        if (cancelled) return;
        setProduct(null);
        setRelatedProducts([]);
        setError(e instanceof Error ? e.message : "Could not load product.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [resolvedProductId]);

  useEffect(() => {
    setCurrentImageIndex(0);
    imageScrollViewRef.current?.scrollTo({ x: 0, animated: false });
  }, [resolvedProductId]);

  const productImages = useMemo(
    () => [productImageSource(product?.image_url)],
    [product?.image_url],
  );

  const handleBackPress = useCallback(() => {
    router.back();
  }, [router]);

  const handleSellerPress = useCallback(() => {
    const sellerId = product?.seller_id ?? product?.seller?.id;
    if (sellerId) {
      router.push({ pathname: "/userTab", params: { userId: sellerId } });
      return;
    }
    Alert.alert("Seller profile", "Seller information is not available for this listing.");
  }, [product, router]);

  const handleMessageSeller = useCallback(async () => {
    if (!resolvedProductId) {
      Alert.alert(
        "Message seller",
      );
      return;
    }
    try {
      await startConversationChat(router, resolvedProductId, "product");
    } catch (err) {
      Alert.alert(
        "Could not start chat",
        err instanceof Error ? err.message : "Please try again.",
      );
    }
  }, [resolvedProductId, router]);

  const handleSaveProduct = useCallback(() => {
    if (!product) return;
    toggleWishlist({
      id: product.id,
      name: product.title,
      price: formatPriceXaf(product.price),
      image: productImageSource(product.image_url),
      sellerName: sellerDisplayName(product),
    });
  }, [product, toggleWishlist]);

  const handleSearchPress = useCallback(() => {
    router.push("/search");
  }, [router]);

  const handleRelatedPress = useCallback(
    (id: string) => {
      router.push({ pathname: "/productDetails", params: { id } });
    },
    [router],
  );

  const handleShareProduct = useCallback(() => {
    if (!product) return;
    Share.share({
      message: `Check out this ${product.title} from ${sellerDisplayName(product)} on SAFICK!`,
    });
  }, [product]);

  const isWishlisted = product ? isSaved(product.id) : false;

  const handleImageScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / SCREEN_WIDTH);
    setCurrentImageIndex(index);
  }, []);

  if (loading) {
    return <ProductDetailsSkeleton />;
  }

  if (!resolvedProductId) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]} edges={["top"]}>
        <Text style={styles.stateTitle}>No product selected</Text>
        <Text style={styles.stateText}>
          Open a listing from search or your feed to view details.
        </Text>
        <TouchableOpacity style={styles.stateButton} onPress={handleBackPress}>
          <Text style={styles.stateButtonText}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]} edges={["top"]}>
        <Text style={styles.stateTitle}>Could not load product</Text>
        <Text style={styles.stateText}>{error ?? "Please try again."}</Text>
        <TouchableOpacity style={styles.stateButton} onPress={handleBackPress}>
          <Text style={styles.stateButtonText}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const formattedPrice = formatPriceXaf(product.price);
  const description =
    product.description?.trim() ||
    "The seller has not added a description for this listing yet.";
  const sellerLocation = product.seller?.city?.trim();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <MaterialIcons name="keyboard-arrow-left" size={32} color="#000000" />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton} onPress={handleSearchPress}>
            <Ionicons name="search" size={24} color="#000000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={handleShareProduct}>
            <FontAwesome6 name="arrow-up-from-bracket" size={24} color="#000000" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.imageContainer}>
          <ScrollView
            ref={imageScrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleImageScroll}
            decelerationRate="fast"
            snapToInterval={SCREEN_WIDTH}
            snapToAlignment="start"
            style={styles.imageScrollView}
            contentContainerStyle={{
              flexDirection: "row",
              width: SCREEN_WIDTH * productImages.length,
            }}
            nestedScrollEnabled
          >
            {productImages.map((image, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={image} style={styles.productImage} resizeMode="cover" />
              </View>
            ))}
          </ScrollView>
          {productImages.length > 1 && (
            <View style={styles.imageIndicators}>
              {productImages.map((_, index) => (
                <View
                  key={index}
                  style={[styles.indicator, currentImageIndex === index && styles.indicatorActive]}
                />
              ))}
            </View>
          )}
        </View>

        <View style={styles.productInfoSection}>
          <View style={styles.priceSection}>
            <View style={styles.productNameRow}>
              <Text style={styles.productName}>{product.title}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.productPrice}>{formattedPrice}</Text>
            </View>
          </View>

          <View style={styles.stockSection}>
            <View style={styles.stockRow}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.stockText}>Available on Safick</Text>
            </View>
          </View>

          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{description}</Text>
          </View>

          <View style={styles.sellerAboutSection}>
            <Text style={styles.sectionTitle}>About Seller</Text>
            <View style={styles.sellerCardContainer}>
              <TouchableOpacity
                style={styles.sellerSection}
                onPress={handleSellerPress}
                activeOpacity={0.8}
              >
                <Image
                  source={productImageSource(product.seller?.avatar_url)}
                  style={styles.sellerImage}
                  resizeMode="cover"
                />
                <View style={styles.sellerInfo}>
                  <Text style={styles.sellerName}>{sellerDisplayName(product)}</Text>
                  {sellerHandle(product) ? (
                    <Text style={styles.sellerHandle}>{sellerHandle(product)}</Text>
                  ) : null}
                  {sellerLocation ? (
                    <Text style={styles.sellerFollowers}>{sellerLocation}</Text>
                  ) : null}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>

              <View style={styles.sellerMetricsRow}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>94%</Text>
                  <Text style={styles.metricLabel}>Product{"\n"}Satisfaction</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>10 min</Text>
                  <Text style={styles.metricLabel}>Response{"\n"}Time</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>96%</Text>
                  <Text style={styles.metricLabel}>On-Time{"\n"}Delivery</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.reviewsSection}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.sectionTitle}>Reviews</Text>
            </View>
            <Text style={styles.reviewsPlaceholder}>Customer reviews will appear here</Text>
          </View>

          {relatedProducts.length > 0 ? (
            <View style={styles.recommendedSection}>
              <View style={styles.reviewsHeader}>
                <Text style={styles.sectionTitle}>More listings</Text>
              </View>
              <View style={styles.recommendedGrid}>
                {relatedProducts.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.recommendedCard}
                    activeOpacity={0.8}
                    onPress={() => handleRelatedPress(item.id)}
                  >
                    <Image
                      source={productImageSource(item.image_url)}
                      style={styles.recommendedImage}
                      resizeMode="cover"
                    />
                    <View style={styles.recommendedInfo}>
                      <Text style={styles.recommendedName} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <View style={styles.recommendedPriceRow}>
                        <Text style={styles.recommendedPrice}>{formatPriceXaf(item.price)}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.saveButton, isWishlisted && styles.saveButtonActive]}
          onPress={handleSaveProduct}
        >
          <Ionicons
            name={isWishlisted ? "heart" : "heart-outline"}
            size={20}
            color={isWishlisted ? "#FFFFFF" : "#FF2800"}
          />
          <Text style={[styles.saveButtonText, isWishlisted && styles.saveButtonTextActive]}>
            {isWishlisted ? "Saved" : "Save"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.messageButton} onPress={handleMessageSeller}>
          <Text style={styles.messageButtonText}>Message Seller</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  stateTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 8,
  },
  stateText: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
  },
  stateButton: {
    marginTop: 24,
    backgroundColor: "#FF2800",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  stateButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 4,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  iconButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    position: "relative",
  },
  imageScrollView: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
  },
  imageWrapper: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
  },
  productImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
  },
  imageIndicators: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    zIndex: 10,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  indicatorActive: {
    backgroundColor: "#FFFFFF",
    width: 24,
  },
  productInfoSection: {
    padding: 16,
  },
  priceSection: {
    marginBottom: 20,
  },
  productNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 12,
  },
  productName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
    fontFamily: "Inter",
    flex: 1,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000000",
    fontFamily: "Inter",
  },
  sellerSection: {
    flexDirection: "row",
    alignItems: "center",
    padding: 6,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    marginBottom: 4,
    gap: 8,
  },
  sellerImage: {
    width: 40,
    height: 40,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
    fontFamily: "Inter",
    marginBottom: 1,
  },
  sellerHandle: {
    fontSize: 12,
    color: "#6B7280",
    fontFamily: "Inter",
    marginBottom: 2,
  },
  sellerFollowers: {
    fontSize: 11,
    color: "#6B7280",
    fontFamily: "Inter",
  },
  sellerAboutSection: {
    marginBottom: 18,
  },
  sellerCardContainer: {
    borderWidth: 1,
    borderColor: "#F3F4F6",
    borderRadius: 10,
    padding: 2,
    backgroundColor: "#F3F4F6",
  },
  sellerMetricsRow: {
    flexDirection: "row",
    gap: 0,
    marginTop: 0,
  },
  metricCard: {
    flex: 1,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    backgroundColor: "#F3F4F6",
    paddingVertical: 8,
    alignItems: "center",
  },
  metricValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    fontFamily: "Inter",
  },
  metricLabel: {
    marginTop: 2,
    fontSize: 11,
    color: "#6B7280",
    fontFamily: "Inter",
    textAlign: "center",
    lineHeight: 15,
  },
  stockSection: {
    marginBottom: 24,
  },
  stockRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stockText: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "Inter",
  },
  descriptionSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    fontFamily: "Inter",
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#374151",
    fontFamily: "Inter",
  },
  reviewsSection: {
    marginBottom: 24,
  },
  reviewsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  reviewsPlaceholder: {
    fontSize: 14,
    color: "#9CA3AF",
    fontFamily: "Inter",
    fontStyle: "italic",
  },
  recommendedSection: {
    marginBottom: 16,
  },
  recommendedGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  recommendedCard: {
    width: (SCREEN_WIDTH - 44) / 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  recommendedImage: {
    width: "100%",
    height: 150,
    backgroundColor: "#E5E7EB",
  },
  recommendedInfo: {
    padding: 10,
  },
  recommendedName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
    fontFamily: "Inter",
    marginBottom: 6,
  },
  recommendedPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  recommendedPrice: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "Inter",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    paddingBottom: 42,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 0.5,
    borderTopColor: "#E5E7EB",
    gap: 12,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 50,
    paddingHorizontal: 24,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: "#FF2800",
    backgroundColor: "#FFFFFF",
  },
  saveButtonActive: {
    backgroundColor: "#000000",
    borderColor: "#000000",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF2800",
    fontFamily: "Inter",
  },
  saveButtonTextActive: {
    color: "#FFFFFF",
  },
  messageButton: {
    flex: 1,
    height: 50,
    borderRadius: 28,
    backgroundColor: "#FF2800",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  messageButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: "Inter",
  },
});
