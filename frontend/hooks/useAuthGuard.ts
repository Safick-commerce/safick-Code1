import { useEffect } from "react";
import { usePathname, useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";

/**
 * Keeps navigation aligned with Supabase auth:
 * - Guests cannot stay on main tabs (deep links).
 * - Signed-in users are steered away from the sign-in stack.
 */
export function useAuthGuard() {
  const { isReady, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isReady) return;

    const path = pathname ?? "";

    if (!isAuthenticated && path.startsWith("/(tabs)")) {
      router.replace("/");
      return;
    }

    if (isAuthenticated && path.startsWith("/auth")) {
      router.replace("/");
    }
  }, [isReady, isAuthenticated, pathname, router]);
}
