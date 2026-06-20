import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Share,
  ActivityIndicator,
  Modal,
  Pressable,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons, MaterialIcons, FontAwesome6 } from "@expo/vector-icons";
import { useState, useCallback, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { useUserProfile } from "../../stores/userProfileStore";
import { fetchProfileById, type ProfileRow } from "../../utils/fetchProfile";
import { getSellerVideoProducts } from "../../utils/productApi";
import { fetchSellerProductViewCounts } from "../../utils/forYouFeed";
import { ProfileVideoGrid } from "../../components/profile/ProfileVideoGrid";
import type { StoreProduct } from "../../types/storeProduct";
import { ReportUserModal } from "../../components/shared/ReportUserModal";
import { PROFILE_REPORT_REASONS } from "../../constants/reportReasons";
import type { ComponentProps } from "react";

const ROUTES = {
  EDIT_PROFILE: "/edit_profile",
} as const;

const PRIVATE_TABS = ["Posts", "Shop", "Reviews", "Collections", "Likes"] as const;
const PUBLIC_TABS = ["Clips", "Shop", "Reviews"] as const;

type PrivateTab = (typeof PRIVATE_TABS)[number];
type PublicTab = (typeof PUBLIC_TABS)[number];
type ProfileTab = PrivateTab | PublicTab;

/** Placeholder seller trust stats until ratings API is wired. */
const TRUST_METRICS = {
  productSatisfaction: 94,
  replyTime: "10 min",
  onTimeDelivery: 96,
} as const;

function formatProfileLocation(city: string | null | undefined): string | null {
  const trimmed = city?.trim();
  if (!trimmed) return null;
  return trimmed.toLowerCase().includes("cameroon") ? trimmed : `${trimmed}, Cameroon`;
}

function normalizeRouteParam(v: string | string[] | undefined): string | undefined {
  if (v == null) return undefined;
  const raw = Array.isArray(v) ? v[0] : v;
  const t = typeof raw === "string" ? raw.trim() : "";
  return t || undefined;
}

/** `profiles.created_at` → "Joined March 2022" */
function formatProfileJoinedAt(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  try {
    const when = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    return `Joined ${when}`;
  } catch {
    return null;
  }
}

export default function UserTab() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { userId: userIdParam } = useLocalSearchParams<{ userId?: string | string[] }>();
  const userIdFromRoute = normalizeRouteParam(userIdParam);

  const { profile: authProfile, user } = useAuth();
  const { profile: localProfile } = useUserProfile();

  const selfId = user?.id ?? authProfile?.id ?? null;
  const isViewingOther = Boolean(userIdFromRoute && userIdFromRoute !== selfId);
  const profileTabs: readonly ProfileTab[] = isViewingOther ? PUBLIC_TABS : PRIVATE_TABS;

  const [activeTab, setActiveTab] = useState<ProfileTab>("Posts");
  const [isFollowing, setIsFollowing] = useState(false);
  const [otherProfile, setOtherProfile] = useState<ProfileRow | null>(null);
  const [otherLoading, setOtherLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [clips, setClips] = useState<StoreProduct[]>([]);
  const [clipViewCounts, setClipViewCounts] = useState<Record<string, number>>({});
  const [clipsLoading, setClipsLoading] = useState(false);

  const profileUserId = isViewingOther ? userIdFromRoute : selfId;
  const isClipsTab = activeTab === "Posts" || activeTab === "Clips";


  type IoniconName = ComponentProps<typeof Ionicons>["name"];

function MenuActionRow({
  iconName,
  label,
  onPress,
  destructive,
}: {
  iconName: IoniconName;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  const color = destructive ? "#DC2626" : "#111827";
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} accessibilityRole="button">
      <View style={styles.menuRowLeft}>
        <Ionicons name={iconName} size={18} color={color} />
        <Text style={[styles.menuRowLabel, destructive && styles.menuRowLabelDestructive]}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

  useEffect(() => {
    if (!isViewingOther || !userIdFromRoute) {
      setOtherProfile(null);
      setOtherLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setOtherLoading(true);
      try {
        const row = await fetchProfileById(userIdFromRoute);
        if (!cancelled) setOtherProfile(row);
      } finally {
        if (!cancelled) setOtherLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isViewingOther, userIdFromRoute]);

  useEffect(() => {
    const allowed: readonly ProfileTab[] = isViewingOther ? PUBLIC_TABS : PRIVATE_TABS;
    if (!allowed.includes(activeTab)) {
      setActiveTab(isViewingOther ? "Clips" : "Posts");
    }
  }, [isViewingOther, activeTab]);

  useEffect(() => {
    setIsFollowing(false);
  }, [userIdFromRoute]);

  useEffect(() => {
    if (!profileUserId) {
      setClips([]);
      setClipViewCounts({});
      setClipsLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setClipsLoading(true);
      try {
        const [rows, counts] = await Promise.all([
          getSellerVideoProducts(profileUserId),
          fetchSellerProductViewCounts(profileUserId).catch(() => ({})),
        ]);
        if (!cancelled) {
          setClips(rows);
          setClipViewCounts(counts);
        }
      } finally {
        if (!cancelled) setClipsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profileUserId]);

  // Prefer Supabase as the canonical source; fall back to local onboarding
  // data while the profile row is still loading (own profile only).
  const displayName = useMemo(() => {
    if (isViewingOther) {
      return (
        otherProfile?.display_name ||
        otherProfile?.full_name ||
        (otherProfile?.username ? `@${otherProfile.username}` : "Seller")
      );
    }
    return (
      authProfile?.display_name ||
      authProfile?.full_name ||
      localProfile.displayName ||
      "Your profile"
    );
  }, [isViewingOther, otherProfile, authProfile, localProfile.displayName]);

  const username = isViewingOther
    ? otherProfile?.username || ""
    : authProfile?.username || localProfile.username || "";

  const avatarUrl = isViewingOther ? otherProfile?.avatar_url ?? null : authProfile?.avatar_url || null;

  const coverImageUrl = isViewingOther
    ? otherProfile?.cover_image_url ?? null
    : authProfile?.cover_image_url || null;

  const bio = (isViewingOther ? otherProfile?.bio || "" : authProfile?.bio || "").trim();

  const joinedLabel = useMemo(() => {
    const iso = isViewingOther ? otherProfile?.created_at : authProfile?.created_at;
    return formatProfileJoinedAt(iso);
  }, [isViewingOther, otherProfile?.created_at, authProfile?.created_at]);

  const locationLabel = useMemo(() => {
    if (!isViewingOther) return null;
    return formatProfileLocation(otherProfile?.city);
  }, [isViewingOther, otherProfile?.city]);

  const handleBackPress = () => {
    if (isViewingOther) {
      router.back();
      return;
    }
    router.push("/profile");
  };

  const handleEditProfilePress = useCallback(() => {
    try {
      router.push(ROUTES.EDIT_PROFILE);
    } catch (error) {
      console.error("Navigation error:", error);
    }
  }, [router]);

  const handleShareProfile = useCallback(async () => {
    try {
      const handleBit = username.trim() ? `@${username.trim()}` : "";
      const who = handleBit ? `${displayName} (${handleBit})` : displayName;
      await Share.share({
        message: `Check out ${who} on SAFICK!`,
      });
    } catch {
      // Dismissed or failed
    }
  }, [displayName, username]);

  const onReportPress = () => {
    setMenuOpen(false);
    setReportModalOpen(true);
  };

  const handleReportSubmit = useCallback(
    async (reason: string) => {
      const targetId = userIdFromRoute ?? selfId;
      if (!targetId) return;
      console.info("[report]", { userId: targetId, reason });
    },
    [userIdFromRoute, selfId],
  );

  const profileMissing = isViewingOther && !otherLoading && !otherProfile;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {profileMissing ? (
        <View style={styles.missingWrap}>
          <Text style={styles.missingTitle}>Profile not found</Text>
          <TouchableOpacity style={styles.missingBack} onPress={handleBackPress} accessibilityRole="button">
            <Text style={styles.missingBackText}>Go back</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {isViewingOther && otherLoading ? (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator color="#111827" size="large" />
        </View>
      ) : null}

      {!profileMissing ? (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={[styles.header, isViewingOther && styles.headerPublic]}>
        {coverImageUrl ? (
          <>
            <Image source={{ uri: coverImageUrl }} style={styles.headerCoverImage} resizeMode="cover" />
            <View style={styles.headerCoverTint} />
          </>
        ) : null}
        <View style={styles.headerForeground}>
        {/* Top Row - Back Arrow and Action Buttons */}
        <View style={styles.topRow}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <MaterialIcons name="keyboard-arrow-left" size={37} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.rightActions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleShareProfile}
              accessibilityRole="button"
              accessibilityLabel="Share profile"
            >
              <FontAwesome6 name="arrow-up-from-bracket" size={26} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}
              accessibilityRole="button"
              accessibilityLabel="More options"
              onPress={() => setMenuOpen(true)}
            >
              <Ionicons name="ellipsis-vertical" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profilePictureContainer}>
            <View style={styles.profilePicture}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.profilePictureImage} resizeMode="cover" />
              ) : (
                <Ionicons name="person" size={40} color="#000000" />
              )}
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.username} numberOfLines={1}>{displayName}</Text>
            {username ? (
              <Text style={styles.userHandle} numberOfLines={1}>@{username}</Text>
            ) : null}
            {joinedLabel ? (
              <Text style={styles.joinedAt} numberOfLines={1}>
                {joinedLabel}
              </Text>
            ) : null}
            {isViewingOther && locationLabel ? (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={16} color="rgba(255, 255, 255, 0.9)" />
                <Text style={styles.locationText} numberOfLines={1}>
                  {locationLabel}
                </Text>
              </View>
            ) : null}
            {!isViewingOther ? (
              <TouchableOpacity style={styles.editProfileButton} onPress={handleEditProfilePress}>
                <FontAwesome6 name="pen" size={14} color="#FFFFFF" />
                <Text style={styles.editProfileText}>Edit Profile</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.followButton, isFollowing && styles.followButtonActive]}
                onPress={() => setIsFollowing((prev) => !prev)}
                accessibilityRole="button"
                accessibilityLabel={isFollowing ? "Unfollow seller" : "Follow seller"}
              >
                <Ionicons name={isFollowing ? "checkmark" : "person-add"} size={16} color="#FFFFFF" />
                <Text style={styles.followButtonText}>{isFollowing ? "Following" : "Follow"}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {isViewingOther ? (
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
        ) : null}
        </View>
      </View>

      {/* Statistics Section */}
      <View style={styles.statsSection}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{clips.length}</Text>
          <Text style={styles.statLabel}>{isViewingOther ? "Clips" : "Posts"}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>{isViewingOther ? "Sold" : "Following"}</Text>
        </View>
      </View>

      {/* Bio — below stats so it sits on the white content area */}
      <View style={styles.bioSection}>
        {bio ? (
          <Text style={styles.bioText}>
            {bio}
          </Text>
        ) : !isViewingOther ? (
          <TouchableOpacity onPress={handleEditProfilePress} accessibilityRole="button">
            <Text style={styles.bioPlaceholder}>
              Add a bio to tell people about yourself
            </Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.bioPlaceholderMuted}>No bio yet.</Text>
        )}
      </View>

      {/* Navigation Tabs — private vs public */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          {profileTabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <Modal
          visible={menuOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setMenuOpen(false)}
        >
          <Pressable style={styles.menuBackdrop} onPress={() => setMenuOpen(false)}>
            <Pressable
              onPress={(e) => e.stopPropagation()}
              style={[styles.menuCard, { top: insets.top + 58 }]}
            >
              <Text style={styles.menuSectionLabel}>Actions</Text>
              {isViewingOther ? (
                <MenuActionRow
                  iconName="flag-outline"
                  label="Report user"
                  onPress={onReportPress}
                  destructive
                />
              ) : null}
            </Pressable>
          </Pressable>
        </Modal>

      {/* Main Content Area */}
c      <View style={[styles.content, isClipsTab && clips.length > 0 && styles.contentGrid]}>
        {isClipsTab ? (
          clipsLoading ? (
            <ActivityIndicator color="#FF2800" size="large" />
          ) : (
            <ProfileVideoGrid
              products={clips}
              sellerId={profileUserId ?? ""}
              viewCounts={clipViewCounts}
              emptyLabel={
                isViewingOther
                  ? "No clips yet"
                  : "No posts yet \n Create a video listing to show up here"
              }
            />
          )
        ) : (
          <Text style={styles.contentText}>No {activeTab} yet</Text>
        )}
      </View>
        </ScrollView>
      ) : null}

      <ReportUserModal
        visible={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        reasons={PROFILE_REPORT_REASONS}
        subjectLabel={displayName}
        onSubmit={handleReportSubmit}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scroll: {
    flex: 1,
  },
  header: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#929292",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
    minHeight: 180,
  },
  headerPublic: {
    minHeight: 280,
    paddingBottom: 16,
  },
  headerCoverImage: {
    ...StyleSheet.absoluteFillObject,
  },
  headerCoverTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.42)",
  },
  headerForeground: {
    position: "relative",
    zIndex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    marginLeft: -10,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  applyButton: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  iconButton: {
    padding: 4,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  profilePictureContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePicture: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E5E7EB',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profilePictureImage: {
    width: '100%',
    height: '100%',
  },
  profileInfo: {
    flex: 1,
    gap: 6,
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userHandle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  joinedAt: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.72)",
    marginTop: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
    flexShrink: 1,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  editProfileText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF2800',
    paddingHorizontal: 26,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  followButtonActive: {
    backgroundColor: '#333333',
  },
  followButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  trustContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 18,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "rgb(0, 0, 0)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
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
  settingsButton: {
    padding: 10,
    marginBottom: 0,
  },
  bioSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  bioText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#111827',
  },
  bioPlaceholder: {
    fontSize: 14,
    lineHeight: 22,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  statLabel: {
    fontSize: 15,
    color: '#666666',
    fontWeight: '500',
  },
  tabsContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabsScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 24,
  },
  tab: {
    paddingBottom: 8,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666666',
  },
  tabTextActive: {
    color: '#000000',
    fontWeight: '600',
  },
  content: {
    backgroundColor: '#FFFFFF',
    minHeight: 320,
    padding: 20,
    paddingBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentGrid: {
    paddingHorizontal: 0,
    paddingTop: 8,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  contentText: {
    color: '#000000',
    fontSize: 20,
    fontWeight: '700',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.65)",
  },
  missingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 16,
  },
  missingTitle: { fontSize: 18, fontWeight: "600", color: "#111827" },
  missingBack: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#111827",
    borderRadius: 12,
  },
  missingBackText: { color: "#FFFFFF", fontWeight: "600" },
  bioPlaceholderMuted: {
    fontSize: 14,
    lineHeight: 22,
    color: "#9CA3AF",
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  menuCard: {
    position: "absolute",
    right: 12,
    width: 260,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 6,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E7EB",
  },
  menuSectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.7,
    textTransform: "uppercase",
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 4,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
  },
  menuRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  menuRowLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  menuRowLabelDestructive: {
    color: "#DC2626",
  },
});
