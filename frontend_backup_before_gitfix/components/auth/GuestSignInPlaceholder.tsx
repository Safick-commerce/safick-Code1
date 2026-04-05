import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

type Props = {
  /** Short line under the title (e.g. why sign-in is needed). */
  subtitle?: string;
};

/**
 * Full-screen placeholder for tabs that require an account while keeping the tab visible in the bar.
 */
export function GuestSignInPlaceholder({ subtitle }: Props) {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.root} edges={["top", "left", "right"]} accessibilityRole="none">
      <View style={styles.center}>
        <Text style={styles.title}>Sign in to continue</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        <TouchableOpacity
          style={styles.primary}
          onPress={() => router.push("/screens/loginscreens/signinscreen")}
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityLabel="Sign in"
        >
          <Text style={styles.primaryText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
  },
  primary: {
    marginTop: 28,
    minWidth: 200,
    backgroundColor: "#FF2800",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
