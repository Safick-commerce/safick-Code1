import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
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
import { supabase } from "../../lib/supabase";
import { isAuthEmailRateLimited } from "../../utils/authResetEmail";

const RED = "#FF2800";

export default function ForgotPasswordScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleContinue = useCallback(async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      Alert.alert(t("auth_reset_title"), t("auth_reset_email_required"));
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmed);
      if (error) throw error;

      router.push({
        pathname: "/auth/create-new-password",
        params: { email: trimmed },
      });
    } catch (e: unknown) {
      const raw = e instanceof Error ? e.message : "";
      const message = raw && isAuthEmailRateLimited(raw)
        ? t("auth_reset_resend_too_soon")
        : raw || t("auth_error_reset_email");
      Alert.alert(t("auth_reset_title"), message);
    } finally {
      setSubmitting(false);
    }
  }, [email, router, t]);

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
          <Text style={styles.title}>{t("auth_reset_forgot_heading")}</Text>
          <Text style={styles.description}>{t("auth_reset_forgot_body")}</Text>

          <Text style={styles.label}>{t("auth_reset_email_label")}</Text>
          <TextInput
            style={styles.input}
            placeholder={t("auth_reset_email_placeholder")}
            placeholderTextColor="#828282"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="emailAddress"
            value={email}
            onChangeText={setEmail}
            editable={!submitting}
          />

          <TouchableOpacity
            style={[styles.primary, submitting && styles.primaryDisabled]}
            onPress={handleContinue}
            disabled={submitting}
            activeOpacity={0.9}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryText}>{t("auth_reset_send_code")}</Text>
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
    marginBottom: 28,
  },
  label: {
    fontSize: 15,
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
    marginBottom: 24,
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
});
