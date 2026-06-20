// =============================================================================
// /seller-orders — incoming orders the signed-in seller has to act on.
// =============================================================================
// One row per buyer order in any state. Tapping a row reveals the actions
// available for that state (Accept / Reject / Mark shipped / Mark delivered).
// All actions hit /api/seller/orders/:id/* which delegate to escrow.service
// for the actual state-machine transitions.
// =============================================================================

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  listSellerOrders,
  sellerAcceptOrder,
  sellerDeliverOrder,
  sellerRejectOrder,
  sellerShipOrder,
  type Order,
  type OrderStatus,
} from "../utils/checkoutApi";
import { formatPriceXaf } from "../utils/searchApi";

const PLACEHOLDER_IMAGE = require("../assets/images/clothes.jpg");

const FILTER_TABS: { key: "active" | "completed" | "all"; label: string }[] = [
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "all", label: "All" },
];

const ACTIVE_STATUSES: OrderStatus[] = [
  "funds_held",
  "seller_accepted",
  "in_transit",
  "delivered",
  "disputed",
];

const COMPLETED_STATUSES: OrderStatus[] = [
  "completed",
  "refunded",
  "cancelled",
  "seller_rejected",
];

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: "Awaiting payment",
  funds_held: "New — needs accept",
  seller_accepted: "Accepted",
  seller_rejected: "Rejected",
  in_transit: "Shipped",
  delivered: "Delivered — awaiting buyer",
  completed: "Completed",
  disputed: "Disputed",
  refunded: "Refunded",
  cancelled: "Cancelled",
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending_payment: "#6B7280",
  funds_held: "#FF2800",
  seller_accepted: "#0EA5E9",
  seller_rejected: "#B91C1C",
  in_transit: "#A16207",
  delivered: "#A16207",
  completed: "#10B981",
  disputed: "#B91C1C",
  refunded: "#B91C1C",
  cancelled: "#6B7280",
};

function imageSource(url: string | null | undefined) {
  const trimmed = url?.trim();
  return trimmed ? { uri: trimmed } : PLACEHOLDER_IMAGE;
}

