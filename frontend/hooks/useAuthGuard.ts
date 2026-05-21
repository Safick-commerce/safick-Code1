import { useEffect } from "react";
import { usePathname, useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { useUserProfile } from "../context/UserProfileContext";

/**
 * Keeps navigation aligned with Supabase auth:
 * - Guests cannot stay on main tabs (deep links).
 * - Signed-in users are steered away from the sign-in stack.
 */
export function useAuthGuard() {
  const { isReady, isAuthenticated } = useAuth();
  const { profile, isLoaded: profileLoaded } = useUserProfile();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isReady || !profileLoaded) return;

    const path = pathname ?? "";

    const canUseTabsAsGuest = !isAuthenticated && profile.isGuestUser;

    if (!isAuthenticated && !canUseTabsAsGuest && path.startsWith("/(tabs)")) {
      router.replace("/");
      return;
    }

    if (isAuthenticated && path.startsWith("/auth")) {
      router.replace("/");
    }
  }, [isReady, isAuthenticated, profileLoaded, profile.isGuestUser, pathname, router]);
}
