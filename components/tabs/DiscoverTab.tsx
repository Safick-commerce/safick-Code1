import { Ionicons } from "@expo/vector-icons";
import { useRef } from "react";
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView, Image, Animated } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Category circles data - add your images here
// To add images: 
// 1. Download images from Unsplash, Pexels, or Pixabay
// 2. Save them to: clipCart/assets/images/
// 3. Update the image path below (e.g., 'fashion.png', 'beauty.png')
const CATEGORY_CIRCLES = [
  { id: 1, name: 'Shoes', image: require('../../assets/images/fashion.jpg') }, // ✅ Has image
  { id: 2, name: 'Fashion', image: require('../../assets/images/shoe2.jpg') }, // ⚠️ Change to: fashion.png
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

const POPULAR_ROW_1 = [
  { id: 1, seller: 'Tracy', description: 'Summer edit — New arrivals', image: require('../../assets/images/seller3.jpeg') },
  { id: 2, seller: 'Emily shop', description: 'Minimal style — Best picks', image: require('../../assets/images/seller4.jpeg') },
];
const POPULAR_ROW_2 = [
  { id: 3, seller: 'Seller 3', description: 'Streetwear drop', image: require('../../assets/images/seller.png') },
  { id: 4, seller: 'Seller 4', description: 'Trending now', image: require('../../assets/images/seller4.jpeg') },
];
const POPULAR_ROW_3 = [
  { id: 5, seller: 'Seller 5', description: 'Fresh collection', image: require('../../assets/images/seller2.png') },
  { id: 6, seller: 'Seller 6', description: 'Limited pieces', image: require('../../assets/images/seller2.png') },
];
const POPULAR_ROW_4 = [
  { id: 7, seller: 'Seller 7', description: 'Back in stock', image: require('../../assets/images/seller2.png') },
  { id: 8, seller: 'Seller 8', description: 'Just listed', image: require('../../assets/images/seller2.png') },
];

// Top section height (circles + label + margin). Used so scroll-driven animation collapses smoothly.
const TOP_SECTION_HEIGHT = 120;
const SCROLL_RANGE = 200; // over this many px of scroll, top section fully hides

export default function DiscoverTab() {
  const scrollY = useRef(new Animated.Value(0)).current;

  const topSectionHeight = scrollY.interpolate({
    inputRange: [0, SCROLL_RANGE],
    outputRange: [TOP_SECTION_HEIGHT, 0],
    extrapolate: 'clamp',
  });
  const topSectionOpacity = scrollY.interpolate({
    inputRange: [0, SCROLL_RANGE * 0.9],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        {/* Top section: smoothly collapses and fades as user scrolls (no threshold, no jump) */}
        <Animated.View style={[styles.topSectionWrapper, { height: topSectionHeight }]}>
          <Animated.View style={[styles.topContainer, { opacity: topSectionOpacity }]}>
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
          </Animated.View>
        </Animated.View>
        
      <Animated.ScrollView 
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Popular Now Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.titleRow}>
            <View style={styles.titleContainer}>
              <Text style={styles.popularText}>
                Popular Now
              </Text>
              {/* Recommended For You - Subtext of Popular Now */}
              <Text style={styles.recommendedSubText}>
                Recommended For You
              </Text>
            </View>
            <TouchableOpacity>
            <Text style={styles.contentText}>
              See All
              <Ionicons name="arrow-forward-outline" size={24} color="black" />
            </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Popular cards — seller name at head (outside container), then image, then description */}
        <View style={styles.downContainer}>
          <View style={styles.triangleScrollContainer}>
            {POPULAR_ROW_1.map((card, index) => (
              <View key={card.id} style={[styles.triangleContainer, index === 1 && styles.triangleContainerLast]}>
                <Text style={styles.sellerName}>{card.seller}</Text>
                <View style={styles.triangle}>
                  <Image source={card.image} style={styles.triangleImage} resizeMode="cover" />
                </View>
                <Text style={styles.cardDescription} numberOfLines={2}>{card.description}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.downContainer}>
          <View style={styles.triangleScrollContainer}>
            {POPULAR_ROW_2.map((card, index) => (
              <View key={card.id} style={[styles.triangleContainer, index === 1 && styles.triangleContainerLast]}>
                <Text style={styles.sellerName}>{card.seller}</Text>
                <View style={styles.triangle}>
                  <Image source={card.image} style={styles.triangleImage} resizeMode="cover" />
                </View>
                <Text style={styles.cardDescription} numberOfLines={2}>{card.description}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.middleContainer}>
          <View style={styles.triangleScrollContainer}>
            {POPULAR_ROW_3.map((card, index) => (
              <View key={card.id} style={[styles.triangleContainer, index === 1 && styles.triangleContainerLast]}>
                <Text style={styles.sellerName}>{card.seller}</Text>
                <View style={styles.triangle}>
                  <Image source={card.image} style={styles.triangleImage} resizeMode="cover" />
                </View>
                <Text style={styles.cardDescription} numberOfLines={2}>{card.description}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.downContainer}>
          <View style={styles.triangleScrollContainer}>
            {POPULAR_ROW_4.map((card, index) => (
              <View key={card.id} style={[styles.triangleContainer, index === 1 && styles.triangleContainerLast]}>
                <Text style={styles.sellerName}>{card.seller}</Text>
                <View style={styles.triangle}>
                  <Image source={card.image} style={styles.triangleImage} resizeMode="cover" />
                </View>
                <Text style={styles.cardDescription} numberOfLines={2}>{card.description}</Text>
              </View>
            ))}
          </View>
        </View>
      </Animated.ScrollView>
      </View>
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
    color: '#000000',
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
    flexGrow: 1,
    paddingTop: 10,
    paddingBottom: 32,
  },
  contentContainer: {
    width: '100%',
    position: 'relative',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: CONTENT_PADDING,
    paddingTop: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 190,
  },
  topSectionWrapper: {
    width: '100%',
    overflow: 'hidden',
  },
  topContainer: {
    marginBottom: 20,
    width: '100%',
    overflow: 'hidden',
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
    borderColor: '#000000',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleImage: {
    width: '100%',
    height: '100%',
  },
  sectionContainer: {
    marginBottom: 20,
  },
  middleContainer: {
    width: '100%',
    marginTop: 20,
  },
  triangleScrollContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  sellerName: {
    marginBottom: 8,
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'left',
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
  cardDescription: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    paddingHorizontal: 2,
    maxWidth: CARD_WIDTH,
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

