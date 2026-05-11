import { Ionicons } from "@expo/vector-icons";
import { type Href, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { useUserProfile } from "../../context/UserProfileContext";

const RED = "#FF2800";

export default function SignInScreen() {
  const router = useRouter();
  const { redirectTo } = useLocalSearchParams<{ redirectTo?: string }>();
  const { signIn } = useAuth();
  const { profile, isLoaded: profileLoaded } = useUserProfile();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const navigateAfterLogin = useCallback(() => {
    if (redirectTo && typeof redirectTo === "string" && redirectTo.length > 0) {
      router.replace(redirectTo as Href);
      return;
    }
    if (!profile.onboardingCompleted) {
      router.replace("/screens/onboarding/OnboardingScreen");
      return;
    }
    router.replace("/(tabs)");
  }, [redirectTo, profile.onboardingCompleted, router]);

  const handleSignIn = useCallback(async () => {
    const trimmed = email.trim();
    if (!trimmed || !password) {
      Alert.alert("Sign in", "Please enter your email and password.");
      return;
    }
    setSubmitting(true);
    try {
      await signIn(trimmed, password);
      navigateAfterLogin();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Could not sign in.";
      Alert.alert("Sign in failed", message);
    } finally {
      setSubmitting(false);
    }
  }, [email, password, signIn, navigateAfterLogin]);

  if (!profileLoaded) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]} edges={["top", "left", "right"]}>
        <ActivityIndicator size="large" color={RED} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in with your email and password.</Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
            editable={!submitting}
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={styles.passwordInput}
              placeholder="••••••••"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              editable={!submitting}
            />
            <TouchableOpacity
              onPress={() => setShowPassword((s) => !s)}
              style={styles.eye}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? "Hide password" : "Show password"}
            >
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.primary, submitting && styles.primaryDisabled]}
            onPress={handleSignIn}
            disabled={submitting}
            activeOpacity={0.9}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondary}
            onPress={() => router.replace("/screens/onboarding/OnboardingScreen")}
            disabled={submitting}
          >
            <Text style={styles.secondaryText}>Create an account</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  flex: { flex: 1 },
  center: { justifyContent: "center", alignItems: "center" },
  headerRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    marginBottom: 28,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#111827",
    marginBottom: 18,
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    marginBottom: 24,
    paddingRight: 8,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#111827",
  },
  eye: { padding: 8 },
  primary: {
    backgroundColor: RED,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryDisabled: { opacity: 0.7 },
  primaryText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  secondary: {
    marginTop: 20,
    alignItems: "center",
    paddingVertical: 12,
  },
  secondaryText: {
    color: RED,
    fontSize: 16,
    fontWeight: "600",
  },
});
