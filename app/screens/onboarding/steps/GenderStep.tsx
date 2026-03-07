// Onboarding Step 2: Gender selection
// Single-select card list — tapping a card selects it and deselects the previous one
// Presentational component — state is managed by OnboardingScreen

import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const RED = "#FF2800";

// Gender options with Ionicons icon names
const GENDERS = [
  { value: "male", label: "Male" as const },
  { value: "female", label: "Female" as const },
  { value: "other", label: "Other" as const },
  { value: "prefer_not_to_say", label: "Prefer not to say" as const },
];

interface GenderStepProps {
  gender: string;
  onGenderChange: (value: string) => void;
}

export default function GenderStep({ gender, onGenderChange }: GenderStepProps) {
  return (
    <View style={styles.container}>
      {/* -------- Header -------- */}
      <Text style={styles.heading}>What's your gender?</Text>
      <Text style={styles.subheading}>This helps us personalize your experience</Text>

      {/* -------- Gender Option Cards -------- */}
      <View style={styles.options}>
        {GENDERS.map((g) => {
          const isSelected = gender === g.value;
          return (
            <TouchableOpacity
              key={g.value}
              style={[styles.option, isSelected && styles.optionSelected]}
              onPress={() => onGenderChange(g.value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                {g.label}
              </Text>
              {isSelected && (
                <Ionicons name="checkmark-circle" size={22} color={RED} style={styles.check} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
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
    fontFamily: "PlayfairDisplay_800ExtraBold",
    marginBottom: 32,
  },
  options: {
    gap: 12,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    gap: 14,
  },
  optionSelected: {
    borderColor: RED,
    backgroundColor: "#FFF1F0",
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
    fontFamily: "Inter",
  },
  optionTextSelected: {
    color: "#111827",
    fontWeight: "600",
  },
  check: {
    marginLeft: "auto",
  },
});
