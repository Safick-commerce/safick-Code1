import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SkeletonBlock } from "./SkeletonBlock";

function CategoryCircleRow() {
  return (
    <View style={styles.circleRow}>
      {Array.from({ length: 3 }, (_, i) => (
        <View key={i} style={styles.circleItem}>
          <SkeletonBlock style={styles.circle} />
          <SkeletonBlock style={styles.circleLabel} />
        </View>
      ))}
    </View>
  );
}

/** Grid-only placeholder while the category layout finishes measuring. */
export function CategoriesGridSkeleton() {
  return (
    <View style={styles.gridSection}>
      {Array.from({ length: 6 }, (_, i) => (
        <CategoryCircleRow key={i} />
      ))}
    </View>
  );
}

function CategoriesTabSkeletonBody() {
  return (
    <>
      <View style={styles.header}>
        <SkeletonBlock style={styles.searchBar} />
        <SkeletonBlock style={styles.heartIcon} />
      </View>

      <View style={styles.titleSection}>
        <SkeletonBlock style={styles.titleLine} />
      </View>

      <View style={styles.gridSection}>
        {Array.from({ length: 6 }, (_, i) => (
          <CategoryCircleRow key={i} />
        ))}
      </View>
    </>
  );
}

type CategoriesTabSkeletonProps = {
  /** Render inside an existing screen (absolute overlay) without SafeAreaView. */
  overlay?: boolean;
};

export function CategoriesTabSkeleton({ overlay = false }: CategoriesTabSkeletonProps) {
  if (overlay) {
    return (
      <View style={[styles.container, styles.overlay]}>
        <CategoriesTabSkeletonBody />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <CategoriesTabSkeletonBody />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 6,
    paddingTop: 2,
  },
  searchBar: {
    flex: 1,
    height: 44,
    borderRadius: 9999,
  },
  heartIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  titleSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  titleLine: {
    width: 160,
    height: 20,
    borderRadius: 8,
  },
  gridSection: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 7,
  },
  circleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
    gap: 16,
  },
  circleItem: {
    flex: 1,
    alignItems: "center",
    gap: 10,
  },
  circle: {
    width: "85%",
    aspectRatio: 1,
    borderRadius: 9999,
    maxWidth: 110,
  },
  circleLabel: {
    width: "70%",
    height: 12,
    borderRadius: 6,
  },
});
