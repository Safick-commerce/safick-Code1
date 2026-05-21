import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Share,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons, MaterialIcons, FontAwesome6 } from "@expo/vector-icons";
import { useState, useCallback, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { useUserProfile } from "../../context/UserProfileContext";
import { fetchProfileById, type ProfileRow } from "../../utils/fetchProfile";

const ROUTES = {
  EDIT_PROFILE: "/edit_profile",
  SELLER_MESSAGE: "/sellermessage",
} as const;

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
  const router = useRouter();
  const { userId: userIdParam } = useLocalSearchParams<{ userId?: string | string[] }>();
  const userIdFromRoute = normalizeRouteParam(userIdParam);

  const [activeTab, setActiveTab] = useState("Posts");
  const { profile: authProfile, user } = useAuth();
  const { profile: localProfile } = useUserProfile();

  const selfId = user?.id ?? authProfile?.id ?? null;
  const isViewingOther = Boolean(userIdFromRoute && userIdFromRoute !== selfId);

  const [otherProfile, setOtherProfile] = useState<ProfileRow | null>(null);
  const [otherLoading, setOtherLoading] = useState(false);

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

  const handleMessagePress = useCallback(() => {
    try {
      router.push(ROUTES.SELLER_MESSAGE);
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
        <>
      <View style={styles.header}>
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
            {isViewingOther ? (
              <TouchableOpacity style={styles.editProfileButton} onPress={handleMessagePress}>
                <Ionicons name="chatbubble-outline" size={16} color="#FFFFFF" />
                <Text style={styles.editProfileText}>Message</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.editProfileButton} onPress={handleEditProfilePress}>
                <FontAwesome6 name="pen" size={14} color="#FFFFFF" />
                <Text style={styles.editProfileText}>Edit Profile</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        </View>
      </View>

      {/* Statistics Section */}
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

      {/* Navigation Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.tabsScrollContent}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === "Posts" && styles.tabActive]}
            onPress={() => setActiveTab("Posts")}
          >
            <Text style={[styles.tabText, activeTab === "Posts" && styles.tabTextActive]}>Posts</Text>
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
          <TouchableOpacity 
            style={[styles.tab, activeTab === "Collections" && styles.tabActive]}
            onPress={() => setActiveTab("Collections")}
          >
            <Text style={[styles.tabText, activeTab === "Collections" && styles.tabTextActive]}>Collections</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === "Likes" && styles.tabActive]}
            onPress={() => setActiveTab("Likes")}
          >
            <Text style={[styles.tabText, activeTab === "Likes" && styles.tabTextActive]}>Likes</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Main Content Area */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.contentText}>
          Content for {activeTab} will appear here
        </Text>
      </ScrollView>
        </>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    height: 1000,
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
    fontSize: 14,
    color: '#666666',
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
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  contentText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '500',
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
});
