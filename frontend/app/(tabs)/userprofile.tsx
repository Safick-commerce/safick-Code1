import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ImageBackground } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons, MaterialIcons, AntDesign, FontAwesome6 } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import { useMessage } from "../../context/MessageContext";

// Route constants for security
const ROUTES = {
  USER_MESSAGE: "/sellermessage",
} as const;

const BIO_SHORT = "Our brand blends street culture, creativity, and self-expression into every drop.";
const BIO_FULL = "Our brand blends street culture, creativity, and self-expression into every drop. Designed for those who move differently, think bigger, and wear their confidence out loud.";
const JOIN_DATE = "Joined March 2022";
const LOCATION = "Douala, Cameroon";

const TRUST_METRICS = {
  productSatisfaction: 94,
  replyTime: "10 min",
  onTimeDelivery: 96,
} as const;

export default function UserProfile() {
  const router = useRouter();
  const { addToMessage } = useMessage();
  const [activeTab, setActiveTab] = useState<"Clips" | "Shop" | "Reviews">("Clips");
  const [isFollowing, setIsFollowing] = useState(false);
  const [bioExpanded, setBioExpanded] = useState(false);

  const handleBackPress = () => router.back();

  const handleUserMessagePress = useCallback(() => {
    try {
      addToMessage({
        id: 'brenda-style-1',
        seller: {
          name: 'Brenda Style',
          message: 'Tap to start chatting',
          avatar: require("../../assets/images/seller4.jpeg"),
          status: 'online',
        },
      });
      router.push(ROUTES.USER_MESSAGE);
    } catch (error) {
      console.error("Navigation error:", error);
    }
  }, [router, addToMessage]);

  const bioText = bioExpanded ? BIO_FULL : BIO_SHORT;
  const showMoreVisible = BIO_FULL.length > BIO_SHORT.length;

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header with textured-style background */}
        <View style={styles.headerWrapper}>
          <ImageBackground
            source={require("../../assets/images/userbackground.jpg")}
            style={styles.headerBackground}
            resizeMode="cover"
          />
          <View style={styles.headerOverlay} />

          {/* Top bar: back, share, menu */}
          <View style={styles.topRow}>
            <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
              <MaterialIcons name="keyboard-arrow-left" size={36} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.rightActions}>
              <TouchableOpacity style={styles.iconButton}>
                <FontAwesome6 name="arrow-up-from-bracket" size={22} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="ellipsis-horizontal" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Profile: avatar, name, handle, then Follower + Message buttons close below */}
          <View style={styles.profileSection}>
            <View style={styles.profilePictureContainer}>
              <View style={styles.profilePicture}>
                <Image
                  source={require("../../assets/images/seller4.jpeg")}
                  style={styles.profilePictureImage}
                  resizeMode="cover"
                />
              </View>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.username}>BrendaStyle</Text>
              <Text style={styles.joinDate}>{JOIN_DATE}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={16} color="rgba(255, 255, 255, 0.9)" />
                <Text style={styles.locationText}>{LOCATION}</Text>
              </View>
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                  style={[styles.followButton, isFollowing && styles.followButtonActive]}
                  onPress={() => setIsFollowing(!isFollowing)}
                >
                  <Ionicons name="person-add" size={18} color="#FFFFFF" />
                  <Text style={[styles.followButtonText, isFollowing && styles.followButtonTextActive]}>
                    {isFollowing ? "Following" : "Follow"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.messageButton} 
                onPress={handleUserMessagePress}>
                  <AntDesign name="message" size={18} color="#FFFFFF" />
                  <Text style={styles.messageButtonText}>Message</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Trust metrics */}
          <View style={styles.trustContainer}>
            <View style={styles.trustItem}>
              <Text style={styles.trustPercent}>{TRUST_METRICS.productSatisfaction}%</Text>
              <Text style={styles.trustLabel}>Product{"\n"}Satisfaction</Text>
            </View>
            <View style={styles.trustDivider} />
            <View style={styles.trustItem}>
              <Text style={styles.trustPercent}>{TRUST_METRICS.replyTime}</Text>
              <Text style={styles.trustLabel}>Response{"\n"}Time</Text>
            </View>
            <View style={styles.trustDivider} />
            <View style={styles.trustItem}>
              <Text style={styles.trustPercent}>{TRUST_METRICS.onTimeDelivery}%</Text>
              <Text style={styles.trustLabel}>On-Time{"\n"}Delivery</Text>
            </View>
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>42</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>1K</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>340</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>

        {/* Bio with Show more */}
        <View style={styles.bioSection}>
          <Text style={styles.bioText}>{bioText}</Text>
          {showMoreVisible && (
            <TouchableOpacity onPress={() => setBioExpanded(!bioExpanded)}>
              <Text style={styles.showMoreText}>{bioExpanded ? "Show less" : "Show more"}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs: Clips, Shop, Reviews */}
        <View style={styles.tabsContainer}>
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tab, activeTab === "Clips" && styles.tabActive]}
              onPress={() => setActiveTab("Clips")}
            >
              <Text style={[styles.tabText, activeTab === "Clips" && styles.tabTextActive]}>Clips</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "Shop" && styles.tabActive]}
              onPress={() => setActiveTab("Shop")}
            >
              <Text style={[styles.tabText, activeTab === "Shop" && styles.tabTextActive]}>Shop</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "Reviews" && styles.tabActive]}
              onPress={() => setActiveTab("Reviews")}
            >
              <Text style={[styles.tabText, activeTab === "Reviews" && styles.tabTextActive]}>Reviews</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Main content area - white */}
        <View style={styles.content}>
          <Text style={styles.contentPlaceholder}>Content for {activeTab} will appear here</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scroll: {
    flex: 1,
  },
  headerWrapper: {
    position: "relative",
    minHeight: 220,
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 10,
  },
  headerBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 220,
  },
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 220,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    zIndex: 1,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    zIndex: 2,
    top: -40,
    
  },
  backButton: {
    padding: 8,
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    padding: 6,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 16,
    zIndex: 2,
  },
  profilePictureContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  profilePicture: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E5E7EB",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  profilePictureImage: {
    width: "100%",
    height: "100%",
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  username: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  userHandle: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 6,
  },
  joinDate: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  locationText: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.9)",
  },
  actionButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginTop: 2,
  },
  followButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF2800",
    paddingHorizontal: 30,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  followButtonActive: {
    backgroundColor: "#333333",
  },
  followButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  followButtonTextActive: {
    color: "#FFFFFF",
  },
  messageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 30,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  messageButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  trustContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 18,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
    zIndex: 2,
  },
  trustItem: {
    flex: 1,
    alignItems: "center",
  },
  trustPercent: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  trustLabel: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.85)",
    textAlign: "center",
    lineHeight: 15,
  },
  trustDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(255, 255, 255, 0.35)",
    marginHorizontal: 8,
  },
  statsSection: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  statItem: {
    alignItems: "center",
    gap: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000000",
  },
  statLabel: {
    fontSize: 14,
    color: "#666666",
  },
  bioSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
  },
  bioText: {
    fontSize: 14,
    color: "#333333",
    lineHeight: 22,
    marginBottom: 4,
  },
  showMoreText: {
    fontSize: 14,
    color: "#999999",
    marginTop: 2,
  },
  tabsContainer: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  tabsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 28,
  },
  tab: {
    paddingBottom: 10,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: "#000000",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#666666",
  },
  tabTextActive: {
    color: "#000000",
    fontWeight: "600",
  },
  content: {
    minHeight: 400,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  contentPlaceholder: {
    color: "#999999",
    fontSize: 15,
    fontWeight: "500",
  },
});
