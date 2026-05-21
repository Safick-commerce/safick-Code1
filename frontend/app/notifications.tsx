import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Pressable,
  Switch,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const RED = "#FF2800";

type AlertTone = "live" | "soon" | "replay";

type UnboxAlert = {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  /** Opens watch-live when set (matches `MOCK_LIVE_POSTS.id`). */
  liveId?: string;
  tone: AlertTone;
};

/**
 * Live alerts feed. Empty until the real notifications/follow API is wired.
 * Shape kept here so the UI can render once data starts flowing.
 */
const UNBOX_ALERTS: UnboxAlert[] = [];

type AlertFilters = { live: boolean; soon: boolean; replay: boolean };
const DEFAULT_FILTERS: AlertFilters = { live: true, soon: true, replay: true };

function normalizeFromParam(raw: string | string[] | undefined): boolean {
  if (raw == null) return false;
  const v = Array.isArray(raw) ? raw[0] : raw;
  return v === "unbox";
}

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { from } = useLocalSearchParams<{ from?: string | string[] }>();
  const fromUnbox = useMemo(() => normalizeFromParam(from), [from]);
 
  const [activeFilter, setActiveFilter] = useState("All");
  const [menuOpen, setMenuOpen] = useState(false);
  const [filters, setFilters] = useState<AlertFilters>(DEFAULT_FILTERS);
  const [readAll, setReadAll] = useState(false);
  const [bannerText, setBannerText] = useState<string | null>(null);
  const [bannerUndo, setBannerUndo] = useState<(() => void) | null>(null);
  const bannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const screenTitle = fromUnbox ? "Live alerts" : "Activity";
  const hasActiveFilters = !filters.live || !filters.soon || !filters.replay;

  const visibleAlerts = useMemo(
    () => UNBOX_ALERTS.filter((row) => filters[row.tone]),
    [filters]
  );
  const hasAnyAlerts = UNBOX_ALERTS.length > 0;

  useEffect(() => {
    return () => {
      if (bannerTimer.current) clearTimeout(bannerTimer.current);
    };
  }, []);

  const showBanner = useCallback((text: string, undo?: () => void) => {
    if (bannerTimer.current) clearTimeout(bannerTimer.current);
    setBannerText(text);
    setBannerUndo(undo ? () => undo : null);
    bannerTimer.current = setTimeout(() => {
      setBannerText(null);
      setBannerUndo(null);
    }, 4500);
  }, []);

  const dismissBanner = useCallback(() => {
    if (bannerTimer.current) clearTimeout(bannerTimer.current);
    setBannerText(null);
    setBannerUndo(null);
  }, []);

  const onAlertPress = (row: UnboxAlert) => {
    if (!row.liveId) return;
    try {
      router.push({ pathname: "/watch-live", params: { liveId: row.liveId } });
    } catch (e) {
      console.error("[notifications] watch-live", e);
    }
  };

  const toggleFilter = (key: keyof AlertFilters) => {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const onMarkAllAsRead = () => {
    setMenuOpen(false);
    if (readAll) return;
    setReadAll(true);
    showBanner("Marked all as read", () => setReadAll(false));
  };

  const onMuteForHour = () => {
    setMenuOpen(false);
    showBanner("Alerts muted for 1 hour");
  };

  const onOpenSettings = () => {
    setMenuOpen(false);
    showBanner("Notification settings coming soon");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <View style={styles.leftSection}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Go back">
            <MaterialIcons name="keyboard-arrow-left" size={37} color="#000000" />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>{screenTitle}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.menuButton}
          accessibilityRole="button"
          accessibilityLabel="Notification options"
          onPress={() => setMenuOpen(true)}
        >
          <Ionicons name="options-outline" size={28} color="#000000" />
          {hasActiveFilters ? <View style={styles.menuDot} /> : null}
        </TouchableOpacity>
      </View>

      {bannerText ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{bannerText}</Text>
          <View style={styles.bannerActions}>
            {bannerUndo ? (
              <TouchableOpacity
                onPress={() => {
                  bannerUndo();
                  dismissBanner();
                }}
                accessibilityRole="button"
                accessibilityLabel="Undo"
                hitSlop={8}
              >
                <Text style={styles.bannerUndoText}>Undo</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity onPress={dismissBanner} accessibilityRole="button" accessibilityLabel="Dismiss" hitSlop={8}>
              <Ionicons name="close" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {!fromUnbox ? (
        <>
          <View style={styles.filtersContainer}>
            <TouchableOpacity
              style={[styles.filterButton, activeFilter === "All" && styles.filterButtonActive]}
              onPress={() => setActiveFilter("All")}
            >
              <Text style={[styles.filterText, activeFilter === "All" && styles.filterTextActive]}>All</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterButton, activeFilter === "Sellers" && styles.filterButtonActive]}
              onPress={() => setActiveFilter("Sellers")}
            >
              <Text style={[styles.filterText, activeFilter === "Sellers" && styles.filterTextActive]}>Sellers</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterButton, activeFilter === "Important" && styles.filterButtonActive]}
              onPress={() => setActiveFilter("Important")}
            >
              <Text style={[styles.filterText, activeFilter === "Important" && styles.filterTextActive]}>Important</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.placeholderText}>
              {readAll ? "You're all caught up." : "All notifications will appear here."}
            </Text>
          </View>
        </>
      ) : !hasAnyAlerts ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>No live alerts yet</Text>
          <Text style={styles.emptySub}>
            Follow sellers and we&apos;ll let you know when they go live, schedule a stream, or post a replay.
          </Text>
        </View>
      ) : visibleAlerts.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="filter-outline" size={36} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No alerts match these filters</Text>
          <TouchableOpacity style={styles.resetBtn} onPress={resetFilters} accessibilityRole="button">
            <Text style={styles.resetBtnText}>Reset filters</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.listScroll} contentContainerStyle={styles.listContent} keyboardShouldPersistTaps="handled">
          {visibleAlerts.map((row) => (
            <TouchableOpacity
              key={row.id}
              style={[styles.alertRow, (readAll || !row.liveId) && styles.alertRowMuted]}
              onPress={() => onAlertPress(row)}
              activeOpacity={row.liveId ? 0.75 : 1}
              disabled={!row.liveId}
              accessibilityRole="button"
              accessibilityLabel={`${row.title}. ${row.subtitle}. ${row.time}.`}
              accessibilityHint={row.liveId ? "Opens live viewer" : undefined}
            >
              <View style={styles.alertRowLeft}>
                <View
                  style={[
                    styles.toneDot,
                    row.tone === "live" && styles.toneDotLive,
                    row.tone === "soon" && styles.toneDotSoon,
                    row.tone === "replay" && styles.toneDotReplay,
                  ]}
                />
                <View style={styles.alertTextWrap}>
                  <View style={styles.alertTitleRow}>
                    <Text style={styles.alertTitle} numberOfLines={1}>
                      {row.title}
                    </Text>
                    {row.tone === "live" ? (
                      <View style={styles.livePill}>
                        <Text style={styles.livePillText}>LIVE</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.alertSubtitle} numberOfLines={2}>
                    {row.subtitle}
                  </Text>
                  <Text style={styles.alertTime}>{row.time}</Text>
                </View>
              </View>
              {row.liveId ? <Ionicons name="chevron-forward" size={20} color="#94A3B8" /> : null}
            </TouchableOpacity>
          ))}
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
            {fromUnbox ? (
              <>
                <Text style={styles.menuSectionLabel}>Filter</Text>
                <MenuToggleRow
                  iconName="radio-outline"
                  iconColor={RED}
                  label="Live now"
                  value={filters.live}
                  onToggle={() => toggleFilter("live")}
                />
                <MenuToggleRow
                  iconName="time-outline"
                  iconColor="#828282"
                  label="Scheduled"
                  value={filters.soon}
                  onToggle={() => toggleFilter("soon")}
                />
                <MenuToggleRow
                  iconName="play-circle-outline"
                  iconColor="#828282"
                  label="Replays"
                  value={filters.replay}
                  onToggle={() => toggleFilter("replay")}
                />
                {hasActiveFilters ? (
                  <TouchableOpacity onPress={resetFilters} style={styles.menuLinkRow} accessibilityRole="button">
                    <Text style={styles.menuLinkText}>Reset filters</Text>
                  </TouchableOpacity>
                ) : null}
                <View style={styles.menuDivider} />
              </>
            ) : null}

            <Text style={styles.menuSectionLabel}>Actions</Text>
            <MenuActionRow
              iconName="checkmark-done-outline"
              label="Mark all as read"
              onPress={onMarkAllAsRead}
              disabled={readAll}
            />
            <MenuActionRow
              iconName="notifications-off-outline"
              label="Mute alerts for 1 hour"
              onPress={onMuteForHour}
            />
            <MenuActionRow
              iconName="settings-outline"
              label="Notification settings"
              onPress={onOpenSettings}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

function MenuToggleRow({
  iconName,
  iconColor,
  label,
  value,
  onToggle,
}: {
  iconName: IoniconName;
  iconColor: string;
  label: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={styles.menuRow}>
      <View style={styles.menuRowLeft}>
        <Ionicons name={iconName} size={18} color={iconColor} />
        <Text style={styles.menuRowLabel}>{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: "#E5E7EB", true: "#FECACA" }}
        thumbColor={value ? RED : "#F8FAFC"}
        ios_backgroundColor="#E5E7EB"
      />
    </View>
  );
}

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
