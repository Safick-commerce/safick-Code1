import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { type Href, useRouter } from "expo-router";
import LoginScreen from "./screens/loginscreens/Loginscreens";
import { useUserProfile } from "../context/UserProfileContext";
import { useAuth } from "../context/AuthContext";

export default function Index() {
  const router = useRouter();
  const { profile, isLoaded: profileLoaded } = useUserProfile();
  const { isAuthenticated, isReady: authReady } = useAuth();

  const handleGetStarted = () => {
    router.replace("/screens/onboarding/OnboardingScreen");
  };

  const handleSignInPress = () => {
    router.push("/auth/signin" as Href);
  };

  if (!authReady || !profileLoaded) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF2800" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginScreen
        onSuccess={handleGetStarted}
        onSignInPress={handleSignInPress}
        logoIconSource={require("../assets/images/safick-prlogo02.png")}
      />
    );
  }

  return <RedirectAfterAuth onboardingDone={profile.onboardingCompleted} />;
}

function RedirectAfterAuth({ onboardingDone }: { onboardingDone: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (onboardingDone) {
      router.replace("/(tabs)");
    } else {
      router.replace("/screens/onboarding/OnboardingScreen");
    }
  }, [router, onboardingDone]);

  return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color="#FF2800" />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
});
