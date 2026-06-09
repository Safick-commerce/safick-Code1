// Onboarding Step 1: Account creation form
// Collects full name, username, email, password, and terms agreement
// All state is managed by the parent OnboardingScreen — this is a presentational component

import { FontAwesome6, MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useLanguage } from "../../../../context/LanguageContext";
import { supabase } from "../../../../lib/supabase";

const RED = "#FF2800";
const GREEN = "#16a34a";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Cameroon: +237 followed by 9 digits starting with 6-9
const CAMEROON_PHONE_REGEX = /^\+237[6-9]\d{8}$/;

interface NameUsernameStepProps {
  name: string;
  username: string;
  email: string;
  password: string;
  agreedToTerms: boolean;
  onNameChange: (value: string) => void;
  onUsernameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onAgreeChange: (value: boolean) => void;
  onUsernameAvailable?: (available: boolean) => void;
}

function ValidationHint({ valid, message }: { valid: boolean; message: string }) {
  return (
    <View style={hintStyles.row}>
      <MaterialCommunityIcons
        name={valid ? "check-circle" : "close-circle"}
        size={14}
        color={valid ? GREEN : RED}
      />
      <Text style={[hintStyles.text, { color: valid ? GREEN : RED }]}>{message}</Text>
    </View>
  );
}

