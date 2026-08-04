import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useLanguage } from "../../context/LanguageContext";
import { useNotifications } from "../../stores/notificationStore";

const RED = "#EF4444";

export function NotificationBellButton({
  onPress,
  style,
  iconColor = "#000000",
  iconSize = 30,
}: {
  onPress?: () => void;
  style?: object;
  iconColor?: string;
  iconSize?: number;
}) {
  const router = useRouter();
  const { t } = useLanguage();
  const unreadCount = useNotifications().unreadCount;

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    router.push("/notifications");
  };

  const badgeLabel =
    unreadCount > 99 ? "99+" : unreadCount > 0 ? String(unreadCount) : null;

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={t("a11y_notifications")}
    >
      <Ionicons name="notifications-outline" size={iconSize} color={iconColor} />
      {badgeLabel ? (
        <View style={styles.badge} accessibilityLabel={t("a11y_unread_notifications")}>
          <Text style={styles.badgeText}>{badgeLabel}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    backgroundColor: RED,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
});
