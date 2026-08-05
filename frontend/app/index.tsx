import { useEffect } from "react";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import Splashscreen from "./screens/Intro/splashscreen";
import { useUserProfile } from "../stores/userProfileStore";
import { useAuth } from "../context/AuthContext";
import { splashDelayRemaining } from "../constants/splash";
import { isShareDeepLinkUrl } from "../utils/shareDeepLink";

/** App entry: splash while auth/profile load, then route to the right screen. */
export default function Index() {
  const router = useRouter();
  const { profile, isLoaded: profileLoaded } = useUserProfile();
  const { isAuthenticated, isReady: authReady, profile: authProfile, profileLoading } = useAuth();

  const bootstrapped = authReady && profileLoaded && (!isAuthenticated || !profileLoading);

  useEffect(() => {
    if (!bootstrapped) return;

    let cancelled = false;

    void (async () => {
      const initial = await Linking.getInitialURL();
      if (cancelled) return;
      if (isShareDeepLinkUrl(initial)) {
        return;
      }

      const delayMs = splashDelayRemaining();
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      if (cancelled) return;

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
    })();

    return () => {
      cancelled = true;
    };
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
