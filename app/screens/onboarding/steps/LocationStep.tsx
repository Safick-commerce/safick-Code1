// Onboarding Step 3: Location selection
// Scrollable list of Cameroonian cities — tap to select, only one can be active
// City data imported from data/cameroonCities.ts

import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CAMEROON_CITIES } from "../../../../data/cameroonCities";

const RED = "#FF2800";

interface LocationStepProps {
  city: string;
  onCityChange: (city: string) => void;
}

export default function LocationStep({ city, onCityChange }: LocationStepProps) {
  return (
    <View style={styles.container}>
      {/* -------- Header -------- */}
      <Text style={styles.heading}>Where are you located?</Text>
      <Text style={styles.subheading}>
        This helps connect you with sellers nearby
      </Text>

      {/* -------- City List -------- */}
      {/* Each row: location icon | city name | checkmark (when selected) */}
      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {CAMEROON_CITIES.map((c) => {
          const isSelected = city === c;
          return (
            <TouchableOpacity
              key={c}
              style={[styles.cityRow, isSelected && styles.cityRowSelected]}
              onPress={() => onCityChange(c)}
              activeOpacity={0.7}
            >
              <Ionicons
                name="location-outline"
                size={20}
                color={isSelected ? RED : "#6B7280"}
              />
              <Text style={[styles.cityText, isSelected && styles.cityTextSelected]}>
                {c}
              </Text>
              {isSelected && (
                <Ionicons name="checkmark-circle" size={22} color={RED} style={styles.check} />
              )}
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
    fontFamily: "PlayfairDisplay_800ExtraBold",
    marginBottom: 24,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  cityRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 6,
    gap: 12,
  },
  cityRowSelected: {
    backgroundColor: "#FFF1F0",
  },
  cityText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
    fontFamily: "Inter",
  },
  cityTextSelected: {
    color: RED,
    fontWeight: "600",
  },
  check: {
    marginLeft: "auto",
  },
});
