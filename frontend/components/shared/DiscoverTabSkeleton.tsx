import { Dimensions, ScrollView, StyleSheet, View } from "react-native";
import { SkeletonBlock } from "./SkeletonBlock";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const CONTENT_PADDING = 1;
const CARD_GAP = 6;
const CARD_WIDTH = (SCREEN_WIDTH - CONTENT_PADDING * 2 - CARD_GAP) / 2;
const IMAGE_HEIGHT = Math.round(SCREEN_HEIGHT * 0.36);

export function DiscoverTabSkeleton() {
  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.circleRow}
        >
          {Array.from({ length: 7 }, (_, i) => (
            <View key={i} style={styles.circleItem}>
              <SkeletonBlock style={styles.circle} />
              <SkeletonBlock style={styles.circleLabel} />
            </View>
          ))}
        </ScrollView>

        <View style={styles.titleBlock}>
          <SkeletonBlock style={styles.titleLine} />
          <SkeletonBlock style={styles.subtitleLine} />
        </View>

        {Array.from({ length: 3 }, (_, rowIndex) => (
          <View key={rowIndex} style={styles.productRow}>
            <View style={styles.productCell}>
              <SkeletonBlock style={styles.productImage} />
              <SkeletonBlock style={styles.productName} />
              <SkeletonBlock style={styles.productPrice} />
            </View>
            <View style={styles.productCell}>
              <SkeletonBlock style={styles.productImage} />
              <SkeletonBlock style={styles.productName} />
              <SkeletonBlock style={styles.productPrice} />
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollContent: {
    paddingHorizontal: CONTENT_PADDING,
    paddingTop: 10,
    paddingBottom: 32,
  },
  circleRow: {
    paddingHorizontal: 5,
    gap: 16,
    marginBottom: 16,
  },
  circleItem: {
    alignItems: "center",
    gap: 8,
    maxWidth: 80,
  },
  circle: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  circleLabel: {
    width: 56,
    height: 10,
    borderRadius: 5,
  },
  titleBlock: {
    paddingHorizontal: 12,
    marginTop: 20,
    marginBottom: 12,
    gap: 8,
  },
  titleLine: {
    width: 130,
    height: 20,
    borderRadius: 8,
  },
  subtitleLine: {
    width: 180,
    height: 14,
    borderRadius: 6,
  },
  productRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    width: "100%",
  },
  productCell: {
    width: CARD_WIDTH,
    gap: 8,
  },
  productImage: {
    width: CARD_WIDTH,
    height: IMAGE_HEIGHT,
    borderRadius: 10,
  },
  productName: {
    width: "90%",
    height: 14,
    borderRadius: 6,
  },
  productPrice: {
    width: "55%",
    height: 16,
    borderRadius: 6,
  },
});
