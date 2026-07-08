import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { type Href, useRouter } from "expo-router";
import { useLanguage } from "../../context/LanguageContext";

type Props = {
  /** Short line under the title (e.g. why sign-in is needed). */
  subtitle?: string;
  /** Screen or tab to return to when the user taps back on sign-in. */
  redirectTo: string;
};

/**
 * Full-screen placeholder for tabs that require an account while keeping the tab visible in the bar.
 */
export function GuestSignInPlaceholder({ subtitle, redirectTo }: Props) {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <SafeAreaView style={styles.root} edges={["top", "left", "right"]} accessibilityRole="none">
      <View style={styles.center}>
        <Text style={styles.title}>{t("guest_title")}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        <TouchableOpacity
          style={styles.primary}
          onPress={() =>
            router.push({
              pathname: "/auth/signin",
              params: { redirectTo },
            } as Href)
          }
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityLabel={t("guest_sign_in")}
        >
          <Text style={styles.primaryText}>{t("guest_sign_in")}</Text>
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
