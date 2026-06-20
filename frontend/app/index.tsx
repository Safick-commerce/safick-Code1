import { useEffect } from "react";
import { useRouter } from "expo-router";
import Splashscreen from "./screens/Intro/splashscreen";
import { useUserProfile } from "../stores/userProfileStore";
import { useAuth } from "../context/AuthContext";
import { splashDelayRemaining } from "../constants/splash";

/** App entry: splash while auth/profile load, then route to the right screen. */
export default function Index() {
  const router = useRouter();
  const { profile, isLoaded: profileLoaded } = useUserProfile();
  const { isAuthenticated, isReady: authReady, profile: authProfile, profileLoading } = useAuth();

  // Don't route until auth, local profile, and remote profile row are ready.
  const bootstrapped = authReady && profileLoaded && (!isAuthenticated || !profileLoading);

  useEffect(() => {
    if (!bootstrapped) return;

    // Keep splash visible for at least the configured minimum duration.
    const delayMs = splashDelayRemaining();
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        // Signed-in users go to tabs or finish onboarding first.
        const onboardingDone =
          profile.onboardingCompleted || authProfile?.onboarding_completed === true;
        router.replace(
          onboardingDone ? "/(tabs)" : "/screens/onboarding/OnboardingScreen",
        );
        return;
      }

      // Guest who already completed onboarding can browse without signing in.
      if (profile.isGuestUser && profile.onboardingCompleted) {
        router.replace("/(tabs)");
        return;
      }

      router.replace("/screens/loginscreens/Loginscreens");
    }, delayMs);

    return () => clearTimeout(timer);
  }, [
    bootstrapped,
    isAuthenticated,
    profile.isGuestUser,
    profile.onboardingCompleted,
    authProfile?.onboarding_completed,
    profileLoading,
    router,
  ]);

  return <Splashscreen />;
}