export default function SellerOrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"active" | "completed" | "all">("active");

  const [actionOrder, setActionOrder] = useState<Order | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  const load = useCallback(
    async ({ pull }: { pull?: boolean } = {}) => {
      if (pull) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const rows = await listSellerOrders();
        setOrders(rows);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load orders.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    load();
  }, [load]);

  const visibleOrders = useMemo(() => {
    if (filter === "all") return orders;
    const allow = filter === "active" ? ACTIVE_STATUSES : COMPLETED_STATUSES;
    return orders.filter((o) => allow.includes(o.status));
  }, [orders, filter]);

  const runAction = useCallback(
    async (order: Order, action: "accept" | "reject" | "ship" | "deliver") => {
      setActionBusy(true);
      try {
        const fn =
          action === "accept"
            ? sellerAcceptOrder
            : action === "reject"
              ? sellerRejectOrder
              : action === "ship"
                ? sellerShipOrder
                : sellerDeliverOrder;
        const updated = await fn(order.id);
        setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
        setActionOrder(updated);
      } catch (e) {
        Alert.alert(
          "Action failed",
          e instanceof Error ? e.message : "Please try again.",
        );
      } finally {
        setActionBusy(false);
      }
    },
    [],
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="keyboard-arrow-left" size={32} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Selling</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.tabsRow}>
        {FILTER_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, filter === tab.key && styles.tabActive]}
            onPress={() => setFilter(tab.key)}
            activeOpacity={0.85}
          >
            <Text style={[styles.tabText, filter === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#FF2800" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => load()}>
            <Text style={styles.retryButtonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : visibleOrders.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>No orders here</Text>
          <Text style={styles.emptySubtitle}>
            {filter === "active"
              ? "New orders from buyers will show up here so you can accept and ship them."
              : filter === "completed"
                ? "Completed and closed orders will appear here."
                : "When buyers pay for your listings, you'll see the orders here."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={visibleOrders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load({ pull: true })}
              tintColor="#FF2800"
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.orderCard}
              onPress={() => setActionOrder(item)}
              activeOpacity={0.85}
            >
              <View style={styles.orderHeader}>
                <Ionicons name="receipt-outline" size={16} color="#374151" />
                <Text style={styles.orderId}>Order #{item.id.slice(0, 8)}</Text>
                <View
                  style={[styles.statusPill, { backgroundColor: `${STATUS_COLOR[item.status]}20` }]}
                >
                  <Text style={[styles.statusText, { color: STATUS_COLOR[item.status] }]}>
                    {STATUS_LABEL[item.status]}
                  </Text>
                </View>
              </View>
              <View style={styles.itemsPreview}>
                {item.items.slice(0, 3).map((line) => (
                  <Image
                    key={line.id}
                    source={imageSource(line.imageUrl)}
                    style={styles.itemThumb}
                  />
                ))}
                {item.items.length > 3 ? (
                  <View style={styles.moreCount}>
                    <Text style={styles.moreCountText}>+{item.items.length - 3}</Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.orderFooter}>
                <Text style={styles.orderTotal}>{formatPriceXaf(item.subtotalXaf)}</Text>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <Modal visible={actionOrder !== null} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {actionOrder ? (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    Order #{actionOrder.id.slice(0, 8)}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setActionOrder(null)}
                    disabled={actionBusy}
                  >
                    <Ionicons name="close" size={26} color="#374151" />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.statusText, { color: STATUS_COLOR[actionOrder.status], marginBottom: 8 }]}>
                  {STATUS_LABEL[actionOrder.status]}
                </Text>

                <ScrollView style={{ maxHeight: 220 }}>
                  {actionOrder.items.map((line) => (
                    <View key={line.id} style={styles.itemRow}>
                      <Image source={imageSource(line.imageUrl)} style={styles.itemImage} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemTitle} numberOfLines={2}>
                          {line.title}
                        </Text>
                        <Text style={styles.itemMeta}>
                          {line.quantity} × {formatPriceXaf(line.unitPriceXaf)}
                        </Text>
                      </View>
                      <Text style={styles.itemLineTotal}>
                        {formatPriceXaf(line.unitPriceXaf * line.quantity)}
                      </Text>
                    </View>
                  ))}
                </ScrollView>

                <View style={styles.totalsRow}>
                  <Text style={styles.totalsLabel}>Payout</Text>
                  <Text style={styles.totalsValue}>{formatPriceXaf(actionOrder.subtotalXaf)}</Text>
                </View>

                {actionOrder.conversationId ? (
                  <TouchableOpacity
                    style={styles.chatRow}
                    onPress={() => {
                      const conversationId = actionOrder.conversationId;
                      setActionOrder(null);
                      if (conversationId) {
                        router.push({
                          pathname: "/usermessage",
                          params: { conversationId, origin: "inbox" },
                        });
                      }
                    }}
                  >
                    <Ionicons name="chatbubble-ellipses-outline" size={18} color="#FF2800" />
                    <Text style={styles.chatRowText}>Open buyer chat</Text>
                  </TouchableOpacity>
                ) : null}

                <View style={styles.actionsBlock}>
                  {actionOrder.status === "funds_held" ? (
                    <>
                      <ActionButton
                        label="Accept"
                        primary
                        loading={actionBusy}
                        onPress={() => runAction(actionOrder, "accept")}
                      />
                      <ActionButton
                        label="Reject (refund buyer)"
                        danger
                        loading={actionBusy}
                        onPress={() =>
                          Alert.alert(
                            "Reject order?",
                            "We'll refund the buyer. Use this only if you can't fulfill the order.",
                            [
                              { text: "Cancel", style: "cancel" },
                              {
                                text: "Reject",
                                style: "destructive",
                                onPress: () => runAction(actionOrder, "reject"),
                              },
                            ],
                          )
                        }
                      />
                    </>
                  ) : null}
                  {actionOrder.status === "seller_accepted" ? (
                    <ActionButton
                      label="Mark as shipped"
                      primary
                      loading={actionBusy}
                      onPress={() => runAction(actionOrder, "ship")}
                    />
                  ) : null}
                  {actionOrder.status === "in_transit" ? (
                    <ActionButton
                      label="Mark as delivered"
                      primary
                      loading={actionBusy}
                      onPress={() => runAction(actionOrder, "deliver")}
                    />
                  ) : null}
                  {actionOrder.status === "delivered" ? (
                    <View style={styles.infoBanner}>
                      <Ionicons name="information-circle" size={18} color="#1E3A8A" />
                      <Text style={styles.infoBannerText}>
                        Waiting on the buyer to confirm delivery. Funds auto-release in 7 days
                        if no action.
                      </Text>
                    </View>
                  ) : null}
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function ActionButton({
  label,
  onPress,
  primary,
  danger,
  loading,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
  danger?: boolean;
  loading?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.actionButton,
        primary && styles.actionButtonPrimary,
        danger && styles.actionButtonDanger,
      ]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={primary || danger ? "#FFFFFF" : "#FF2800"} />
      ) : (
        <Text
          style={[
            styles.actionButtonText,
            primary && styles.actionButtonTextPrimary,
            danger && styles.actionButtonTextDanger,
          ]}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E7EB",
  },
  backButton: { padding: 4 },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "Inter",
  },
  tabsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  tabActive: {
    backgroundColor: "#111827",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    fontFamily: "Inter",
  },
  tabTextActive: {
    color: "#FFFFFF",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 14,
    fontFamily: "Inter",
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#FF2800",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Inter",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "Inter",
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "Inter",
    textAlign: "center",
    lineHeight: 21,
  },
  listContent: { padding: 16, gap: 12 },
  orderCard: {
    borderWidth: 1,
    borderColor: "#F3F4F6",
    borderRadius: 14,
    padding: 12,
    backgroundColor: "#FAFAFA",
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  orderId: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "Inter",
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "Inter",
  },
  itemsPreview: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 12,
    alignItems: "center",
  },
  itemThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
  },
  moreCount: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  moreCountText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    fontFamily: "Inter",
  },
  orderFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  orderTotal: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
    fontFamily: "Inter",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    paddingBottom: 36,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "Inter",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F3F4F6",
  },
  itemImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
    fontFamily: "Inter",
  },
  itemMeta: {
    fontSize: 12,
    color: "#6B7280",
    fontFamily: "Inter",
    marginTop: 2,
  },
  itemLineTotal: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "Inter",
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 4,
  },
  totalsLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontFamily: "Inter",
  },
  totalsValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    fontFamily: "Inter",
  },
  chatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
  },
  chatRowText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FF2800",
    fontFamily: "Inter",
  },
  actionsBlock: {
    gap: 10,
    marginTop: 10,
  },
  actionButton: {
    height: 50,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FF2800",
    backgroundColor: "#FFFFFF",
  },
  actionButtonPrimary: {
    backgroundColor: "#FF2800",
    borderColor: "#FF2800",
  },
  actionButtonDanger: {
    backgroundColor: "#FFFFFF",
    borderColor: "#B91C1C",
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FF2800",
    fontFamily: "Inter",
  },
  actionButtonTextPrimary: {
    color: "#FFFFFF",
  },
  actionButtonTextDanger: {
    color: "#B91C1C",
  },
  infoBanner: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 12,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    color: "#1E3A8A",
    fontFamily: "Inter",
    lineHeight: 18,
  },
});
