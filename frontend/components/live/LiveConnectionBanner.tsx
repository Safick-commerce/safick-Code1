import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { LiveConnectionUiState } from "../../hooks/useLiveConnection";
import { useLanguage } from "../../context/LanguageContext";

type LiveConnectionBannerProps = {
  state: LiveConnectionUiState;
  onRetry?: () => void;
  retrying?: boolean;
};

export function LiveConnectionBanner({ state, onRetry, retrying }: LiveConnectionBannerProps) {
  const { t } = useLanguage();

  if (state === "connected") return null;

  const isReconnecting = state === "reconnecting";

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.banner}>
        {isReconnecting ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Ionicons name="cloud-offline-outline" size={18} color="#FFFFFF" />
        )}
        <Text style={styles.text}>
          {isReconnecting ? t("live_reconnecting") : t("live_connection_lost")}
        </Text>
        {!isReconnecting && onRetry ? (
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={onRetry}
            disabled={retrying}
            accessibilityRole="button"
            accessibilityLabel={t("live_retry_connection")}
          >
            {retrying ? (
              <ActivityIndicator size="small" color="#111827" />
            ) : (
              <Text style={styles.retryText}>{t("live_retry_connection")}</Text>
            )}
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: 110,
    left: 16,
    right: 16,
    zIndex: 20,
    alignItems: "center",
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(17,24,39,0.88)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: "100%",
  },
  text: { color: "#FFFFFF", fontSize: 13, fontWeight: "600", flexShrink: 1 },
  retryBtn: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 56,
    alignItems: "center",
  },
  retryText: { color: "#111827", fontSize: 12, fontWeight: "800" },
});
