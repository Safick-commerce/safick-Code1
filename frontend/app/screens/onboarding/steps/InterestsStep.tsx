// Onboarding Step 4: Interest selection
// Multi-select chip grid — user must pick at least MIN_SELECTIONS categories
// Used to personalize the product feed after onboarding
// Category data imported from data/interestCategories.ts

import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useLanguage } from "../../../../context/LanguageContext";
import { INTEREST_CATEGORIES } from "../../../../data/interestCategories";

const RED = "#FF2800";
const MIN_SELECTIONS = 2;

interface InterestsStepProps {
  interests: string[];
  onToggle: (label: string) => void;
}

export default function InterestsStep({ interests, onToggle }: InterestsStepProps) {
  const { t } = useLanguage();

  return (
    <View style={styles.container}>
      {/* -------- Header -------- */}
      <Text style={styles.heading}>{t("interests_heading")}</Text>
      <Text style={styles.subheading}>
        {t("interests_subheading", { min: MIN_SELECTIONS })}
      </Text>

      {/* -------- Category Chips -------- */}
      {/* Tapping toggles selection — active chips turn red with white text */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.grid}
      >
        {INTEREST_CATEGORIES.map((cat) => {
          const isActive = interests.includes(cat.label);
          return (
            <TouchableOpacity
              key={cat.label}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => onToggle(cat.label)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {t(cat.labelKey)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* -------- Selection Counter -------- */}
      {/* Shows how many are selected and how many more are needed */}
      <Text style={styles.counter}>
        {t("interests_counter", { count: interests.length })}
        {interests.length < MIN_SELECTIONS
          ? t("interests_pick_more", { remaining: MIN_SELECTIONS - interests.length })
          : ""}
      </Text>
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
    fontFamily: "Inter",
    marginBottom: 24,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingBottom: 16,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
  },
  chipActive: {
    backgroundColor: RED,
    borderColor: RED,
  },
  chipText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#374151",
    fontFamily: "Inter",
  },
  chipTextActive: {
    color: "#FFFFFF",
  },
  counter: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
    color: "#9CA3AF",
    fontFamily: "Inter",
    paddingVertical: 12,
  },
});
