import { Dimensions, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SkeletonBlock } from "./SkeletonBlock";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export function ProductDetailsSkeleton() {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <SkeletonBlock style={styles.backIcon} />
        <View style={styles.headerActions}>
          <SkeletonBlock style={styles.headerIcon} />
          <SkeletonBlock style={styles.headerIcon} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <SkeletonBlock style={styles.heroImage} />

        <View style={styles.section}>
          <SkeletonBlock style={styles.titleLine} />
          <SkeletonBlock style={styles.titleLineShort} />
          <SkeletonBlock style={styles.priceLine} />

          <SkeletonBlock style={styles.stockLine} />

          <SkeletonBlock style={styles.sectionHeading} />
          <SkeletonBlock style={styles.bodyLine} />
          <SkeletonBlock style={styles.bodyLine} />
          <SkeletonBlock style={styles.bodyLineShort} />

          <SkeletonBlock style={styles.sectionHeading} />
          <SkeletonBlock style={styles.sellerCard} />
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <SkeletonBlock style={styles.saveButton} />
        <SkeletonBlock style={styles.messageButton} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E7EB",
  },
  backIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  headerActions: {
    flexDirection: "row",
    gap: 12,
  },
  headerIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  heroImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
  },
  section: {
    padding: 16,
    gap: 12,
  },
  titleLine: {
    width: "90%",
    height: 28,
    borderRadius: 8,
  },
  titleLineShort: {
    width: "55%",
    height: 28,
    borderRadius: 8,
  },
  priceLine: {
    width: 120,
    height: 24,
    borderRadius: 8,
    marginTop: 4,
  },
  stockLine: {
    width: 160,
    height: 18,
    borderRadius: 6,
    marginTop: 8,
  },
  sectionHeading: {
    width: 140,
    height: 20,
    borderRadius: 6,
    marginTop: 12,
  },
  bodyLine: {
    width: "100%",
    height: 14,
    borderRadius: 6,
  },
  bodyLineShort: {
    width: "75%",
    height: 14,
    borderRadius: 6,
  },
  sellerCard: {
    width: "100%",
    height: 120,
    borderRadius: 12,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingBottom: 16,
    paddingTop: 8,
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 0.5,
    borderTopColor: "#E5E7EB",
  },
  saveButton: {
    width: 120,
    height: 50,
    borderRadius: 28,
  },
  messageButton: {
    flex: 1,
    height: 50,
    borderRadius: 28,
  },
});
