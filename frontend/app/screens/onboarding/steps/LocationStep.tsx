// Onboarding Step 3: Exact location input
// Users type their current location manually

import { useMemo } from "react";
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CAMEROON_CITIES } from "../../../../data/cameroonCities";
import { useLanguage } from "../../../../context/LanguageContext";

const RED = "#FF2800";

interface LocationStepProps {
  city: string;
  onCityChange: (city: string) => void;
}

export default function LocationStep({ city, onCityChange }: LocationStepProps) {
  const { t } = useLanguage();
  const normalizedQuery = city.trim().toLowerCase();

  const filteredCities = useMemo(() => {
    if (!normalizedQuery) return [];
    return CAMEROON_CITIES.filter((c) => c.toLowerCase().includes(normalizedQuery)).slice(0, 10);
  }, [normalizedQuery]);

  return (
    <View style={styles.container}>
      {/* -------- Header -------- */}
      <Text style={styles.heading}>{t("location_heading")}</Text>
      <Text style={styles.subheading}>
        {t("location_subheading")}
      </Text>

      {/* -------- Search Input -------- */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#9CA3AF" />
        <TextInput
          value={city}
          onChangeText={onCityChange}
          placeholder={t("location_placeholder")}
          placeholderTextColor="#9CA3AF"
          autoCapitalize="words"
          style={styles.searchInput}
        />
      </View>

      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
      >
        {filteredCities.map((c) => {
          const isSelected = city === c;
          return (
            <TouchableOpacity
              key={c}
              style={[styles.cityRow, isSelected && styles.cityRowSelected]}
              onPress={() => onCityChange(c)}
              activeOpacity={0.7}
            >
              <Ionicons name="location-outline" size={18} color={isSelected ? RED : "#6B7280"} />
              <Text style={[styles.cityText, isSelected && styles.cityTextSelected]}>{c}</Text>
              {isSelected && <Ionicons name="checkmark-circle" size={20} color={RED} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
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
    marginBottom: 16,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
    marginBottom: 14,
    backgroundColor: "#FFFFFF",
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
    fontFamily: "Inter",
    paddingVertical: 0,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 16,
  },
  cityRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 10,
    marginBottom: 6,
  },
  cityRowSelected: {
    backgroundColor: "#FFF1F0",
  },
  cityText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: "#374151",
    fontFamily: "Inter",
  },
  cityTextSelected: {
    color: RED,
    fontWeight: "600",
  },
});
