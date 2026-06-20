import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { listMyOrders, type Order, type OrderStatus } from "../../utils/checkoutApi";
import { formatPriceXaf } from "../../utils/searchApi";

const PLACEHOLDER_IMAGE = require("../../assets/images/clothes.jpg");

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: "Awaiting payment",
  funds_held: "Funds held",
  seller_accepted: "Seller accepted",
  seller_rejected: "Rejected — refunded",
  in_transit: "In transit",
  delivered: "Delivered — confirm",
  completed: "Completed",
  disputed: "Disputed",
  refunded: "Refunded",
  cancelled: "Cancelled",
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending_payment: "#6B7280",
  funds_held: "#0EA5E9",
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

export default function OrdersListScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async ({ pull }: { pull?: boolean } = {}) => {
      if (pull) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const rows = await listMyOrders();
        setOrders(rows);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load your orders.");
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

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="keyboard-arrow-left" size={32} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Orders</Text>
        <View style={{ width: 32 }} />
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
      ) : orders.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptySubtitle}>
            Orders you place will appear here, with status and a chat shortcut to the seller.
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
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
              onPress={() =>
                router.push({ pathname: "/orders/[id]", params: { id: item.id } })
              }
              activeOpacity={0.85}
            >
              <View style={styles.orderHeader}>
                <Ionicons name="storefront-outline" size={16} color="#374151" />
                <Text style={styles.orderSeller}>{item.sellerDisplayName}</Text>
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
    </SafeAreaView>
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
  orderSeller: {
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
});
