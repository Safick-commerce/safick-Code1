import { View, Text, StyleSheet, Dimensions, Image, ImageBackground, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import ProductCard from "../shared/ProductCard";
import VideoSideIcons from "../shared/VideoSideIcons";
import { FEED_PRODUCTS } from "../../data/feedProducts";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Route constants for security
const ROUTES = {
  PRODUCT_DETAILS: "/productDetails",
  USER_PROFILE: "/userprofile",
} as const;

export default function ForYouTab() {
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(false);

  const handleProductDetailsPress = useCallback(() => {
    try {
      router.push(ROUTES.PRODUCT_DETAILS);
    } catch (error) {
      console.error("Navigation error:", error);
    }
  }, [router]);

  const handleUserProfilePress = useCallback(() => {
    try {
      router.push(ROUTES.USER_PROFILE);
    } catch (error) {
      console.error("Navigation error:", error);
    }
  }, [router]);

  return (
    <ImageBackground 
      source={require('../../assets/images/seller4.jpeg')}
      style={styles.container}
      resizeMode="cover"
    >
      {/* Profile header: avatar + username in one container */}
      <View style={styles.profileHeaderContainer}>
        <TouchableOpacity style={styles.profileCircleContainer} onPress={handleUserProfilePress}>
          <View style={styles.profileCircle}>
            <Image
              source={require('../../assets/images/seller4.jpeg')}
              style={styles.profileCircleImage}
              resizeMode="cover"
            />
          </View>
        </TouchableOpacity>
        <View style={styles.usernameContainer}>
          <Text style={styles.username}>Brenda Style</Text>
        </View>
        <TouchableOpacity 
          style={styles.followButton} 
          onPress={() => setIsFollowing(!isFollowing)}
        >
          <Text style={[styles.followButtonText, isFollowing && styles.followButtonTextActive]}>
            {isFollowing ? "Following" : "Follow"}
          </Text>
        </TouchableOpacity>
      </View>

      <ProductCard
        product={FEED_PRODUCTS.workoutSet}
        onPress={handleProductDetailsPress}
        containerStyle={styles.productCardPosition}
      />

      {/* User Info and Product Description */}
      <View style={styles.userInfoContainer}>
        <Text style={styles.productDescription}>
          This is a pink up and down everything perfect for summer vibe. 
          #fashion #ootd
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
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productCardPosition: {
    bottom: 60,
  },
  userInfoContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 80, // Leave space for right icons
    paddingRight: 16,
  },
  profileHeaderContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  usernameContainer: {
    flexShrink: 0,
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginBottom: 4,
  },
  followButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    paddingHorizontal: 20,
    paddingVertical: 5,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    top: 0,
    left: 0,
    right: 0,
  },
  followButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  followButtonTextActive: {
    color: '#000000',
  },
  productDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    lineHeight: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  profileCircleContainer: {},
  profileCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  profileCircleImage: {
    width: '100%',
    height: '100%',
  },
});

