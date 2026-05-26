import { useEffect } from "react";
import { usePathname, useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { useUserProfile } from "../context/UserProfileContext";

/**
 * Keeps navigation aligned with Supabase auth:
 * - Guests cannot stay on main tabs (deep links).
 * - Signed-in users are steered away from the sign-in stack.
 * - Clears stale guest profile when a Supabase session is restored.
 */
export function useAuthGuard() {
  const { isReady, isAuthenticated } = useAuth();
  const { profile, isLoaded: profileLoaded, updateProfile } = useUserProfile();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isReady || !profileLoaded || !isAuthenticated || !profile.isGuestUser) {
      return;
    }
    void updateProfile({ isGuestUser: false });
  }, [isReady, profileLoaded, isAuthenticated, profile.isGuestUser, updateProfile]);

  useEffect(() => {
    if (!isReady || !profileLoaded) return;

    const path = pathname ?? "";

    const canUseTabsAsGuest = !isAuthenticated && profile.isGuestUser;

    if (!isAuthenticated && !canUseTabsAsGuest && path.startsWith("/(tabs)")) {
      router.replace("/");
      return;
    }

    if (isAuthenticated && path.startsWith("/auth")) {
      router.replace("/(tabs)");
    }
  }, [isReady, isAuthenticated, profileLoaded, profile.isGuestUser, pathname, router]);
}
