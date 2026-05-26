import { StyleSheet, View } from "react-native";
import { SkeletonBlock } from "./SkeletonBlock";

type Props = {
  count?: number;
};

export function ProductGridSkeleton({ count = 6 }: Props) {
  return (
    <View style={styles.grid}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={styles.cell}>
          <SkeletonBlock style={styles.image} />
          <SkeletonBlock style={styles.title} />
          <SkeletonBlock style={styles.price} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 12,
    gap: 12,
  },
  cell: {
    width: "47%",
    gap: 8,
  },
  image: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 12,
  },
  title: {
    width: "85%",
    height: 14,
    borderRadius: 6,
  },
  price: {
    width: "50%",
    height: 16,
    borderRadius: 6,
  },
});
