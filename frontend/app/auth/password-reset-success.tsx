import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLanguage } from "../../context/LanguageContext";

const RED = "#FF2800";

export default function PasswordResetSuccessScreen() {
  const { t } = useLanguage();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right", "bottom"]}>
      <View style={styles.container}>
        <View style={styles.iconCircle}>
          <MaterialIcons name="check" size={48} color="#FFFFFF" />
        </View>

        <Text style={styles.title}>{t("auth_reset_success_heading")}</Text>
        <Text style={styles.description}>{t("auth_reset_success_body")}</Text>

        <TouchableOpacity
          style={styles.primary}
          onPress={() => router.replace("/auth/signin")}
          activeOpacity={0.9}
        >
          <Text style={styles.primaryText}>{t("auth_reset_back_to_login")}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: RED,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 12,
    fontFamily: "PlayfairDisplay_800ExtraBold",
  },
  description: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 36,
    maxWidth: 320,
  },
  primary: {
    backgroundColor: RED,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    maxWidth: 320,
  },
  primaryText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
});
