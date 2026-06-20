import { StyleSheet, View } from "react-native";
import { SkeletonBlock } from "../shared/SkeletonBlock";

/** Placeholder for delivery / payment summary cards on checkout review. */
export function CheckoutSummaryCardSkeleton() {
  return (
    <View style={styles.card}>
      <SkeletonBlock style={styles.heading} />
      <SkeletonBlock style={styles.line} />
      <SkeletonBlock style={styles.lineShort} />
      <SkeletonBlock style={styles.lineMedium} />
      <SkeletonBlock style={styles.changeLink} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    gap: 8,
  },
  heading: {
    height: 16,
    width: "55%",
    borderRadius: 6,
  },
  line: {
    height: 13,
    width: "85%",
    borderRadius: 4,
  },
  lineShort: {
    height: 13,
    width: "60%",
    borderRadius: 4,
  },
  lineMedium: {
    height: 13,
    width: "40%",
    borderRadius: 4,
  },
  changeLink: {
    height: 13,
    width: 56,
    borderRadius: 4,
    marginTop: 2,
  },
});
