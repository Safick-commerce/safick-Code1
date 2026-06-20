import { ScrollView, StyleSheet, View } from "react-native";
import { SkeletonBlock } from "./SkeletonBlock";

/** Placeholder while the persisted cart hydrates from AsyncStorage. */
export function CartListSkeleton() {
  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {[0, 1].map((key) => (
        <View key={key} style={styles.group}>
          <View style={styles.itemRow}>
            <SkeletonBlock style={styles.image} />
            <View style={styles.info}>
              <SkeletonBlock style={styles.title} />
              <SkeletonBlock style={styles.soldBy} />
              <SkeletonBlock style={styles.description} />
              <SkeletonBlock style={styles.price} />
              <SkeletonBlock style={styles.stepper} />
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 140,
    gap: 14,
  },
  group: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  itemRow: {
    flexDirection: "row",
    gap: 12,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  info: {
    flex: 1,
    gap: 8,
  },
  title: {
    height: 16,
    width: "90%",
    borderRadius: 4,
  },
  soldBy: {
    height: 12,
    width: "55%",
    borderRadius: 4,
  },
  description: {
    height: 12,
    width: "80%",
    borderRadius: 4,
  },
  price: {
    height: 14,
    width: "35%",
    borderRadius: 4,
  },
  stepper: {
    height: 28,
    width: "50%",
    borderRadius: 14,
  },
});
