import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  getCheckoutStatus,
  getMyOrder,
  type Order,
} from "../../utils/checkoutApi";
import { formatPriceXaf } from "../../utils/searchApi";

export default function CheckoutSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const checkoutId = typeof params.id === "string" ? params.id : params.id?.[0];

  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!checkoutId) return;
    setError(null);
    try {
      const status = await getCheckoutStatus(checkoutId);
      const orderRows = await Promise.all(
        status.orderIds.map((id) => getMyOrder(id).catch(() => null)),
      );
      setOrders(orderRows.filter((o): o is Order => o !== null));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load order details.");
    }
  }, [checkoutId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.successCircle}>
          <Ionicons name="checkmark" size={42} color="#FFFFFF" />
        </View>
        <Text style={styles.title}>Payment received</Text>
        <Text style={styles.subtitle}>
          Your money is held safely by SAFICK. The seller has been notified.
          You can confirm delivery from the order detail screen once the item arrives.
        </Text>

        {orders === null ? (
          <ActivityIndicator color="#FF2800" style={{ marginTop: 24 }} />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <View style={styles.ordersBlock}>
            <Text style={styles.sectionTitle}>Orders created</Text>
            {orders.map((order) => (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <Ionicons name="storefront-outline" size={16} color="#374151" />
                  <Text style={styles.orderSeller}>{order.sellerDisplayName}</Text>
                  <Text style={styles.orderTotal}>
                    {formatPriceXaf(order.subtotalXaf)}
                  </Text>
                </View>
                <Text style={styles.orderStatus}>
                  Status: <Text style={styles.statusValue}>{order.status}</Text>
                </Text>
                {order.conversationId ? (
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: "/usermessage",
                        params: { conversationId: order.conversationId ?? "", origin: "inbox" },
                      })
                    }
                  >
                    <Text style={styles.chatLink}>Open chat with seller →</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.replace("/(tabs)")}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollContent: {
    padding: 20,
    paddingBottom: 140,
    alignItems: "center",
  },
  successCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    marginBottom: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "Inter",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: "#374151",
    fontFamily: "Inter",
    textAlign: "center",
    paddingHorizontal: 8,
  },
  ordersBlock: {
    marginTop: 26,
    width: "100%",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    fontFamily: "Inter",
    marginBottom: 8,
  },
  orderCard: {
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  orderHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  orderSeller: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "Inter",
  },
  orderTotal: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "Inter",
  },
  orderStatus: {
    fontSize: 13,
    color: "#374151",
    fontFamily: "Inter",
  },
  statusValue: {
    fontWeight: "700",
    color: "#10B981",
  },
  chatLink: {
    fontSize: 13,
    color: "#FF2800",
    fontFamily: "Inter",
    fontWeight: "600",
    marginTop: 6,
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 13,
    fontFamily: "Inter",
    marginTop: 12,
    textAlign: "center",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: 36,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 0.5,
    borderTopColor: "#E5E7EB",
  },
  primaryButton: {
    height: 50,
    borderRadius: 28,
    backgroundColor: "#FF2800",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter",
  },
});
