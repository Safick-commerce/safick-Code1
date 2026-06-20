import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SkeletonBlock } from "./SkeletonBlock";

function UnboxTabSkeletonBody() {
  return (
    <>
      <View style={styles.header}>
        <SkeletonBlock style={styles.searchBar} />
        <SkeletonBlock style={styles.bell} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <SkeletonBlock style={styles.banner} />

        <SkeletonBlock style={styles.sectionTitle} />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.circleRow}
        >
          {Array.from({ length: 6 }, (_, i) => (
            <View key={i} style={styles.circleItem}>
              <SkeletonBlock style={styles.circle} />
              <SkeletonBlock style={styles.circleLabel} />
            </View>
          ))}
        </ScrollView>

        <View style={styles.grid}>
          {Array.from({ length: 4 }, (_, i) => (
            <SkeletonBlock key={i} style={styles.gridCard} />
          ))}
        </View>
      </ScrollView>
    </>
  );
}

type UnboxTabSkeletonProps = {
  overlay?: boolean;
};

export function UnboxTabSkeleton({ overlay = false }: UnboxTabSkeletonProps) {
  if (overlay) {
    return (
      <View style={[styles.container, styles.overlay]}>
        <UnboxTabSkeletonBody />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <UnboxTabSkeletonBody />
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
    gap: 4,
    paddingHorizontal: 6,
    paddingTop: 5,
    paddingBottom: 10,
  },
  searchBar: {
    flex: 1,
    height: 44,
    borderRadius: 9999,
  },
  bell: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  banner: {
    marginHorizontal: 12,
    height: 140,
    borderRadius: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    width: 100,
    height: 20,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  circleRow: {
    paddingHorizontal: 12,
    gap: 16,
    marginBottom: 20,
  },
  circleItem: {
    alignItems: "center",
    gap: 8,
  },
  circle: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  circleLabel: {
    width: 48,
    height: 10,
    borderRadius: 5,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    gap: 10,
  },
  gridCard: {
    width: "47%",
    aspectRatio: 0.75,
    borderRadius: 12,
  },
});
