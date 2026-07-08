import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLanguage } from "../context/LanguageContext";
import type { Locale } from "../i18n";

const OPTIONS: { locale: Locale; labelKey: "language_english" | "language_french" }[] = [
  { locale: "en", labelKey: "language_english" },
  { locale: "fr", labelKey: "language_french" },
];

export default function LanguageScreen() {
  const router = useRouter();
  const { locale, setLocale, t } = useLanguage();

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel={t("common_back")}
        >
          <Ionicons name="chevron-back" size={26} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>{t("language_title")}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Text style={styles.hint}>{t("language_screen_hint")}</Text>

      <View style={styles.list}>
        {OPTIONS.map((option) => {
          const selected = locale === option.locale;
          return (
            <Pressable
              key={option.locale}
              style={styles.row}
              onPress={() => void setLocale(option.locale)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Text style={styles.rowLabel}>{t(option.labelKey)}</Text>
              {selected ? (
                <Ionicons name="checkmark" size={24} color="#FF2800" />
              ) : (
                <View style={styles.checkPlaceholder} />
              )}
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  backBtn: { padding: 6 },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "600",
    color: "#111827",
  },
  headerSpacer: { width: 38 },
  hint: {
    marginTop: 16,
    marginHorizontal: 20,
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  list: {
    marginTop: 8,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  rowLabel: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "500",
  },
  checkPlaceholder: { width: 24, height: 24 },
});
