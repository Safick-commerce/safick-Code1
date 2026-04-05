import { ScrollView, StyleSheet } from "react-native";
import FilterButton from "./FilterButton";
import { CategoryFilter } from "../../types";
import { memo } from "react";

interface CategoryFiltersProps {
  categories: readonly CategoryFilter[];
  activeCategory: CategoryFilter;
  onCategoryChange: (category: CategoryFilter) => void;
  showsHorizontalScrollIndicator?: boolean;
}

function CategoryFilters({
  categories,
  activeCategory,
  onCategoryChange,
  showsHorizontalScrollIndicator = true,
}: CategoryFiltersProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
      contentContainerStyle={styles.content}
      style={styles.scroll}
    >
      {categories.map((category) => (
        <FilterButton
          key={category}
          label={category}
          isActive={activeCategory === category}
          onPress={() => onCategoryChange(category)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    marginTop: 8,
  },
  content: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 14,
    gap: 8,
    alignItems: "flex-start",
  },
});

export default memo(CategoryFilters);
