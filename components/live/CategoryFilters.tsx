import { ScrollView, View, StyleSheet } from "react-native";
import FilterButton from "./FilterButton";
import { CategoryFilter } from "../../types";
import { memo } from "react";

interface CategoryFiltersProps {
  categories: readonly CategoryFilter[];
  activeCategory: CategoryFilter;
  onCategoryChange: (category: CategoryFilter) => void;
}

function CategoryFilters({ categories, activeCategory, onCategoryChange }: CategoryFiltersProps) {
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filtersContainer}
      style={styles.filtersScrollView}
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
  filtersScrollView: {
    maxHeight: 300,
    marginTop: 8,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 12,
    alignItems: 'center',
  },
});

export default memo(CategoryFilters);
