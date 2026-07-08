import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  FlatList,
  Modal,
  Pressable,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import type { ComponentProps } from "react";
import type { MessageItemData } from "../stores/messageStore";
import { listConversations, type ConversationSummary } from "../utils/conversationApi";
import { primeConversationBootstrap } from "../utils/conversationBootstrapCache";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { syncConversationRooms, subscribeToMessages } from "../lib/socket";
import { ProfileAvatar } from "../components/shared/ProfileAvatar";
import { useLanguage } from "../context/LanguageContext";

const STATUS_COLORS: Record<string, string> = {
  online: "#22C55E",
  away: "#EAB308",
  offline: "#9CA3AF",
};

type IoniconName = ComponentProps<typeof Ionicons>["name"];

function MenuActionRow({
  iconName,
  label,
  onPress,
}: {
  iconName: IoniconName;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} accessibilityRole="button">
      <View style={styles.menuRowLeft}>
        <Ionicons name={iconName} size={18} color="#111827" />
        <Text style={styles.menuRowLabel}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function MessageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { isAuthenticated, isReady, user, profile } = useAuth();
  const { isConnected } = useSocket();
  const [apiConversations, setApiConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "reservation">("all");
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const selectedCount = selectedIds.size;

  /** A constant used for the Reservation filter */
  const currentUserId = user?.id ?? null;

  const canViewReservations = useMemo(() => {
    /** Sellers can always view reservations */
    if (profile?.role === "seller") return true;
    if (!currentUserId) return false;
    return apiConversations.some((c) => c.sellerId === currentUserId);
  }, [apiConversations, currentUserId, profile?.role]);

  useEffect(() => {
    if (!canViewReservations && filter === "reservation") {
      setFilter("all");
    }
  }, [canViewReservations, filter]);

  const loadConversations = useCallback(async () => {
    if (!isReady || !isAuthenticated) {
      setApiConversations([]);
      return;
    }
    setLoading(true);
    setFetchError(null);
    try {
      const rows = await listConversations();
      setApiConversations(rows);
      if (isConnected) {
        void syncConversationRooms(rows.map((c) => c.id));
      }
    } catch (error) {
      setFetchError(error instanceof Error ? error.message : t("messages_load_error"));
    } finally {
      setLoading(false);
    }
  }, [isReady, isAuthenticated, isConnected, t]);

  const loadConversationsRef = useRef(loadConversations);
  loadConversationsRef.current = loadConversations;

  useFocusEffect(
    useCallback(() => {
      void loadConversations();
    }, [loadConversations]),
  );

  useEffect(() => {
    if (!isConnected || apiConversations.length === 0) return;
    void syncConversationRooms(apiConversations.map((c) => c.id));
  }, [isConnected, apiConversations]);

  useEffect(() => {
    return subscribeToMessages((payload) => {
      if (payload.roomType !== "conversation") return;
      setApiConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === payload.roomId);
        if (idx === -1) {
          void loadConversationsRef.current();
          return prev;
        }
        const updated = {
          ...prev[idx],
          lastMessage: {
            body: payload.text,
            createdAt: payload.createdAt,
            senderId: payload.senderId,
          },
          lastMessageAt: payload.createdAt,
        };
        const next = [...prev];
        next.splice(idx, 1);
        return [updated, ...next];
      });
    });
  }, []);

  const conversationRows = useMemo((): MessageItemData[] => {
    return apiConversations.map((c) => ({
      id: c.id,
      isReservation: Boolean(currentUserId && c.sellerId === currentUserId),
      seller: {
        name: c.peer.displayName,
        message: c.lastMessage?.body ?? t("messages_about_listing", { title: c.productTitle }),
        avatarUrl: c.peer.avatarUrl,
        status: "online" as const,
      },
    }));
  }, [apiConversations, currentUserId, t]);

  const displayItems = conversationRows;

  const filteredConversations = useMemo(() => {
    let list = displayItems;
    if (filter === "reservation") {
      list = list.filter((item) => item.isReservation);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((item) => item.seller.name.toLowerCase().includes(q));
    }
    return list;
  }, [displayItems, filter, searchQuery]);

  /** The title and subtitle of the empty state */
  const emptyTitle =
    filter === "reservation" ? t("messages_no_reservations") : t("messages_no_messages");
  const emptySubtitle =
    filter === "reservation" ? t("messages_reservation_hint") : t("messages_empty_hint");

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  const onOpenSelectFromMenu = useCallback(() => {
    setMenuOpen(false);
    setSelectionMode(true);
  }, []);

  const toggleRowSelected = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleConversationPress = useCallback(
    (conversation: MessageItemData) => {
      if (selectionMode) {
        toggleRowSelected(conversation.id);
        return;
      }
      const summary = apiConversations.find((c) => c.id === conversation.id);
      if (summary) {
        primeConversationBootstrap(summary.id, { conversation: summary, messages: [] });
      }
      router.push({
        pathname: "/usermessage",
        params: { conversationId: conversation.id, origin: "inbox" },
      });
    },
    [router, selectionMode, toggleRowSelected, apiConversations],
  );

  const renderConversation = useCallback(
    ({ item }: { item: MessageItemData }) => {
      const isSelected = selectedIds.has(item.id);
      return (
        <TouchableOpacity
          style={styles.conversationItem}
          onPress={() => handleConversationPress(item)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={
            isSelected
              ? t("a11y_conversation_selected", { name: item.seller.name })
              : t("a11y_conversation_not_selected", { name: item.seller.name })
          }
          accessibilityHint={selectionMode ? t("a11y_toggle_selection") : t("a11y_opens_conversation")}
        >
          {selectionMode ? (
            <View style={styles.selectIndicator}>
              <Ionicons
                name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                size={24}
                color={isSelected ? "#000000" : "#9CA3AF"}
              />
            </View>
          ) : null}

          <View style={styles.avatarContainer}>
            <ProfileAvatar uri={item.seller.avatarUrl} size={48} style={styles.avatar} />
            <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[item.seller.status] }]} />
          </View>

          {/* Conversation details */}
          <View style={styles.conversationDetails}>
            <View style={styles.nameRow}>
              <Text style={styles.sellerName} numberOfLines={1}>
                {item.seller.name}
              </Text>
            </View>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.seller.message}
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    [handleConversationPress, selectionMode, selectedIds]
  );

  const separatorMarginLeft = selectionMode ? 120 : 84;

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <View style={styles.leftSection}>
          {selectionMode ? (
            <TouchableOpacity onPress={exitSelectionMode} style={styles.cancelHeaderButton} accessibilityRole="button" accessibilityLabel={t("a11y_cancel_selection")}>
              <Text style={styles.cancelHeaderText}>{t("common_cancel")}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton} accessibilityRole="button" accessibilityLabel={t("common_go_back")}>
              <MaterialIcons name="keyboard-arrow-left" size={37} color="#000000" />
            </TouchableOpacity>
          )}
          <View style={styles.titleBlock}>
            <Text style={styles.title} numberOfLines={1}>
              {selectionMode
                ? selectedCount > 0
                  ? t("messages_selected", { count: selectedCount })
                  : t("messages_select")
                : t("messages_title")}
            </Text>
          </View>
        </View>
        {!selectionMode ? (
          <TouchableOpacity
            style={styles.menuButton}
            accessibilityRole="button"
            accessibilityLabel={t("a11y_message_options")}
            onPress={() => setMenuOpen(true)}
          >
            <Ionicons name="ellipsis-vertical" size={24} color="#000000" />
          </TouchableOpacity>
        ) : (
          <View style={styles.menuButtonPlaceholder} />
        )}
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder={t("messages_search")}
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 ? (
          <TouchableOpacity onPress={() => setSearchQuery("")} accessibilityRole="button" accessibilityLabel={t("common_clear_search")}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter buttons — Reservation tab is seller-only */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterButton, filter === "all" && styles.filterButtonActive]}
          onPress={() => setFilter("all")}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterButtonText, filter === "all" && styles.filterButtonTextActive]}>{t("common_all")}</Text>
        </TouchableOpacity>
        {canViewReservations ? (
          <TouchableOpacity
            style={[styles.filterButton, filter === "reservation" && styles.filterButtonActive]}
            onPress={() => setFilter("reservation")}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterButtonText, filter === "reservation" && styles.filterButtonTextActive]}>
              {t("messages_reservation")}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Conversation list or empty state */}
      {loading && displayItems.length === 0 ? (
        <View style={styles.emptyContainer}>
        </View>
      ) : fetchError && displayItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>{t("messages_load_error")}</Text>
          <Text style={styles.emptySubtitle}>{fetchError}</Text>
          <TouchableOpacity style={styles.findButton} onPress={() => void loadConversations()}>
            <Text style={styles.findButtonText}>{t("common_try_again")}</Text>
          </TouchableOpacity>
        </View>
      ) : filteredConversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>{emptyTitle}</Text>
          <Text style={styles.emptySubtitle}>{emptySubtitle}</Text>
          <TouchableOpacity style={styles.findButton} onPress={() => router.push("/golive")}>
            <Text style={styles.findButtonText}>{t("messages_start_live")}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          extraData={{ selectionMode, sel: selectedCount }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={[styles.separator, { marginLeft: separatorMarginLeft }]} />}
          refreshing={loading}
          onRefresh={() => void loadConversations()}
        />
      )}

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuOpen(false)}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[styles.menuCard, { top: insets.top + 52 }]}
          >
            <Text style={styles.menuSectionLabel}>{t("common_actions")}</Text>
            <MenuActionRow iconName="checkbox-outline" label={t("messages_select_conversations")} onPress={onOpenSelectFromMenu} />
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
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
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  backButton: {
    padding: 4,
  },
  cancelHeaderButton: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  cancelHeaderText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111827",
  },
  menuButton: {
    padding: 4,
  },
  menuButtonPlaceholder: {
    width: 32,
    height: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000000",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#000000",
    padding: 0,
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 15,
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
  filterButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000000",
  },
  filterButtonTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  listContent: {
    paddingBottom: 20,
  },
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  selectIndicator: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E5E7EB",
  },
  statusDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2.5,
    borderColor: "#ffffff",
  },
  conversationDetails: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sellerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    flex: 1,
    marginRight: 8,
  },
  timestamp: {
    fontSize: 13,
    color: "#9CA3AF",
  },
  lastMessage: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  lastMessageUnread: {
    color: "#000000",
    fontWeight: "500",
  },
  tagsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  productTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  productTagText: {
    fontSize: 12,
    color: "#6B7280",
    maxWidth: 120,
  },
  dealBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dealBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  unreadBadge: {
    backgroundColor: "#FF2800",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  unreadBadgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  separator: {
    height: 1,
    backgroundColor: "#F3F4F6",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    fontFamily: "Inter",
    marginTop: 8,
  },
  findButton: {
    backgroundColor: "#FF2800",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 28,
    marginTop: 24,
  },
  findButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter",
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
});
