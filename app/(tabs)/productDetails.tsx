import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons, MaterialIcons, FontAwesome6, Fontisto, AntDesign } from "@expo/vector-icons";
import { useState, useCallback, useRef } from "react";
import { useWishlist } from "../../context/WishlistContext";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Route constants for security

export default function ProductDetails() {
  const router = useRouter();
  const { toggleWishlist, isSaved } = useWishlist();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const imageScrollViewRef = useRef<ScrollView>(null);

  const handleBackPress = useCallback(() => {
    router.back();
  }, [router]);

  const handleSellerPress = useCallback(() => {
    router.push("/userprofile");
    console.log("Seller Profile pressed");
  }, [router]);

  const handleMessageSeller = useCallback(() => {
    // Navigate to Sellers Message page 
    router.push("/usermessage");
    console.log("Message Seller pressed");
  }, []);

  const handleSaveProduct = useCallback(() => {
    toggleWishlist({
      id: "workout-set-1",
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.images[0],
      sellerName: product.seller.name,
    });
  }, [toggleWishlist]);

  const handleSearchPress = useCallback(() => {
    // Navigate to search or open search modal
    console.log("Search pressed");
    // You can add navigation to search screen here
    // router.push("/search");
  }, []);

  // Derived from context — no local state needed
  const isWishlisted = isSaved("workout-set-1");

  // Handle image carousel scroll
  const handleImageScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / SCREEN_WIDTH);
    setCurrentImageIndex(index);
  }, []);

  // Product data - in production, this would come from route params or state
  const product = {
    name: "Women's workout set",
    price: "15,000 XAF",
    originalPrice: "17,000 XAF",
    description: "This is a pink up and down everything perfect for summer vibe. Made with high-quality materials for comfort and style. Perfect for workouts, casual wear, or lounging. #fashion #ootd #workout",
    seller: {
      name: "Brenda Style",
      handle: "@brendastyle",
      image: require("../../assets/images/seller4.jpeg"),
      rating: 4.8,
      followers: "1K",
    },
    images: [
      require("../../assets/images/seller4.jpeg"),
      require("../../assets/images/seller04.jpeg"),
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "Pink", value: "#FFB6C1" },
      { name: "Black", value: "#000000" },
      { name: "White", value: "#FFFFFF" },
    ],
    rating: 4.5,
    reviews: 24,
    inStock: true,
    stockCount: 15,
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <MaterialIcons name="keyboard-arrow-left" size={32} color="#000000" />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton} onPress={handleSearchPress}>
            <Ionicons name="search" size={24} color="#000000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <FontAwesome6 name="arrow-up-from-bracket" size={24} color="#000000" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Product Images Carousel */}
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
              flexDirection: 'row',
              width: SCREEN_WIDTH * product.images.length,
            }}
            nestedScrollEnabled={true}
          >
            {product.images.map((image, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image 
                  source={image} 
                  style={styles.productImage}
                  resizeMode="cover"
                />
              </View>
            ))}
          </ScrollView>
          {/* Image Indicators */}
          {product.images.length > 1 && (
            <View style={styles.imageIndicators}>
              {product.images.map((_, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.indicator,
                    currentImageIndex === index && styles.indicatorActive
                  ]} 
                />
              ))}
            </View>
          )}
          {/* Image Counter (e.g., "1 / 3") */}
          {product.images.length > 1 && (
            <View style={styles.imageCounter}>
              <Text style={styles.imageCounterText}>
                {currentImageIndex + 1} / {product.images.length}
              </Text>
            </View>
          )}
        </View>

        {/* Product Info Section */}
        <View style={styles.productInfoSection}>
          {/* Product Name and Price */}
          <View style={styles.priceSection}>
            <View style={styles.productNameRow}>
              <Text style={styles.productName}>{product.name}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.productPrice}>{product.price}</Text>
              <Text style={styles.originalPrice}>{product.originalPrice}</Text>
            </View>
            <View style={styles.ratingRow}>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= Math.floor(product.rating) ? "star" : "star-outline"}
                    size={16}
                    color="#FFD700"
                  />
                ))}
              </View>
              <Text style={styles.ratingText}>
                {product.rating} ({product.reviews} reviews)
              </Text>
            </View>
          </View>

          {/* Seller Info */}
          <TouchableOpacity 
            style={styles.sellerSection}
            onPress={handleSellerPress}
            activeOpacity={0.7}
          >
            <Image 
              source={product.seller.image} 
              style={styles.sellerImage}
              resizeMode="cover"
            />
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName}>{product.seller.name}</Text>
              <Text style={styles.sellerHandle}>{product.seller.handle}</Text>
              <View style={styles.sellerStats}>
                <Ionicons name="star" size={14} color="#FFD700" />
                <Text style={styles.sellerRating}>{product.seller.rating}</Text>
                <Text style={styles.sellerFollowers}> • {product.seller.followers} followers</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Size Selection */}
          <View style={styles.optionsSection}>
            <Text style={styles.optionsTitle}>Size</Text>
            <View style={styles.sizeContainer}>
              {product.sizes.map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.sizeButton,
                    selectedSize === size && styles.sizeButtonActive,
                  ]}
                  onPress={() => setSelectedSize(size)}
                >
                  <Text
                    style={[
                      styles.sizeButtonText,
                      selectedSize === size && styles.sizeButtonTextActive,
                    ]}
                  >
                    {size}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Color Selection */}
          <View style={styles.optionsSection}>
            <Text style={styles.optionsTitle}>Color</Text>
            <View style={styles.colorContainer}>
              {product.colors.map((color) => (
                <TouchableOpacity
                  key={color.name}
                  style={[
                    styles.colorButton,
                    selectedColor === color.name && styles.colorButtonActive,
                  ]}
                  onPress={() => setSelectedColor(color.name)}
                >
                  <View
                    style={[
                      styles.colorCircle,
                      { backgroundColor: color.value },
                      color.value === "#FFFFFF" && styles.colorCircleBorder,
                    ]}
                  />
                  {selectedColor === color.name && (
                    <View style={styles.colorCheckmark}>
                      <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Stock Info */}
          <View style={styles.stockSection}>
            <View style={styles.stockRow}>
              <Ionicons 
                name={product.inStock ? "checkmark-circle" : "close-circle"} 
                size={20} 
                color={product.inStock ? "#10B981" : "#EF4444"} 
              />
              <Text style={styles.stockText}>
                {product.inStock 
                  ? `${product.stockCount} items in stock` 
                  : "Out of stock"}
              </Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{product.description}</Text>
          </View>

          {/* Product Details */}
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Product Details</Text>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Material:</Text>
              <Text style={styles.detailValue}>Cotton, Polyester</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Care Instructions:</Text>
              <Text style={styles.detailValue}>Machine wash cold</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Shipping:</Text>
              <Text style={styles.detailValue}>Free shipping within Cameroon</Text>
            </View>
          </View>

          {/* Reviews Section Placeholder */}
          <View style={styles.reviewsSection}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.sectionTitle}>Reviews ({product.reviews})</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.reviewsPlaceholder}>
              Customer reviews will appear here
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={[
            styles.saveButton,
            isWishlisted && styles.saveButtonActive,
          ]}
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
        <TouchableOpacity 
          style={styles.messageButton}
          onPress={handleMessageSeller}
        >
          <Text style={styles.messageButtonText}>Message Seller</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
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
    position: 'relative',
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
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    zIndex: 10,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  indicatorActive: {
    backgroundColor: '#FFFFFF',
    width: 24,
  },
  imageCounter: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 10,
  },
  imageCounterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  productInfoSection: {
    padding: 16,
  },
  priceSection: {
    marginBottom: 20,
  },
  productNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 12,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    fontFamily: 'Inter',
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000000',
    fontFamily: 'Inter',
  },
  originalPrice: {
    fontSize: 16,
    fontWeight: '400',
    color: '#9CA3AF',
    fontFamily: 'Inter',
    textDecorationLine: 'line-through',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  sellerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  sellerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'Inter',
    marginBottom: 2,
  },
  sellerHandle: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter',
    marginBottom: 4,
  },
  sellerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sellerRating: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  sellerFollowers: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  optionsSection: {
    marginBottom: 24,
  },
  optionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'Inter',
    marginBottom: 12,
  },
  sizeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sizeButton: {
    minWidth: 50,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeButtonActive: {
    borderColor: '#FF2800',
    backgroundColor: '#FFF5F5',
  },
  sizeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    fontFamily: 'Inter',
  },
  sizeButtonTextActive: {
    color: '#FF2800',
    fontWeight: '600',
  },
  colorContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  colorButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  colorButtonActive: {
    borderWidth: 2,
    borderColor: '#FF2800',
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  colorCircleBorder: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  colorCheckmark: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF2800',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockSection: {
    marginBottom: 24,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stockText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  descriptionSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'Inter',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#374151',
    fontFamily: 'Inter',
  },
  detailsSection: {
    marginBottom: 24,
  },
  detailItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: 'Inter',
    width: 120,
  },
  detailValue: {
    fontSize: 14,
    color: '#374151',
    fontFamily: 'Inter',
    flex: 1,
  },
  reviewsSection: {
    marginBottom: 24,
  },
  reviewsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF2800',
    fontFamily: 'Inter',
  },
  reviewsPlaceholder: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'Inter',
    fontStyle: 'italic',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 4,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0.5,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 50,
    paddingHorizontal: 24,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: '#FF2800',
    backgroundColor: '#FFFFFF',
  },
  saveButtonActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF2800',
    fontFamily: 'Inter',
  },
  saveButtonTextActive: {
    color: '#FFFFFF',
  },
  messageButton: {
    flex: 1,
    height: 50,
    borderRadius: 28,
    backgroundColor: '#FF2800',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  messageButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
});
