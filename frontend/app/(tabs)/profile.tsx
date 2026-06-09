import { Text, View, StyleSheet, TouchableOpacity, ScrollView, Image, Share, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons, FontAwesome6, MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback } from "react";
import { useUserProfile } from "../../context/UserProfileContext";
import { ReadyToShareBannerDecoration } from "../../components/shared/ReadyToShareBannerDecoration";
import { GuestSignInPlaceholder } from "../../components/auth/GuestSignInPlaceholder";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import type { TranslationKey } from "../../i18n/types";

// Route constants for security
const ROUTES = {
  USER_TAB: "/userTab",
  CREATE_NEW: "/createnew",
  GO_LIVE: "/golive",
  SELLER_ONBOARDING: "/screens/readytoshare/sellersonboardingscreen",
  SELLER_ANALYTICS: "/seller-analytics",
} as const;

export default function ProfileScreen() {
  const { t } = useLanguage();
  const { isAuthenticated, isReady: authReady, signOut, profile: authProfile, profileLoading } = useAuth();
  const router = useRouter();
  const { clearProfile, profile, isLoaded: profileLoaded } = useUserProfile();

  // Prefer the canonical Supabase row, fall back to the local AsyncStorage
  // copy populated during onboarding (handles the brief window before the
  // profile row finishes loading after sign-in).
  const displayName =
    authProfile?.display_name ||
    authProfile?.full_name ||
    profile.displayName ||
    t("profile_your_profile");
  const handle =
    authProfile?.username ||
    profile.username ||
    "";
  const avatarUrl = authProfile?.avatar_url || null;
  
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
      router.push(ROUTES.CREATE_NEW);
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
        message: t("profile_share_message"),
      });
    } catch {
      // Dismissed or failed
    }
  }, [t]);

  const handleSignOut = useCallback(async () => {
    await clearProfile();
    await signOut();
    router.replace("/auth/signin");
  }, [router, clearProfile, signOut]);

  const handleSellerHubPress = useCallback(() => {
    router.push(ROUTES.SELLER_ANALYTICS as any);
  }, []);

  const handleCardPress = useCallback(
    (card: { id: number; shareProfile?: boolean }) => {
      if (card.shareProfile) {
        void handleShareProfile();
        return;
      }
      if (card.id === 7) {
        router.push("/wishlist");
        return;
      }
      if (card.id === 8) {
        router.push("/language");
        return;
      }
    },
    [handleShareProfile, router]
  );

  const actionCards: {
    id: number;
    icon: string;
    labelKey: TranslationKey;
    section: "account" | "shopping" | "support" | "legal";
    badge: string | null;
    shareProfile?: boolean;
    iconLibrary?: "MaterialCommunityIcons";
  }[] = [
    { id: 1, icon: "pulse-outline", labelKey: "profile_account_health", section: "account", badge: null },
    { id: 3, icon: "notifications-outline", labelKey: "profile_notifications", section: "account", badge: null },
    { id: 4, icon: "mail-outline", labelKey: "profile_change_email", section: "account", badge: null },
    { id: 5, icon: "check-decagram-outline", labelKey: "profile_verified_seller", section: "account", badge: null, iconLibrary: "MaterialCommunityIcons" },
    { id: 6, icon: "share-outline", labelKey: "profile_share", section: "account", badge: null, shareProfile: true },
    { id: 7, icon: "heart-outline", labelKey: "profile_wishlist", section: "shopping", badge: null },
    { id: 8, icon: "language-outline", labelKey: "profile_language", section: "shopping", badge: null },
    { id: 9, icon: "card-outline", labelKey: "profile_payment", section: "shopping", badge: null },
    { id: 10, icon: "location-outline", labelKey: "profile_addresses", section: "shopping", badge: null },
    { id: 11, icon: "mail-outline", labelKey: "profile_contact", section: "support", badge: null },
    { id: 12, icon: "flag-outline", labelKey: "profile_user_report", section: "support", badge: null },
    { id: 13, icon: "shield-checkmark-outline", labelKey: "profile_privacy", section: "legal", badge: null },
    { id: 14, icon: "document-text-outline", labelKey: "profile_terms", section: "legal", badge: null },
    { id: 15, icon: "help-circle-outline", labelKey: "profile_help", section: "support", badge: null },
  ];

  const sectionTitleKeys: Record<string, TranslationKey> = {
    account: "profile_section_account",
    shopping: "profile_section_shopping",
    support: "profile_section_support",
    legal: "profile_section_legal",
  };

  if (!authReady || !profileLoaded) {
    return (
      <SafeAreaView style={[styles.container, styles.centeredLoading]} edges={["top", "left", "right"]}>
        <ActivityIndicator size="large" color="#FF2800" />
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return (
      <GuestSignInPlaceholder subtitle={t("guest_profile_subtitle")} />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <View style={styles.profilePictureContainer}>
            <View style={styles.profilePicture}>
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  style={styles.profilePictureImage}
                  resizeMode="cover"
                  accessibilityLabel={t("a11y_profile_picture")}
                />
              ) : profileLoading ? (
                <ActivityIndicator size="small" color="#FF2800" />
              ) : (
                <Ionicons name="person" size={30} color="#000000" />
              )}
            </View>
          </View>
          <View style={styles.userInfoContainer}>
            <View style={styles.usernameContainer}>
              <Text style={styles.username} numberOfLines={1}>
                {handle ? `@${handle}` : displayName}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#000000" />
            </View>
            <TouchableOpacity 
              style={styles.viewProfileButton}
              onPress={handleProfilePress}
              accessibilityLabel={t("profile_view_profile")}
              accessibilityRole="button"
            >
              <Text style={styles.viewProfileText}>{t("profile_view_profile")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Content — banner inside scroll so it moves off-screen when scrolling down */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {profile.readyToShareMode !== "buyer" ? (
          <View style={styles.bannerContainer}>
            <ReadyToShareBannerDecoration variant="dark" />
            <Text style={styles.bannerTitle}>{t("profile_ready_title")}</Text>
            <Text style={styles.bannerSubtitle}>
              {t("profile_ready_subtitle")}
            </Text>
            <View style={styles.bannerButtons}>
              <TouchableOpacity
                style={styles.createNewButton}
                activeOpacity={0.8}
                onPress={handleCreateNew}
                accessibilityRole="button"
                accessibilityLabel={t("profile_create_new")}
              >
                <Ionicons name="add-circle-outline" size={20} color="#000000" />
                <Text style={styles.createNewText}>{t("profile_create_new")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.goLiveButton}
                activeOpacity={0.8}
                onPress={handleGoLive}
                accessibilityRole="button"
                accessibilityLabel={t("profile_go_live")}
              >
                <MaterialCommunityIcons name="television-classic" size={18} color="#FFFFFF" />
                <Text style={styles.goLiveText}>{t("profile_go_live")}</Text>
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
            accessibilityLabel={t("profile_seller_hub")}
          >
            <View style={styles.sellerHubTopRow}>
              <View>
                <Text style={styles.sellerHubTitle}>{t("profile_seller_hub")}</Text>
                <Text style={styles.sellerHubSubtitle}>{t("profile_seller_hub_sub")}</Text>
              </View>
              <View style={styles.sellerHubIconWrap}>
                <MaterialCommunityIcons name="chart-line" size={22} color="#FF2800" />
              </View>
            </View>

            <View style={styles.kpiRow}>
              <View style={styles.kpiItem}>
                <Text style={styles.kpiValue}>2.4K</Text>
                <Text style={styles.kpiLabel}>{t("profile_views")}</Text>
              </View>
              <View style={styles.kpiItem}>
                <Text style={styles.kpiValue}>128</Text>
                <Text style={styles.kpiLabel}>{t("profile_leads")}</Text>
              </View>
              <View style={styles.kpiItem}>
                <Text style={styles.kpiValue}>6.7%</Text>
                <Text style={styles.kpiLabel}>{t("profile_conversion")}</Text>
              </View>
              <View style={styles.kpiItem}>
                <Text style={styles.kpiValue}>24</Text>
                <Text style={styles.kpiLabel}>{t("profile_sold")}</Text>
              </View>
            </View>

            <View style={styles.sellerHubFooter}>
              <Text style={styles.sellerHubFooterText}>{t("profile_view_analytics")}</Text>
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
                <Text style={styles.sectionHeader}>{t(sectionTitleKeys[card.section])}</Text>
              )}
              {showDivider && <View style={styles.sectionDivider} />}
              <TouchableOpacity 
                style={styles.cardItem}
                activeOpacity={0.2}
                onPress={() => handleCardPress(card)}
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
                  <Text style={styles.cardText}>{t(card.labelKey)}</Text>
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
              <Text style={styles.signOutText}>{t("profile_sign_out")}</Text>
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
  profilePictureImage: {
    width: '100%',
    height: '100%',
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
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
