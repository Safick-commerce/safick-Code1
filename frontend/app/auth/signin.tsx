import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import { type Href, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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
  const { signIn, signInWithOAuth, resetPassword } = useAuth();
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

  const handleForgotPassword = useCallback(async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      Alert.alert("Reset password", "Enter your email first, then tap Forgot Password.");
      return;
    }
    try {
      await resetPassword(trimmed);
      Alert.alert("Check your inbox", "Password reset instructions were sent to your email.");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Could not send reset email.";
      Alert.alert("Reset password", message);
    }
  }, [email, resetPassword]);

  const handleOAuthSignIn = useCallback(
    async (provider: "google" | "apple") => {
      setSubmitting(true);
      try {
        await signInWithOAuth(provider);
        navigateAfterLogin();
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Could not sign in.";
        Alert.alert(`${provider === "google" ? "Google" : "Apple"} sign in failed`, message);
      } finally {
        setSubmitting(false);
      }
    },
    [signInWithOAuth, navigateAfterLogin]
  );

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

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Login</Text>
          <Text style={styles.subtitle}>Welcome Back!</Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter email"
            placeholderTextColor="#94A3B8"
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
              placeholder="Enter password"
              placeholderTextColor="#94A3B8"
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
              <FontAwesome6 name={showPassword ? "eye-slash" : "eye"} size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.forgotPassword} onPress={handleForgotPassword} disabled={submitting}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primary, submitting && styles.primaryDisabled]}
            onPress={handleSignIn}
            disabled={submitting}
            activeOpacity={0.9}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryText}>Log In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>or</Text>
            <View style={styles.orLine} />
          </View>

          <TouchableOpacity
            style={[styles.socialButton, submitting && styles.socialButtonDisabled]}
            activeOpacity={0.8}
            onPress={() => handleOAuthSignIn("google")}
            disabled={submitting}
          >
            <Image source={require("../../assets/images/Google.png")} style={styles.googleLogo} />
            <Text style={styles.socialButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialButton, submitting && styles.socialButtonDisabled]}
            activeOpacity={0.8}
            onPress={() => handleOAuthSignIn("apple")}
            disabled={submitting}
          >
            <Ionicons name="logo-apple" size={22} color="#0F172A" />
            <Text style={styles.socialButtonText}>Continue with Apple</Text>
          </TouchableOpacity>

          <View style={styles.termsFooter}>
            <Text style={styles.termsText}>
              By clicking continue, you agree to our <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </View>

          <TouchableOpacity
            style={styles.secondary}
            onPress={() =>
              router.replace("/screens/onboarding/OnboardingScreen?skipWalkthrough=1" as Href)
            }
            disabled={submitting}
          >
            <Text style={styles.secondaryPrompt}>Don't have an account? </Text>
            <Text style={styles.secondaryText}>Sign up now</Text>
          </TouchableOpacity>
        </ScrollView>
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
    width: "100%",
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 6,
    fontFamily: "PlayfairDisplay_800ExtraBold",
  },
  subtitle: {
    fontSize: 30,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 24,
    fontFamily: "PlayfairDisplay_800ExtraBold",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 14,
    color: "#111827",
    marginBottom: 18,
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 4,
    fontSize: 14,
    color: "#111827",
  },
  eye: { padding: 8 },
  forgotPassword: {
    alignSelf: "flex-end",
    paddingVertical: 10,
    marginBottom: 12,
  },
  forgotPasswordText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "600",
  },
  primary: {
    backgroundColor: RED,
    borderRadius: 12,
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
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 16,
    gap: 12,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  orText: {
    fontSize: 14,
    color: "#94A3B8",
    fontWeight: "500",
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    backgroundColor: "#F1F5F9",
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  socialButtonDisabled: {
    opacity: 0.6,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
  },
  googleLogo: {
    width: 20,
    height: 20,
  },
  secondary: {
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    paddingVertical: 12,
  },
  secondaryPrompt: {
    color: "#64748B",
    fontSize: 15,
  },
  secondaryText: {
    color: RED,
    fontSize: 15,
    fontWeight: "700",
  },
  termsFooter: {
    marginTop: 24,
    paddingHorizontal: 8,
  },
  termsText: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },
  termsLink: {
    color: "#0F172A",
    fontWeight: "700",
  },
});
