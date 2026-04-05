import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface FollowingTabProps {
  onDiscoverPress?: () => void;
}

export default function FollowingTab({ onDiscoverPress }: FollowingTabProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>

        <Text style={styles.title}>No posts yet</Text>
        <Text style={styles.subtitle}>
          Follow sellers to see their latest{"\n"}products and deals here
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={onDiscoverPress}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Discover Sellers</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: "#FAFAFA",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 40,
  },
  iconOuter: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: "#FFF1F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  iconInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "Inter",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "400",
    lineHeight: 22,
    color: "#6B7280",
    fontFamily: "Inter",
    textAlign: "center",
    marginBottom: 28,
  },
  button: {
    backgroundColor: "#FF2800",
    paddingHorizontal: 32,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    fontFamily: "Inter",
  },
});
