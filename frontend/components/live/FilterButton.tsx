import { Text, TouchableOpacity, View, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CategoryFilter } from "../../types";

const CATEGORY_ICONS: Record<CategoryFilter, React.ComponentProps<typeof MaterialCommunityIcons>["name"]> = {
  New: "newspaper-variant-outline",
  Sale: "tag-outline",
  Trending: "star-outline",
  Best: "trophy-outline",
  Limited: "timer-outline",
};

interface FilterButtonProps {
  label: CategoryFilter;
  isActive: boolean;
  onPress: () => void;
}

export default function FilterButton({ label, isActive, onPress }: FilterButtonProps) {
  const iconName = CATEGORY_ICONS[label];

  return (
    <TouchableOpacity
      style={styles.wrapper}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel={`${label} filter`}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
    >
      <View style={[styles.circle, isActive && styles.circleActive]}>
        <MaterialCommunityIcons
          name={iconName}
          size={24}
          color={isActive ? "#FF2800" : "#6B7280"}
        />
      </View>
      <Text style={[styles.label, isActive && styles.labelActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const CIRCLE_SIZE = 64;

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    width: 78,
    height: 100,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  circleActive: {
    borderColor: "#FF2800",
    backgroundColor: "#F3F4F6",
  },
  label: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "800",
    color: "#6B7280",
    textAlign: "center",
  },
  labelActive: {
    color: "#111827",
    fontWeight: "600",
  },
});
