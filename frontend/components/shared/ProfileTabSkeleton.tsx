import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SkeletonBlock } from "./SkeletonBlock";

export function ProfileTabSkeleton() {
  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <SkeletonBlock style={styles.avatar} />
        <View style={styles.headerText}>
          <SkeletonBlock style={styles.usernameLine} />
          <SkeletonBlock style={styles.viewProfileButton} />
        </View>
      </View>

      <View style={styles.content}>
        <SkeletonBlock style={styles.banner} />
        <SkeletonBlock style={styles.sectionTitle} />
        {Array.from({ length: 5 }, (_, i) => (
          <View key={i} style={styles.cardRow}>
            <SkeletonBlock style={styles.cardIcon} />
            <SkeletonBlock style={styles.cardLabel} />
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
    borderBottomWidth: 0.3,
    borderBottomColor: "#E5E7EB",
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  headerText: {
    flex: 1,
    gap: 10,
  },
  usernameLine: {
    width: "55%",
    height: 18,
    borderRadius: 8,
  },
  viewProfileButton: {
    width: 110,
    height: 32,
    borderRadius: 16,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  banner: {
    width: "100%",
    height: 140,
    borderRadius: 16,
  },
  sectionTitle: {
    width: 100,
    height: 14,
    borderRadius: 6,
    marginTop: 8,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 0.3,
    borderBottomColor: "#E5E7EB",
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  cardLabel: {
    flex: 1,
    height: 16,
    borderRadius: 6,
  },
});