export default function NameUsernameStep({
  name,
  username,
  email,
  password,
  agreedToTerms,
  onNameChange,
  onUsernameChange,
  onEmailChange,
  onPasswordChange,
  onAgreeChange,
  onUsernameAvailable,
}: NameUsernameStepProps) {
  const { t } = useLanguage();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [phone, setPhone] = useState("+237");

  const [touched, setTouched] = useState({
    name: false,
    username: false,
    email: false,
    phone: false,
    password: false,
  });

  // Username availability state
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check username availability against public.profiles, with a debounce so we
  // don't spam Supabase on every keystroke. The DB has a unique index on
  // username (see backend/supabase/schema.sql) — this query just lets the UI
  // give the user instant feedback before they hit Continue.
  useEffect(() => {
    if (username.trim().length < 3) {
      setUsernameAvailable(null);
      onUsernameAvailable?.(false);
      return;
    }

    setUsernameChecking(true);
    setUsernameAvailable(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    let cancelled = false;
    debounceRef.current = setTimeout(async () => {
      const value = username.trim().toLowerCase();
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", value)
          .maybeSingle();

        if (cancelled) return;

        if (error) {
          // Network/RPC failure: don't block the user with a confusing UI —
          // log it, mark as unavailable so Continue stays disabled, and let
          // the DB unique constraint be the final guard at signUp time.
          console.warn("[username] availability check failed:", error.message);
          setUsernameAvailable(false);
          onUsernameAvailable?.(false);
          return;
        }

        const isTaken = data !== null;
        setUsernameAvailable(!isTaken);
        onUsernameAvailable?.(!isTaken);
      } catch (e) {
        if (cancelled) return;
        console.warn("[username] availability check error:", e);
        setUsernameAvailable(false);
        onUsernameAvailable?.(false);
      } finally {
        if (!cancelled) setUsernameChecking(false);
      }
    }, 500);

    return () => {
      cancelled = true;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [username, onUsernameAvailable]);

  // Validation flags
  const emailValid = EMAIL_REGEX.test(email.trim());
  const phoneValid = CAMEROON_PHONE_REGEX.test(phone);
  const passwordMinLength = password.length >= 8;
  const passwordHasUpper = /[A-Z]/.test(password);
  const passwordHasNumber = /[0-9]/.test(password);
  const passwordHasSpecial = /[^A-Za-z0-9]/.test(password);
  const nameValid = name.trim().length >= 2;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* -------- Header -------- */}
      <Text style={styles.heading}>{t("account_create_heading")}</Text>
      <Text style={styles.subheading}>{t("account_create_subheading")}</Text>

      {/* -------- Full Name -------- */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t("account_full_name")}</Text>
        <TextInput
          style={[styles.input, touched.name && !nameValid && styles.inputError]}
          placeholder={t("account_name_ph")}
          placeholderTextColor="#94A3B8"
          value={name}
          onChangeText={onNameChange}
          onBlur={() => setTouched((t) => ({ ...t, name: true }))}
          autoCapitalize="words"
          autoFocus
        />
        {touched.name && !nameValid && (
          <ValidationHint valid={false} message={t("account_name_min")} />
        )}
      </View>

      {/* -------- Username -------- */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t("account_username")}</Text>
        <View style={[
          styles.usernameRow,
          touched.username && usernameAvailable === false && styles.rowError,
          touched.username && usernameAvailable === true && styles.rowSuccess,
        ]}>
          <Text style={styles.atSymbol}>@</Text>
          <TextInput
            style={styles.usernameInput}
            placeholder={t("account_username_ph")}
            placeholderTextColor="#94A3B8"
            value={username}
            onChangeText={(text) => {
              const cleaned = text.toLowerCase().replace(/[^a-z0-9._]/g, "");
              onUsernameChange(cleaned);
            }}
            onBlur={() => setTouched((t) => ({ ...t, username: true }))}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {/* Spinner or check/cross on the right */}
          {username.trim().length >= 3 && (
            <View style={styles.usernameStatus}>
              {usernameChecking ? (
                <ActivityIndicator size="small" color="#94A3B8" />
              ) : usernameAvailable === true ? (
                <MaterialCommunityIcons name="check-circle" size={20} color={GREEN} />
              ) : usernameAvailable === false ? (
                <MaterialCommunityIcons name="close-circle" size={20} color={RED} />
              ) : null}
            </View>
          )}
        </View>
        {touched.username && username.trim().length >= 3 && !usernameChecking && (
          <ValidationHint
            valid={usernameAvailable === true}
            message={
              usernameAvailable === true
                ? t("account_username_available")
                : t("account_username_taken")
            }
          />
        )}
        {touched.username && username.trim().length < 3 && (
          <ValidationHint valid={false} message={t("account_username_min", { min: 3 })} />
        )}
      </View>

      {/* -------- Email -------- */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t("account_email")}</Text>
        <TextInput
          style={[
            styles.input,
            touched.email && !emailValid && styles.inputError,
            touched.email && emailValid && styles.inputSuccess,
          ]}
          placeholder={t("account_email_ph")}
          placeholderTextColor="#94A3B8"
          value={email}
          onChangeText={onEmailChange}
          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
        />
        {touched.email && !emailValid && (
          <ValidationHint valid={false} message={t("account_email_invalid")} />
        )}
      </View>

      {/* -------- Phone Number (Cameroon) -------- */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t("account_phone")}</Text>
        <View style={[
          styles.phoneRow,
          touched.phone && !phoneValid && styles.rowError,
          touched.phone && phoneValid && styles.rowSuccess,
        ]}>
          <View style={styles.countryCode}>
            <Text style={styles.flag}>🇨🇲</Text>
            <Text style={styles.countryCodeText}>+237</Text>
          </View>
          <View style={styles.phoneDivider} />
          <TextInput
            style={styles.phoneInput}
            placeholder={t("account_phone_ph")}
            placeholderTextColor="#94A3B8"
            value={phone.slice(4)}
            onChangeText={(text) => {
              const digits = text.replace(/[^0-9]/g, "").slice(0, 9);
              setPhone("+237" + digits);
            }}
            onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
            keyboardType="phone-pad"
            maxLength={9}
          />
        </View>
        {touched.phone && !phoneValid && (
          <ValidationHint valid={false} message={t("account_phone_invalid")} />
        )}
      </View>

      {/* -------- Password -------- */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t("account_password")}</Text>
        <View style={[styles.passwordRow, touched.password && !passwordMinLength && styles.rowError]}>
          <TextInput
            style={styles.passwordInput}
            placeholder={t("account_password_ph")}
            placeholderTextColor="#94A3B8"
            value={password}
            onChangeText={onPasswordChange}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            secureTextEntry={!passwordVisible}
            autoCapitalize="none"
          />
          <TouchableOpacity
            onPress={() => setPasswordVisible(!passwordVisible)}
            style={styles.eyeButton}
            activeOpacity={0.7}
          >
            <FontAwesome6 name={passwordVisible ? "eye-slash" : "eye"} size={18} color="#64748B" />
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
      </View>

      {/* -------- Terms & Privacy Checkbox -------- */}
      <TouchableOpacity
        style={styles.termsRow}
        onPress={() => onAgreeChange(!agreedToTerms)}
        activeOpacity={0.7}
      >
        <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
          {agreedToTerms && <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />}
        </View>
        <Text style={styles.terms}>
          {t("auth_terms_prefix")}
          <Text style={styles.termsLink}>{t("common_terms_of_service")}</Text>
          {t("auth_terms_and")}
          <Text style={styles.termsLink}>{t("common_privacy_policy")}</Text>.
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const hintStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 5,
  },
  text: {
    fontSize: 12,
    fontFamily: "Inter",
  },
});

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  heading: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    fontFamily: "PlayfairDisplay_800ExtraBold",
    marginBottom: 8,
  },
  subheading: {
    fontSize: 15,
    fontWeight: "400",
    color: "#6B7280",
    fontFamily: "Inter",
    marginBottom: 28,
  },
  inputGroup: { marginBottom: 20 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    fontFamily: "Inter",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: "Inter",
    color: "#111827",
  },
  inputError: { borderColor: RED },
  inputSuccess: { borderColor: GREEN },
  usernameRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  rowError: { borderColor: RED },
  rowSuccess: { borderColor: GREEN },
  atSymbol: {
    fontSize: 16,
    fontWeight: "600",
    color: "#9CA3AF",
    fontFamily: "Inter",
    marginRight: 4,
  },
  usernameInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: "Inter",
    color: "#111827",
  },
  usernameStatus: {
    paddingLeft: 8,
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  countryCode: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 14,
  },
  flag: { fontSize: 18 },
  countryCodeText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    fontFamily: "Inter",
  },
  phoneDivider: {
    width: 1,
    height: 24,
    backgroundColor: "#E2E8F0",
  },
  phoneInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: "Inter",
    color: "#111827",
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: "Inter",
    color: "#111827",
  },
  eyeButton: { padding: 8 },
  passwordHints: {
    marginTop: 10,
    gap: 4,
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginTop: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: RED,
    borderColor: RED,
  },
  terms: {
    flex: 1,
    fontSize: 13,
    fontWeight: "400",
    color: "#6B7280",
    fontFamily: "Inter",
    lineHeight: 20,
  },
  termsLink: {
    fontWeight: "700",
    color: "#111827",
  },
});
