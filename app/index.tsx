import { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Loginscreens from "./screens/loginscreens/Loginscreens";
import { useUserProfile } from "../context/UserProfileContext";

const AUTH_KEY = "user_logged_in";

export default function Index() {
  const router = useRouter();
  const { profile, isLoaded: profileLoaded } = useUserProfile();
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const value = await AsyncStorage.getItem(AUTH_KEY);
        // #region agent log
        ;
        // #endregion
        setIsLoggedIn(value === "true");
      } catch {
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const handleLoginSuccess = async () => {
    await AsyncStorage.setItem(AUTH_KEY, "true");
    setIsLoggedIn(true);
    router.replace("/screens/onboarding/OnboardingScreen" as any);
  };

  const handleSignInPress = () => {
    router.push("/screens/loginscreens/signinscreen");
  };

  if (isLoading || !profileLoaded) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF2800" />
      </View>
    );
  }

  if (!isLoggedIn) {
    return (
      <Loginscreens
        onSuccess={handleLoginSuccess}
        onSignInPress={handleSignInPress}
        logoIconSource={require('../assets/images/icons.png')}
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
      router.replace("/screens/onboarding/OnboardingScreen" as any);
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
