import { StyleSheet, View } from "react-native";
import { SkeletonBlock } from "./SkeletonBlock";

/** Skeleton for the live post card grid only (below Live Now + category filters). */
export function UnboxLiveGridSkeleton() {
  return (
    <View style={styles.grid}>
      {Array.from({ length: 4 }, (_, i) => (
        <SkeletonBlock key={i} style={styles.gridCard} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 10,
  },
  gridCard: {
    width: "47%",
    aspectRatio: 0.75,
    borderRadius: 12,
  },
});
