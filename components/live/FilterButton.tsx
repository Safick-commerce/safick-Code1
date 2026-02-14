import { Text, TouchableOpacity, StyleSheet } from "react-native";
import { CategoryFilter } from "../../types";

interface FilterButtonProps {
  label: CategoryFilter;
  isActive: boolean;
  onPress: () => void;
}

export default function FilterButton({ label, isActive, onPress }: FilterButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.filterButton, isActive && styles.filterButtonActive]}
      onPress={onPress}
      accessibilityLabel={`${label} filter`}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
    >
      <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 25,
    borderRadius: 8.5,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 67,
  },
  filterButtonActive: {
    backgroundColor: '#FF2800',
    borderColor: '#000000',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
