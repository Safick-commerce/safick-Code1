import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
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
  type TextInput as TextInputType,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLanguage } from "../../context/LanguageContext";
import { forgotPassword, verifyOtp } from "../../lib/authApi";
import { setPendingResetToken } from "../../lib/passwordResetSession";

const RED = "#FF2800";
const CODE_LENGTH = 4;

export default function VerifyCodeScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const email = typeof emailParam === "string" ? emailParam : "";

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(TextInputType | null)[]>([]);

  const code = digits.join("");

  const handleDigitChange = useCallback((index: number, value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = cleaned;
      return next;
    });
    if (cleaned && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }, []);

  const handleKeyPress = useCallback(
    (index: number, key: string) => {
      if (key === "Backspace" && !digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    },
    [digits],
  );

  const handleVerify = useCallback(async () => {
    if (!email) {
      Alert.alert(t("auth_reset_title"), t("auth_reset_missing_email"));
      router.replace("/auth/forgot-password");
      return;
    }
    if (code.length !== CODE_LENGTH) {
      Alert.alert(t("auth_reset_title"), t("auth_reset_code_required"));
      return;
    }

    setSubmitting(true);
    try {
      const { resetToken } = await verifyOtp(email, code);
      setPendingResetToken(resetToken);
      router.push("/auth/create-new-password");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : t("auth_reset_code_invalid");
      Alert.alert(t("auth_reset_title"), message);
    } finally {
      setSubmitting(false);
    }
  }, [code, email, router, t]);

  const handleResend = useCallback(async () => {
    if (!email) return;
    setResending(true);
    try {
      await forgotPassword(email);
      setDigits(Array(CODE_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
      Alert.alert(t("auth_reset_code_sent_title"), t("auth_reset_code_sent_body"));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : t("auth_error_reset_email");
      Alert.alert(t("auth_reset_title"), message);
    } finally {
      setResending(false);
    }
  }, [email, t]);

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
          <Text style={styles.title}>{t("auth_reset_verify_heading")}</Text>
          <Text style={styles.description}>
            {t("auth_reset_verify_body", { email: email || t("auth_reset_your_email") })}
          </Text>

          <View style={styles.codeRow}>
            {digits.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                style={[styles.codeInput, digit ? styles.codeInputFilled : null]}
                value={digit}
                onChangeText={(value) => handleDigitChange(index, value)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                editable={!submitting}
                accessibilityLabel={t("auth_reset_digit_label", { index: index + 1 })}
              />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.primary, submitting && styles.primaryDisabled]}
            onPress={handleVerify}
            disabled={submitting}
            activeOpacity={0.9}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryText}>{t("auth_reset_verify_button")}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resendRow}
            onPress={handleResend}
            disabled={resending || submitting}
          >
            {resending ? (
              <ActivityIndicator color={RED} size="small" />
            ) : (
              <Text style={styles.resendText}>{t("auth_reset_resend_code")}</Text>
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
  codeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 28,
  },
  codeInput: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 72,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    color: "#111827",
  },
  codeInputFilled: {
    borderColor: RED,
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
  resendRow: {
    marginTop: 20,
    alignItems: "center",
    paddingVertical: 12,
  },
  resendText: {
    color: RED,
    fontSize: 15,
    fontWeight: "700",
  },
});
