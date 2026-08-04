import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useNotifications } from "../stores/notificationStore";
import type { NotificationRecord } from "../utils/notificationApi";

const RED = "#FF2800";

function formatNotificationTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  try {
    return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
}

function liveEventIdFromNotification(row: NotificationRecord): string | undefined {
  const data = row.data;
  if (!data || typeof data !== "object") return undefined;
  const id = (data as { liveEventId?: unknown }).liveEventId;
  return typeof id === "string" && id.trim() ? id : undefined;
}

function normalizeFromParam(raw: string | string[] | undefined): boolean {
  if (raw == null) return false;
  const v = Array.isArray(raw) ? raw[0] : raw;
  return v === "unbox";
}

export default function NotificationsScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { from } = useLocalSearchParams<{ from?: string | string[] }>();
  const fromUnbox = useMemo(() => normalizeFromParam(from), [from]);
 
  const {
    notifications,
    loading,
    refreshing,
    error,
    fetchNotifications,
    markRead,
    markAllRead,
  } = useNotifications();

  const [activeFilter, setActiveFilter] = useState("All");
  const [menuOpen, setMenuOpen] = useState(false);
  const [bannerText, setBannerText] = useState<string | null>(null);
  const bannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const screenTitle = fromUnbox ? t("notifications_live_alerts") : t("notifications_activity");

  const liveAlerts = useMemo(
    () => notifications.filter((n) => n.type === "SELLER_LIVE"),
    [notifications],
  );

  const visibleNotifications = useMemo(() => {
    if (fromUnbox) return liveAlerts;
    if (activeFilter === "Sellers") {
      return notifications.filter((n) => n.type === "SELLER_LIVE");
    }
    return notifications;
  }, [activeFilter, fromUnbox, liveAlerts, notifications]);

  const hasNotifications = visibleNotifications.length > 0;
  const allRead = notifications.length > 0 && notifications.every((n) => n.isRead);

  useEffect(() => {
    void fetchNotifications({ refresh: true });
  }, [fetchNotifications]);

  useEffect(() => {
    return () => {
      if (bannerTimer.current) clearTimeout(bannerTimer.current);
    };
  }, []);

  const showBanner = useCallback((text: string) => {
    if (bannerTimer.current) clearTimeout(bannerTimer.current);
    setBannerText(text);
    bannerTimer.current = setTimeout(() => {
      setBannerText(null);
    }, 4500);
  }, []);

  const dismissBanner = useCallback(() => {
    if (bannerTimer.current) clearTimeout(bannerTimer.current);
    setBannerText(null);
  }, []);

  const onNotificationPress = async (row: NotificationRecord) => {
    const liveId = row.type === "SELLER_LIVE" ? liveEventIdFromNotification(row) : undefined;
    if (!row.isRead) {
      await markRead(row.id);
    }
    if (!liveId) return;
    try {
      router.push({ pathname: "/watch-live", params: { liveId } });
    } catch (e) {
      console.error("[notifications] watch-live", e);
    }
  };

  const onRefresh = useCallback(() => {
    void fetchNotifications({ refresh: true });
  }, [fetchNotifications]);

  const onMarkAllAsRead = () => {
    setMenuOpen(false);
    if (allRead) return;
    void markAllRead();
    showBanner(t("notifications_marked_read"));
  };

  const onMuteForHour = () => {
    setMenuOpen(false);
    showBanner(t("notifications_muted"));
  };

  const onOpenSettings = () => {
    setMenuOpen(false);
    showBanner(t("notifications_settings_soon"));
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <View style={styles.leftSection}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} accessibilityRole="button" accessibilityLabel={t("common_go_back")}>
            <MaterialIcons name="keyboard-arrow-left" size={37} color="#000000" />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>{screenTitle}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.menuButton}
          accessibilityRole="button"
          accessibilityLabel={t("a11y_notification_options")}
          onPress={() => setMenuOpen(true)}
        >
          <Ionicons name="options-outline" size={28} color="#000000" />
        </TouchableOpacity>
      </View>

      {bannerText ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{bannerText}</Text>
          <View style={styles.bannerActions}>
            <TouchableOpacity onPress={dismissBanner} accessibilityRole="button" accessibilityLabel={t("common_dismiss")} hitSlop={8}>
              <Ionicons name="close" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {!fromUnbox ? (
        <View style={styles.filtersContainer}>
          <TouchableOpacity
            style={[styles.filterButton, activeFilter === "All" && styles.filterButtonActive]}
            onPress={() => setActiveFilter("All")}
          >
            <Text style={[styles.filterText, activeFilter === "All" && styles.filterTextActive]}>{t("common_all")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, activeFilter === "Sellers" && styles.filterButtonActive]}
            onPress={() => setActiveFilter("Sellers")}
          >
            <Text style={[styles.filterText, activeFilter === "Sellers" && styles.filterTextActive]}>{t("notifications_sellers")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, activeFilter === "Important" && styles.filterButtonActive]}
            onPress={() => setActiveFilter("Important")}
          >
            <Text style={[styles.filterText, activeFilter === "Important" && styles.filterTextActive]}>{t("notifications_important")}</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {loading && !refreshing && notifications.length === 0 ? (
        <View style={styles.content}>
          <ActivityIndicator size="large" color={RED} />
        </View>
      ) : error && notifications.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>{t("notifications_load_error")}</Text>
          <TouchableOpacity style={styles.resetBtn} onPress={onRefresh} accessibilityRole="button">
            <Text style={styles.resetBtnText}>{t("common_try_again")}</Text>
          </TouchableOpacity>
        </View>
      ) : !hasNotifications ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>{fromUnbox ? t("notifications_no_live") : t("notifications_empty_title")}</Text>
          <Text style={styles.emptySub}>{fromUnbox ? t("notifications_no_live_body") : t("notifications_empty_body")}</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.listScroll}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={RED} />}
        >
          {visibleNotifications.map((row) => {
            const liveId = row.type === "SELLER_LIVE" ? liveEventIdFromNotification(row) : undefined;
            const subtitle = row.body?.trim() || row.title;
            const time = formatNotificationTime(row.createdAt);
            return (
              <TouchableOpacity
                key={row.id}
                style={[styles.alertRow, row.isRead && styles.alertRowMuted]}
                onPress={() => void onNotificationPress(row)}
                activeOpacity={liveId ? 0.75 : 1}
                accessibilityRole="button"
                accessibilityLabel={`${row.title}. ${subtitle}. ${time}.`}
                accessibilityHint={liveId ? t("a11y_opens_live_viewer") : undefined}
              >
                <View style={styles.alertRowLeft}>
                  <View style={[styles.toneDot, row.type === "SELLER_LIVE" && styles.toneDotLive, !row.isRead && styles.toneDotUnread]} />
                  <View style={styles.alertTextWrap}>
                    <View style={styles.alertTitleRow}>
                      <Text style={[styles.alertTitle, !row.isRead && styles.alertTitleUnread]} numberOfLines={1}>
                        {row.title}
                      </Text>
                      {row.type === "SELLER_LIVE" ? (
                        <View style={styles.livePill}>
                          <Text style={styles.livePillText}>{t("common_live")}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.alertSubtitle} numberOfLines={2}>
                      {subtitle}
                    </Text>
                    <Text style={styles.alertTime}>{time}</Text>
                  </View>
                </View>
                {liveId ? <Ionicons name="chevron-forward" size={20} color="#94A3B8" /> : null}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
     {/* Menu dropdown*/}
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuOpen(false)}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[
              styles.menuCard,
              { top: insets.top + 52 },
            ]}
          >
            <Text style={styles.menuSectionLabel}>{t("common_actions")}</Text>
            <MenuActionRow
              iconName="checkmark-done-outline"
              label={t("notifications_mark_all")}
              onPress={onMarkAllAsRead}
              disabled={allRead}
            />
            <MenuActionRow
              iconName="notifications-off-outline"
              label={t("notifications_mute_hour")}
              onPress={onMuteForHour}
            />
            <MenuActionRow
              iconName="settings-outline"
              label={t("notifications_settings")}
              onPress={onOpenSettings}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

function MenuActionRow({
  iconName,
  label,
  onPress,
  disabled,
}: {
  iconName: IoniconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.menuRow, disabled && styles.menuRowDisabled]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
    >
      <View style={styles.menuRowLeft}>
        <Ionicons name={iconName} size={18} color={disabled ? "#94A3B8" : "#111827"} />
        <Text style={[styles.menuRowLabel, disabled && styles.menuRowLabelDisabled]}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000000",
  },
  menuButton: {
    padding: 8,
    position: "relative",
  },
  menuDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: RED,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#000000",
    marginHorizontal: 12,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  bannerText: {
    color: "#F8FAFC",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  bannerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  bannerUndoText: {
    color: "#FCA5A5",
    fontSize: 14,
    fontWeight: "700",
  },
  filtersContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterButtonActive: {
    backgroundColor: "#000000",
    borderColor: "#000000",
  },
  filterText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000000",
  },
  filterTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  placeholderText: {
    color: "#64748B",
    textAlign: "center",
    fontSize: 16,
    lineHeight: 22,
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  emptySub: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 8,
    marginTop: 4,
  },
  resetBtn: {
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#111827",
  },
  resetBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  listScroll: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 8,
    paddingBottom: 32,
  },
  alertRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F1F5F9",
  },
  alertRowMuted: {
    opacity: 0.55,
  },
  alertRowLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  toneDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
    backgroundColor: "#CBD5E1",
  },
  toneDotLive: {
    backgroundColor: RED,
  },
  toneDotUnread: {
    backgroundColor: RED,
  },
  toneDotSoon: {
    backgroundColor: "#F59E0B",
  },
  toneDotReplay: {
    backgroundColor: "#6366F1",
  },
  alertTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  alertTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    flexShrink: 1,
  },
  alertTitleUnread: {
    color: "#000000",
  },
  livePill: {
    backgroundColor: RED,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  livePillText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  alertSubtitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 4,
    lineHeight: 20,
  },
  alertTime: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
    marginTop: 6,
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  menuCard: {
    position: "absolute",
    right: 12,
    width: 260,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 6,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E7EB",
  },
  menuSectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.7,
    textTransform: "uppercase",
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 4,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
  },
  menuRowDisabled: {
    opacity: 0.5,
  },
  menuRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  menuRowLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  menuRowLabelDisabled: {
    color: "#94A3B8",
  },
  menuLinkRow: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  menuLinkText: {
    fontSize: 13,
    fontWeight: "700",
    color: RED,
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E5E7EB",
    marginVertical: 6,
    marginHorizontal: 6,
  },
});
