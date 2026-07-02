import { FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { useLanguage } from "../../context/LanguageContext";
import { resetPassword } from "../../lib/authApi";
import { consumePendingResetToken } from "../../lib/passwordResetSession";

const RED = "#FF2800";

function ValidationHint({ valid, message }: { valid: boolean; message: string }) {
  return (
    <Text style={[styles.hint, valid ? styles.hintValid : styles.hintInvalid]}>{message}</Text>
  );
}

export default function CreateNewPasswordScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const [resetToken, setResetToken] = useState<string | null>(null);

  useEffect(() => {
    const token = consumePendingResetToken();
    if (!token) {
      router.replace("/auth/forgot-password");
      return;
    }
    setResetToken(token);
  }, [router]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const passwordMinLength = password.length >= 8;
  const passwordHasUpper = /[A-Z]/.test(password);
  const passwordHasNumber = /[0-9]/.test(password);
  const passwordHasSpecial = /[^A-Za-z0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const isValid =
    passwordMinLength && passwordHasUpper && passwordHasNumber && passwordHasSpecial && passwordsMatch;

  const handleReset = useCallback(async () => {
    if (!resetToken) {
      return;
    }
    if (!isValid) {
      Alert.alert(t("auth_reset_title"), t("auth_reset_password_invalid"));
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(resetToken, password);
      router.replace("/auth/password-reset-success");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : t("auth_reset_password_failed");
      Alert.alert(t("auth_reset_title"), message);
    } finally {
      setSubmitting(false);
    }
  }, [resetToken, isValid, password, router, t]);

  if (!resetToken) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <View style={[styles.flex, styles.center]}>
          <ActivityIndicator size="large" color={RED} />
        </View>
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
            accessibilityLabel={t("common_go_back")}
          >
            <MaterialIcons name="keyboard-arrow-left" size={37} color="#000000" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.eyebrow}>{t("auth_reset_title")}</Text>
          <Text style={styles.title}>{t("auth_reset_new_password_heading")}</Text>
          <Text style={styles.description}>{t("auth_reset_new_password_body")}</Text>

          <Text style={styles.label}>{t("auth_reset_new_password_label")}</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={styles.passwordInput}
              placeholder={t("account_password_ph")}
              placeholderTextColor="#828282"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              editable={!submitting}
            />
            <TouchableOpacity
              onPress={() => setShowPassword((s) => !s)}
              style={styles.eye}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? t("a11y_hide_password") : t("a11y_show_password")}
            >
              <FontAwesome6 name={showPassword ? "eye-slash" : "eye"} size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {password.length > 0 && (
            <View style={styles.passwordHints}>
              <ValidationHint valid={passwordMinLength} message={t("account_password_min")} />
              <ValidationHint valid={passwordHasUpper} message={t("account_password_upper")} />
              <ValidationHint valid={passwordHasNumber} message={t("account_password_number")} />
              <ValidationHint valid={passwordHasSpecial} message={t("account_password_special")} />
            </View>
          )}

          <Text style={[styles.label, styles.confirmLabel]}>{t("auth_reset_confirm_password_label")}</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={styles.passwordInput}
              placeholder={t("auth_reset_confirm_password_placeholder")}
              placeholderTextColor="#828282"
              secureTextEntry={!showConfirm}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              editable={!submitting}
            />
            <TouchableOpacity
              onPress={() => setShowConfirm((s) => !s)}
              style={styles.eye}
              accessibilityRole="button"
              accessibilityLabel={showConfirm ? t("a11y_hide_password") : t("a11y_show_password")}
            >
              <FontAwesome6 name={showConfirm ? "eye-slash" : "eye"} size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {confirmPassword.length > 0 && !passwordsMatch && (
            <Text style={styles.mismatch}>{t("auth_reset_password_mismatch")}</Text>
          )}

          <TouchableOpacity
            style={[styles.primary, (submitting || !isValid) && styles.primaryDisabled]}
            onPress={handleReset}
            disabled={submitting || !isValid}
            activeOpacity={0.9}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryText}>{t("auth_reset_save_password")}</Text>
            )}
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
  content: { flex: 1, width: "100%" },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
  },
  eyebrow: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 6,
    fontFamily: "PlayfairDisplay_800ExtraBold",
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 12,
    fontFamily: "PlayfairDisplay_800ExtraBold",
  },
  description: {
    fontSize: 15,
    color: "#64748B",
    lineHeight: 22,
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  confirmLabel: {
    marginTop: 8,
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 4,
    fontSize: 14,
    color: "#111827",
  },
  eye: { padding: 8 },
  passwordHints: {
    marginBottom: 16,
    gap: 4,
  },
  hint: {
    fontSize: 13,
  },
  hintValid: {
    color: "#16a34a",
  },
  hintInvalid: {
    color: "#64748B",
  },
  mismatch: {
    color: "#DC2626",
    fontSize: 13,
    marginBottom: 12,
  },
  primary: {
    backgroundColor: RED,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  primaryDisabled: { opacity: 0.5 },
  primaryText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
});
