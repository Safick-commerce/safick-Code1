import { Ionicons } from "@expo/vector-icons";
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView, Image } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Category circles data - add your images here
// To add images: 
// 1. Download images from Unsplash, Pexels, or Pixabay
// 2. Save them to: safick/assets/images/
// 3. Update the image path below (e.g., 'fashion.png', 'beauty.png')
const CATEGORY_CIRCLES = [
  { id: 1, name: 'Fashion', image: require('../../assets/images/fashion.jpg') }, // ✅ Has image
  { id: 2, name: 'Shoes', image: require('../../assets/images/shoe2.jpg') }, // ⚠️ Change to: fashion.png
  { id: 3, name: 'Electronics', image: require('../../assets/images/electronics.jpg') }, // ⚠️ Change to: electronics.png
  { id: 4, name: 'Beauty', image: require('../../assets/images/beauty.jpg') }, // ⚠️ Change to: beauty.png
  { id: 5, name: 'Home', image: require('../../assets/images/home.jpg') }, // ⚠️ Change to: home.png
  { id: 6, name: 'Sports', image: require('../../assets/images/sports.jpg') }, // ⚠️ Change to: sports.png
  { id: 7, name: 'Toys', image: require('../../assets/images/toys.jpg') }, // ⚠️ Change to: toys.png
  { id: 8, name: 'Books', image: require('../../assets/images/gadgets.jpg') }, // ⚠️ Change to: books.png
  { id: 9, name: 'Gadgets', image: require('../../assets/images/accessories.jpg') }, // ⚠️ Change to: gadgets.png
  { id: 10, name: 'Accessories', image: require('../../assets/images/tools.jpg') }, // ⚠️ Change to: accessories.png
  // Add more categories here:
  // { id: 11, name: 'Jewelry', image: require('../../assets/images/jewelry.png') },
  // { id: 12, name: 'Watches', image: require('../../assets/images/watches.png') },
] as const;

// Popular cards: use full width (one gap between two cards), responsive height
const CONTENT_PADDING = 1;
const CARD_GAP = 6;
const CARD_WIDTH = (SCREEN_WIDTH - CONTENT_PADDING * 2 - CARD_GAP) / 2;
const IMAGE_HEIGHT = Math.round(SCREEN_HEIGHT * 0.36);

const POPULAR_PRODUCTS = [
  {
    id: 1, seller: 'Tracy', name: 'Elite Series Smartwatch - Silver Edition',
    price: '25,000 XAF', rating: 4.8, location: 'Douala',
    image: require('../../assets/images/seller3.jpeg'),
    sellerAvatar: require('../../assets/images/seller.png'),
  },
  {
    id: 2, seller: 'Emily Shop', name: 'SpeedRunner Pro X - Limited Red',
    price: '42,500 XAF', rating: 5.0, location: 'Douala',
    image: require('../../assets/images/seller4.jpeg'),
    sellerAvatar: require('../../assets/images/seller2.png'),
  },
  {
    id: 3, seller: 'Brenda Style', name: 'Acoustic Pro Bass Headphones',
    price: '18,000 XAF', rating: 4.9, location: 'Yaoundé',
    image: require('../../assets/images/seller.png'),
    sellerAvatar: require('../../assets/images/seller3.jpeg'),
  },
  {
    id: 4, seller: 'Luxury Hub', name: 'Glow Essence Skincare Ritual',
    price: '12,500 XAF', rating: 4.7, location: 'Buea',
    image: require('../../assets/images/seller4.jpeg'),
    sellerAvatar: require('../../assets/images/seller04.jpeg'),
  },
  {
    id: 5, seller: 'TechWorld', name: 'Stealth Walkers - All Black Edition',
    price: '35,000 XAF', rating: 4.8, location: 'Douala',
    image: require('../../assets/images/seller2.png'),
    sellerAvatar: require('../../assets/images/seller.png'),
  },
  {
    id: 6, seller: 'NatureCo', name: 'Master Shot Lens 50mm f/1.8',
    price: '85,000 XAF', rating: 5.0, location: 'Bamenda',
    image: require('../../assets/images/seller2.png'),
    sellerAvatar: require('../../assets/images/seller3.jpeg'),
  },
  {
    id: 7, seller: 'FitGear', name: 'Wireless Charging Pad Pro',
    price: '8,500 XAF', rating: 4.5, location: 'Limbe',
    image: require('../../assets/images/seller2.png'),
    sellerAvatar: require('../../assets/images/seller2.png'),
  },
  {
    id: 8, seller: 'StyleVault', name: 'Premium Leather Crossbody Bag',
    price: '22,000 XAF', rating: 4.6, location: 'Douala',
    image: require('../../assets/images/seller2.png'),
    sellerAvatar: require('../../assets/images/seller04.jpeg'),
  },
];

