import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { type Href, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useMemo } from "react";
import { useCartStore } from "../../stores/cartStore";
import { useWishlist } from "../../stores/wishlistStore";
import type { UserProfile } from "../../stores/userProfileStore";

const RED = "#FF2800";

type GuestMenuItem = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint?: string;
  badge?: string | null;
  section: "activity" | "account" | "trust";
  requiresAuth?: boolean;
  route?: Href;
};

type Props = {
  profile: UserProfile;
};

export function GuestProfileHub({ profile }: Props) {
  const router = useRouter();
  const cartItems = useCartStore((state) => state.items);
  const { getWishlistCount } = useWishlist();

  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems],
  );
  const wishlistCount = getWishlistCount();

  const guestLabel = useMemo(() => {
    const name = profile.displayName?.trim();
    if (name) return name;
    const handle = profile.username?.trim();
    if (handle) return `@${handle}`;
    return "Guest";
  }, [profile.displayName, profile.username]);

  const cityLabel = profile.city?.trim() || null;

  const goToSignIn = useCallback(() => {
    router.push({
      pathname: "/auth/signin",
      params: { redirectTo: "/(tabs)/profile" },
    } as Href);
  }, [router]);

  const goToSignUp = useCallback(() => {
    router.push("/screens/onboarding/OnboardingScreen?skipWalkthrough=1" as Href);
  }, [router]);

  const handleItemPress = useCallback(
    (item: GuestMenuItem) => {
      if (item.requiresAuth) {
        goToSignIn();
        return;
      }
      if (item.route) {
        router.push(item.route);
      }
    },
    [goToSignIn, router],
  );

  const menuItems: GuestMenuItem[] = [
    {
      id: "cart",
      icon: "cart-outline",
      label: "Cart",
      hint: cartCount > 0 ? "Ready to checkout when you sign in" : "Items stay on this device",
      badge: cartCount > 0 ? String(cartCount) : null,
      section: "activity",
      route: "/cart",
    },
    {
      id: "wishlist",
      icon: "heart-outline",
      label: "Wishlist",
      hint: wishlistCount > 0 ? `${wishlistCount} saved this session` : "Save items while you browse",
      badge: wishlistCount > 0 ? String(wishlistCount) : null,
      section: "activity",
      route: "/wishlist",
    },
    {
      id: "orders",
      icon: "bag-handle-outline",
      label: "My orders",
      hint: "Track purchases after sign-in",
      section: "account",
      requiresAuth: true,
    },
    {
      id: "escrow",
      icon: "shield-checkmark-outline",
      label: "How escrow works",
      hint: "How SAFICK protects your payment",
      section: "trust",
      route: "/how-escrow-works",
    },
  ];

  const sectionTitles: Record<GuestMenuItem["section"], string> = {
    activity: "Your activity",
    account: "Account",
    trust: "Trust & safety",
  };

  return (
    <SafeAreaView style={styles.root} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={30} color="#6B7280" />
          </View>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>Browsing as guest</Text>
          <Text style={styles.displayName} numberOfLines={1}>
            {guestLabel}
          </Text>
          {cityLabel ? (
            <View style={styles.cityRow}>
              <Ionicons name="location-outline" size={14} color="#6B7280" />
              <Text style={styles.cityText}>{cityLabel}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.signInCard}>
          <Text style={styles.signInTitle}>Sign in to unlock your profile</Text>
          <Text style={styles.signInBody}>
            Save orders, sync your wishlist, and manage account settings across devices.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={goToSignIn}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel="Sign in"
          >
            <Text style={styles.primaryButtonText}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={goToSignUp}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Create an account"
          >
            <Text style={styles.secondaryButtonText}>Create an account</Text>
          </TouchableOpacity>
        </View>

        {(["activity", "account", "trust"] as const).map((section) => {
          const items = menuItems.filter((item) => item.section === section);
          if (items.length === 0) return null;

          return (
            <View key={section}>
              <Text style={styles.sectionHeader}>{sectionTitles[section]}</Text>
              {items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.menuRow}
                  activeOpacity={0.2}
                  onPress={() => handleItemPress(item)}
                  accessibilityRole="button"
                  accessibilityLabel={
                    item.requiresAuth
                      ? `${item.label}, sign in required`
                      : item.label
                  }
                >
                  <View style={styles.menuLeft}>
                    <View style={styles.menuIconWrap}>
                      <Ionicons name={item.icon} size={22} color="#000000" />
                    </View>
                    <View style={styles.menuTextWrap}>
                      <Text style={styles.menuLabel}>{item.label}</Text>
                      {item.hint ? <Text style={styles.menuHint}>{item.hint}</Text> : null}
                    </View>
                    {item.badge ? (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.badge}</Text>
                      </View>
                    ) : null}
                  </View>
                  {item.requiresAuth ? (
                    <Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" />
                  ) : (
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  )}
                </TouchableOpacity>
              ))}
              <View style={styles.sectionDivider} />
            </View>
          );
        })}

        <TouchableOpacity
          style={styles.continueBrowsing}
          onPress={() => router.replace("/(tabs)")}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Continue browsing"
        >
          <Text style={styles.continueBrowsingText}>Continue browsing</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
    borderBottomWidth: 0.3,
    borderBottomColor: "#E5E7EB",
  },
  avatarWrap: {
    alignItems: "center",
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#F3F4F6",
    borderWidth: 0.2,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  guestPill: {
    marginTop: -12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: "#111827",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  guestPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  displayName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  cityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  cityText: {
    fontSize: 14,
    color: "#6B7280",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 28,
  },
  signInCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    padding: 18,
    marginBottom: 8,
  },
  signInTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  signInBody: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: "#6B7280",
  },
  primaryButton: {
    marginTop: 16,
    backgroundColor: RED,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  secondaryButton: {
    marginTop: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: RED,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 8,
    marginHorizontal: 4,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  menuIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  menuTextWrap: {
    flex: 1,
    gap: 2,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000000",
    fontFamily: "Arial",
  },
  menuHint: {
    fontSize: 13,
    color: "#9CA3AF",
  },
  badge: {
    backgroundColor: RED,
    borderRadius: 10,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  continueBrowsing: {
    marginTop: 20,
    alignItems: "center",
    paddingVertical: 12,
  },
  continueBrowsingText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000000",
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 8,
    marginHorizontal: 16,
  },
});
