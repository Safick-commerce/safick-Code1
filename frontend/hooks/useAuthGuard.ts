import { useEffect } from "react";
import { usePathname, useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { useUserProfile } from "../stores/userProfileStore";

/** Signed-in users may finish these flows before being sent to the main app. */
const AUTH_ROUTES_WHILE_SIGNED_IN = new Set([
  "/auth/create-new-password",
  "/auth/password-reset-success",
]);

function isPasswordResetRoute(path: string): boolean {
  return AUTH_ROUTES_WHILE_SIGNED_IN.has(path);
}

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

    if (isAuthenticated && path.startsWith("/auth") && !isPasswordResetRoute(path)) {
      router.replace("/(tabs)");
    }
  }, [isReady, isAuthenticated, profileLoaded, profile.isGuestUser, pathname, router]);
}