// Split products into rows of 2 for the grid layout
const POPULAR_ROWS: (typeof POPULAR_PRODUCTS[number])[][] = [];
for (let i = 0; i < POPULAR_PRODUCTS.length; i += 2) {
  POPULAR_ROWS.push(POPULAR_PRODUCTS.slice(i, i + 2));
}


export default function DiscoverTab() {
  

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        scrollEventThrottle={16}
      >
        {/* Category circles — scrolls away naturally like Instagram stories */}
        <View style={styles.topContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.circleScrollContainer}
          >
            {CATEGORY_CIRCLES.map((category) => (
              <View key={category.id} style={styles.circleContainer}>
                <TouchableOpacity style={styles.circle}>
                  <Image
                    source={category.image}
                    style={styles.circleImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
                <Text style={styles.circleText}>{category.name}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Popular Now header */}
        
          <View style={styles.titleRow}>
            <View style={styles.titleContainer}>
              <Text style={styles.popularText}>Popular Now</Text>
              <Text style={styles.recommendedSubText}>Recommended For You</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.contentText}>
                See All
              </Text>
            </TouchableOpacity>
          </View>

        {/* Product cards grid — 2 per row */}
        {POPULAR_ROWS.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.downContainer}>
            <View style={styles.triangleScrollContainer}>
              {row.map((card, index) => (
                <View key={card.id} style={[styles.triangleContainer, index === 1 && styles.triangleContainerLast]}>
                  <View style={styles.triangle}>
                    <Image source={card.image} style={styles.triangleImage} resizeMode="cover" />
                    <View style={styles.ratingBadge}>
                      <Ionicons name="star" size={12} color="#ffa500" />
                      <Text style={styles.ratingText}>{card.rating}</Text>
                    </View>
                    <View style={styles.sellerRow}>
                      <View style={styles.avatarContainer}>
                        <Image source={card.sellerAvatar} style={styles.avatarImage} resizeMode="cover" />
                      </View>
                      <Text style={styles.sellerName} numberOfLines={1}>{card.seller}</Text>
                    </View>
                  </View>
                  <Text style={styles.productName} numberOfLines={2}>{card.name}</Text>
                  <Text style={styles.productPrice}>{card.price}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: 'stretch',
    backgroundColor: '#ffffff',
  },
  contentText: {
    color: '#ff2800',
    marginTop: 8,
    fontSize: 18,
    fontWeight: 'semibold',
    fontFamily: 'Inter',
  },
  popularText: {
    color: '#000000',
    marginTop: 8,
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  scrollContent: {
    paddingHorizontal: CONTENT_PADDING,
    paddingTop: 10,
    paddingBottom: 32,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginTop: 20,
    marginBottom: 4,
  },
  topContainer: {
    marginBottom: 16,
  },
  circleScrollContainer: {
    paddingHorizontal: 5,
    alignItems: 'center',
  },
  circleContainer: {
    marginHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#E5E7EB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleImage: {
    width: '100%',
    height: '100%',
  },
  triangleScrollContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  triangleContainer: {
    width: CARD_WIDTH,
    marginRight: CARD_GAP,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  triangleContainerLast: {
    marginRight: 0,
  },
  sellerRow: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  sellerName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    maxWidth: CARD_WIDTH * 0.45,
  },
  triangle: {
    width: CARD_WIDTH,
    height: IMAGE_HEIGHT,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  triangleImage: {
    width: '100%',
    height: '100%',
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 3,
    gap: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  avatarContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  productName: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    paddingHorizontal: 2,
    maxWidth: CARD_WIDTH,
    fontFamily: 'Inter',
  },
  productPrice: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '700',
    color: '#FF2800',
    paddingHorizontal: 2,
    fontFamily: 'Inter',
  },
  titleContainer: {
    flexDirection: 'column',
  },
  recommendedSubText: {
    color: '#666666',
    marginTop: 4,
    fontSize: 14,
    fontWeight: 'normal',
    fontFamily: 'Inter',
  },
  downContainer: {
    width: '100%',
    marginTop: 20,
  },
  circleText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    textAlign: 'center',
    alignSelf: 'flex-start',
    width: '100%',
  },
});

