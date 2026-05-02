import { FontAwesome6, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { type Href, useRouter } from "expo-router";
import { useCallback } from "react";
import { ActivityIndicator, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GuestSignInPlaceholder } from "../../components/auth/GuestSignInPlaceholder";
import { ReadyToShareBannerDecoration } from "../../components/shared/ReadyToShareBannerDecoration";
import { useAuth } from "../../context/AuthContext";
import { useUserProfile } from "../../context/UserProfileContext";

// Route constants for security
const ROUTES = {
  USER_TAB: "/userTab",
  CREATE_NEW: "/screens/products/create",
  MY_PRODUCTS: "/screens/products/my-products",
  GO_LIVE: "/golive",
  SELLER_ONBOARDING: "/screens/readytoshare/sellersonboardingscreen",
  SELLER_ANALYTICS: "/seller-analytics",
} as const;

export default function ProfileScreen() {
  const {
    isAuthenticated,
    isReady: authReady,
    profileLoading: authProfileLoading,
    refetchProfile,
    signOut,
    user,
    profile: authProfile,
  } = useAuth();
  const router = useRouter();
  const { clearProfile, profile } = useUserProfile();

  const handleProfilePress = useCallback(() => {
    try {
      router.push(ROUTES.USER_TAB);
    } catch (error) {
      console.error("Navigation error:", error);
    }
  }, [router]);

  const handleCreateNew = useCallback(() => {
    try {
      if (!profile.readyToSharePromptSeen) {
        router.push(ROUTES.SELLER_ONBOARDING as any);
        return;
      }
      if (profile.readyToShareMode === "seller" && !profile.readyToShareSellerOnboardingCompleted) {
        router.push({ pathname: ROUTES.SELLER_ONBOARDING as any, params: { skipRolechoice: "1" } });
        return;
      }
      router.push(ROUTES.CREATE_NEW as Href);
    } catch (error) {
      console.error("Navigation error:", error);
    }
  }, [profile.readyToShareMode, profile.readyToSharePromptSeen, profile.readyToShareSellerOnboardingCompleted, router]);

  const handleGoLive = useCallback(() => {
    try {
      if (!profile.readyToSharePromptSeen) {
        router.push(ROUTES.SELLER_ONBOARDING as any);
        return;
      }
      if (profile.readyToShareMode === "seller" && !profile.readyToShareSellerOnboardingCompleted) {
        router.push({ pathname: ROUTES.SELLER_ONBOARDING as any, params: { skipRolechoice: "1" } });
        return;
      }
      router.push(ROUTES.GO_LIVE);
    } catch (error) {
      console.error("Navigation error:", error);
    }
  }, [profile.readyToShareMode, profile.readyToSharePromptSeen, profile.readyToShareSellerOnboardingCompleted, router]);

  const handleShareProfile = useCallback(async () => {
    try {
      await Share.share({
        message: "Check out my profile on SAFICK!",
      });
    } catch {
      // Dismissed or failed
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    await clearProfile();
    await signOut();
    router.replace("/");
  }, [router, clearProfile, signOut]);

  const handleSellerHubPress = useCallback(() => {
    router.push(ROUTES.SELLER_ANALYTICS as any);
  }, [router]);

  const actionCards = [
    // Account Section
    { id: 1, icon: "pulse-outline", label: "Account Health", section: "account", badge: null },
    { id: 2, icon: "settings-outline", label: "Settings", section: "account", badge: null },
    { id: 3, icon: "notifications-outline", label: "Notification", section: "account", badge: 3 },
    { id: 4, icon: "mail-outline", label: "Change Email", section: "account", badge: null },
    { id: 5, icon: "check-decagram-outline", label: "Verified Seller", section: "account", badge: null, iconLibrary: "MaterialCommunityIcons" },
    { id: 16, icon: "storefront-outline", label: "My listings", section: "account", badge: null, myProducts: true },
    { id: 6, icon: "share-outline", label: "Share profile", section: "account", badge: null, shareProfile: true },
    
    // Shopping Section
    { id: 7, icon: "heart-outline", label: "Wishlist", section: "shopping", badge: 5 },
    { id: 8, icon: "language-outline", label: "Language", section: "shopping", badge: null },
    { id: 9, icon: "card-outline", label: "Payment", section: "shopping", badge: null },
    { id: 10, icon: "location-outline", label: "Addresses", section: "shopping", badge: null },
    
    // Support & Legal Section
    { id: 11, icon: "mail-outline", label: "Contact Us", section: "support", badge: null },
    { id: 12, icon: "flag-outline", label: "User Report", section: "support", badge: null },
    { id: 13, icon: "shield-checkmark-outline", label: "Privacy Policy", section: "legal", badge: null },
    { id: 14, icon: "document-text-outline", label: "Terms & Conditions", section: "legal", badge: null },
    { id: 15, icon: "help-circle-outline", label: "Help & Support", section: "support", badge: null },
  ];

  const sectionTitles: Record<string, string> = {
    account: "Account",
    shopping: "Shopping",
    support: "Support",
    legal: "Legal",
  };

  const displayName =
    authProfile?.full_name?.trim() ||
    profile?.displayName?.trim() ||
    (typeof user?.user_metadata?.full_name === "string" ? user.user_metadata.full_name.trim() : "") ||
    user?.email?.split("@")?.[0] ||
    "Account";

  const authUsername = authProfile?.username?.trim();
  const localUsername = profile?.username?.trim();
  const handleLabel =
    authUsername && authUsername.length > 0
      ? `@${authUsername}`
      : localUsername && localUsername.length > 0
        ? `@${localUsername}`
        : user?.email ?? "";

  if (!authReady) {
    return (
      <SafeAreaView style={[styles.container, styles.centeredLoading]} edges={["top", "left", "right"]}>
        <ActivityIndicator size="large" color="#FF2800" />
      </SafeAreaView>
    );
  }

  if (isAuthenticated && authProfileLoading && !authProfile) {
    return (
      <SafeAreaView style={[styles.container, styles.centeredLoading]} edges={["top", "left", "right"]}>
        <ActivityIndicator size="large" color="#FF2800" />
      </SafeAreaView>
    );
  }

  if (isAuthenticated && !authProfileLoading && authProfile === null) {
    return (
      <SafeAreaView style={[styles.container, styles.centeredLoading]} edges={["top", "left", "right"]}>
        <Text style={styles.profileErrorTitle}>Could not load your profile</Text>
        <Text style={styles.profileErrorSub}>Check your connection and try again.</Text>
        <TouchableOpacity
          style={styles.profileRetryButton}
          onPress={() => void refetchProfile()}
          accessibilityRole="button"
          accessibilityLabel="Retry loading profile"
        >
          <Text style={styles.profileRetryText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return (
      <GuestSignInPlaceholder subtitle="Sign in to view your profile, orders, and settings." />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <View style={styles.profilePictureContainer}>
            <View style={styles.profilePicture}>
              <Ionicons name="person" size={30} color="#000000" />
            </View>
          </View>
          <View style={styles.userInfoContainer}>
            <View style={styles.usernameContainer}>
              <View style={styles.nameBlock}>
                <Text style={styles.username}>{displayName}</Text>
                {handleLabel ? (
                  <Text style={styles.handleText}>{handleLabel}</Text>
                ) : null}
              </View>
              <Ionicons name="chevron-down" size={20} color="#000000" />
            </View>
            <TouchableOpacity 
              style={styles.viewProfileButton}
              onPress={handleProfilePress}
              accessibilityLabel="View Profile"
              accessibilityRole="button"
            >
              <Text style={styles.viewProfileText}>View Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Content — banner inside scroll so it moves off-screen when scrolling down */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {profile.readyToShareMode !== "buyer" ? (
          <View style={styles.bannerContainer}>
            <ReadyToShareBannerDecoration variant="dark" />
            <Text style={styles.bannerTitle}>Ready to share?</Text>
            <Text style={styles.bannerSubtitle}>
              Start a stream or upload new products
            </Text>
            <View style={styles.bannerButtons}>
              <TouchableOpacity
                style={styles.createNewButton}
                activeOpacity={0.8}
                onPress={handleCreateNew}
                accessibilityRole="button"
                accessibilityLabel="Create new product"
              >
                <Ionicons name="add-circle-outline" size={20} color="#000000" />
                <Text style={styles.createNewText}>Create New</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.goLiveButton}
                activeOpacity={0.8}
                onPress={handleGoLive}
                accessibilityRole="button"
                accessibilityLabel="Go live"
              >
                <MaterialCommunityIcons name="television-classic" size={18} color="#FFFFFF" />
                <Text style={styles.goLiveText}>Go Live</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
        {/* Seller hub Analytics board*/}
        {profile.readyToShareMode === "seller" ? (
          <TouchableOpacity
            style={styles.sellerHubCard}
            activeOpacity={0.85}
            onPress={handleSellerHubPress}
            accessibilityRole="button"
            accessibilityLabel="Open seller hub analytics"
          >
            <View style={styles.sellerHubTopRow}>
              <View>
                <Text style={styles.sellerHubTitle}>Seller Hub</Text>
                <Text style={styles.sellerHubSubtitle}>Track listing performance and lead conversion.</Text>
              </View>
              <View style={styles.sellerHubIconWrap}>
                <MaterialCommunityIcons name="chart-line" size={22} color="#FF2800" />
              </View>
            </View>

            <View style={styles.kpiRow}>
              <View style={styles.kpiItem}>
                <Text style={styles.kpiValue}>2.4K</Text>
                <Text style={styles.kpiLabel}>Views</Text>
              </View>
              <View style={styles.kpiItem}>
                <Text style={styles.kpiValue}>128</Text>
                <Text style={styles.kpiLabel}>Leads</Text>
              </View>
              <View style={styles.kpiItem}>
                <Text style={styles.kpiValue}>6.7%</Text>
                <Text style={styles.kpiLabel}>Conversion</Text>
              </View>
              <View style={styles.kpiItem}>
                <Text style={styles.kpiValue}>24</Text>
                <Text style={styles.kpiLabel}>Sold</Text>
              </View>
            </View>

            <View style={styles.sellerHubFooter}>
              <Text style={styles.sellerHubFooterText}>View Full Analytics</Text>
              <Ionicons name="arrow-forward" size={16} color="#FF2800" />
            </View>
          </TouchableOpacity>
        ) : null}

        {actionCards.map((card, index) => {
          const previousCard = index > 0 ? actionCards[index - 1] : null;
          const showDivider = previousCard && previousCard.section !== card.section;
          const showSectionHeader = !previousCard || previousCard.section !== card.section;
          
          return (
            <View key={card.id}>
              {showSectionHeader && (
                <Text style={styles.sectionHeader}>{sectionTitles[card.section]}</Text>
              )}
              {showDivider && <View style={styles.sectionDivider} />}
              <TouchableOpacity 
                style={styles.cardItem}
                activeOpacity={0.2}
                onPress={
                  "shareProfile" in card && card.shareProfile
                    ? handleShareProfile
                    : "myProducts" in card && (card as { myProducts?: boolean }).myProducts
                      ? () => router.push(ROUTES.MY_PRODUCTS as Href)
                      : undefined
                }
              >
                <View style={styles.cardLeftSection}>
                  <View style={styles.cardIconContainer}>
                    {card.iconLibrary === "MaterialCommunityIcons" ? (
                      <MaterialCommunityIcons 
                        name={card.icon as any} 
                        size={24} 
                        color="#000000" 
                      />
                    ) : (
                      <Ionicons 
                        name={card.icon as any} 
                        size={24} 
                        color="#000000" 
                      />
                    )}
                  </View>
                  <Text style={styles.cardText}>{card.label}</Text>
                  {card.badge && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{card.badge}</Text>
                    </View>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          );
        })}
        
        {/* Sign Out Container */}
        <View style={styles.signOutSection}>
          <View style={styles.sectionDivider} />
          <TouchableOpacity 
            style={styles.signOutContainer}
            activeOpacity={0.7}
            onPress={handleSignOut}
          >
            <View style={styles.signOutContent}>
              <FontAwesome6 name="arrow-right-from-bracket" size={20} color="#FF2800" />
              <Text style={styles.signOutText}>Sign Out</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  centeredLoading: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  profileErrorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 8,
  },
  profileErrorSub: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 20,
  },
  profileRetryButton: {
    backgroundColor: "#FF2800",
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  profileRetryText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
    borderBottomWidth: 0.3,
    borderBottomColor: '#E5E7EB',
  },
  bannerContainer: {
    marginHorizontal: 0,
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: '#1C1C2E',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  bannerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 16,
  },
  createNewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  createNewText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  goLiveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FF2800',
  },
  goLiveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sellerHubCard: {
    marginTop: 2,
    marginBottom: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    backgroundColor: "#FFFFFF",
    padding: 14,
    gap: 12,
  },
  sellerHubTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sellerHubTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  sellerHubSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: "#6B7280",
  },
  sellerHubIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFF1EE",
    alignItems: "center",
    justifyContent: "center",
  },
  kpiRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  kpiItem: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    paddingVertical: 10,
    alignItems: "center",
  },
  kpiValue: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
  },
  kpiLabel: {
    marginTop: 2,
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  sellerHubFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
  },
  sellerHubFooterText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FF2800",
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  userInfoContainer: {
    flexDirection: 'column',
    gap: 6,
  },
  profilePictureContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePicture: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#E5E7EB',
    borderWidth: 0.2,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  nameBlock: {
    flex: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  handleText: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  viewProfileButton: {
    paddingHorizontal: 20,
    paddingVertical: 6.5,
    borderRadius: 15,
    backgroundColor: '#FF2800',
    alignSelf: 'flex-start',
  },
  viewProfileText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Arial',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  cardLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    flex: 1,
    fontFamily: 'Arial',
  },
  badge: {
    backgroundColor: '#FF2800',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 8,
    marginHorizontal: 4,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
    marginHorizontal: 16,
  },
  signOutSection: {
    marginTop: 4,
  },
  signOutContainer: {
    marginTop: 10,
    backgroundColor: '#FFF5F5',
    borderRadius: 100,
    borderWidth: 0.5,
    borderColor: '#FFE5E5',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  signOutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF2800',
  },
});
