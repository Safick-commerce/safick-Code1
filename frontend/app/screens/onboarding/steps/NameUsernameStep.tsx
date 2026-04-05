// Onboarding Step 1: Account creation form
// Collects full name, username, email, password, and terms agreement
// All state is managed by the parent OnboardingScreen — this is a presentational component

import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useState } from "react";
import { FontAwesome6, MaterialCommunityIcons } from "@expo/vector-icons";

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
}: NameUsernameStepProps) {
  // Local state only — password visibility toggle doesn't need to persist
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* -------- Header -------- */}
      <Text style={styles.heading}>Create your account</Text>
      <Text style={styles.subheading}>
        {"Let's get you set up on safick"}
      </Text>

      {/* -------- Full Name Input -------- */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Brenda"
          placeholderTextColor="#94A3B8"
          value={name}
          onChangeText={onNameChange}
          autoCapitalize="words"
          autoFocus
        />
      </View>

      {/* -------- Username Input -------- */}
      {/* Only allows lowercase letters, numbers, dots and underscores */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Username</Text>
        <View style={styles.usernameRow}>
          <Text style={styles.atSymbol}>@</Text>
          <TextInput
            style={styles.usernameInput}
            placeholder="brendastyle"
            placeholderTextColor="#94A3B8"
            value={username}
            onChangeText={(text) => {
              const cleaned = text.toLowerCase().replace(/[^a-z0-9._]/g, "");
              onUsernameChange(cleaned);
            }}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      {/* -------- Email Input -------- */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="brenda@example.com"
          placeholderTextColor="#94A3B8"
          value={email}
          onChangeText={onEmailChange}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
        />
      </View>

      {/* -------- Password Input with show/hide toggle -------- */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordRow}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Create a password"
            placeholderTextColor="#94A3B8"
            value={password}
            onChangeText={onPasswordChange}
            secureTextEntry={!passwordVisible}
            autoCapitalize="none"
          />
          <TouchableOpacity
            onPress={() => setPasswordVisible(!passwordVisible)}
            style={styles.eyeButton}
            activeOpacity={0.7}
          >
            <FontAwesome6
              name={passwordVisible ? "eye-slash" : "eye"}
              size={18}
              color="#64748B"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* -------- Terms & Privacy Checkbox -------- */}
      {/* User must check this before the "Sign Up" button becomes active */}
      <TouchableOpacity
        style={styles.termsRow}
        onPress={() => onAgreeChange(!agreedToTerms)}
        activeOpacity={0.7}
      >
        <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
          {agreedToTerms && (
            <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />
          )}
        </View>
        <Text style={styles.terms}>
          By tapping sign up you agree to our{" "}
          <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
          <Text style={styles.termsLink}>Privacy Policy</Text>.
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// STYLES

const styles = StyleSheet.create({
  // ScrollView wrapper — allows the form to scroll when keyboard is open
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },

  // Header text
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

  // Shared input group spacing
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    fontFamily: "Inter",
    marginBottom: 8,
  },

  // Standard text input (used for name and email)
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

  // Username input — row with @ prefix
  usernameRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 16,
  },
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

  // Password input — row with eye toggle button
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
  eyeButton: {
    padding: 8,
  },

  // Terms checkbox row
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginTop: 8,
  },
  // Checkbox — toggles between grey border (unchecked) and red filled (checked)
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
    backgroundColor: "#FF2800",
    borderColor: "#FF2800",
  },
  // Terms text — links are bolded in dark color
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
