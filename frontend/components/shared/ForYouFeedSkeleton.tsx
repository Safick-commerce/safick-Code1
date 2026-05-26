import { Dimensions, StyleSheet, View } from "react-native";
import { SkeletonBlock } from "./SkeletonBlock";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export function ForYouFeedSkeleton() {
  return (
    <View style={styles.container}>
      <SkeletonBlock style={styles.background} />

      <View style={styles.header}>
        <SkeletonBlock style={styles.avatar} />
        <View style={styles.headerText}>
          <SkeletonBlock style={styles.nameLine} />
          <SkeletonBlock style={styles.locationLine} />
        </View>
        <SkeletonBlock style={styles.followButton} />
      </View>

      <SkeletonBlock style={styles.productCard} />

      <View style={styles.description}>
        <SkeletonBlock style={styles.descLine} />
        <SkeletonBlock style={styles.descLineShort} />
      </View>

      <View style={styles.sideIcons}>
        {[0, 1, 2, 3].map((i) => (
          <SkeletonBlock key={i} style={styles.sideIcon} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    flex: 1,
    backgroundColor: "#111827",
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#374151",
  },
  header: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 100,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#4B5563",
  },
  headerText: {
    flex: 1,
    gap: 8,
  },
  nameLine: {
    width: 120,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#4B5563",
  },
  locationLine: {
    width: 90,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4B5563",
  },
  followButton: {
    width: 88,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#4B5563",
  },
  productCard: {
    position: "absolute",
    left: 10,
    right: 200,
    bottom: 60,
    height: 70,
    borderRadius: 16,
    backgroundColor: "#4B5563",
  },
  description: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 80,
    gap: 8,
  },
  descLine: {
    width: "100%",
    height: 14,
    borderRadius: 7,
    backgroundColor: "#4B5563",
  },
  descLineShort: {
    width: "70%",
    height: 14,
    borderRadius: 7,
    backgroundColor: "#4B5563",
  },
  sideIcons: {
    position: "absolute",
    right: 12,
    bottom: SCREEN_HEIGHT * 0.1,
    gap: 20,
    alignItems: "center",
  },
  sideIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4B5563",
  },
});
