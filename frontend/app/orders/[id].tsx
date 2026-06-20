import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  confirmDelivery,
  getMyOrder,
  openDispute,
  type Order,
  type OrderStatus,
} from "../../utils/checkoutApi";
import { formatPriceXaf } from "../../utils/searchApi";

const PLACEHOLDER_IMAGE = require("../../assets/images/clothes.jpg");

type DisputeCategory =
  | "item_not_received"
  | "wrong_item"
  | "damaged"
  | "seller_unresponsive"
  | "other";

const DISPUTE_LABEL: Record<DisputeCategory, string> = {
  item_not_received: "I did not receive the item",
  wrong_item: "Wrong item sent",
  damaged: "Item is damaged",
  seller_unresponsive: "Seller is unresponsive",
  other: "Other",
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: "Awaiting payment",
  funds_held: "Funds held in escrow",
  seller_accepted: "Seller accepted",
  seller_rejected: "Refunded",
  in_transit: "In transit",
  delivered: "Delivered — please confirm",
  completed: "Completed",
  disputed: "Disputed",
  refunded: "Refunded",
  cancelled: "Cancelled",
};

interface TimelineEntry {
  key: string;
  label: string;
  reached: boolean;
  active: boolean;
}

function imageSource(url: string | null | undefined) {
  const trimmed = url?.trim();
  return trimmed ? { uri: trimmed } : PLACEHOLDER_IMAGE;
}

function buildTimeline(status: OrderStatus): TimelineEntry[] {
  const order: OrderStatus[] = [
    "funds_held",
    "seller_accepted",
    "in_transit",
    "delivered",
    "completed",
  ];
  const currentIndex = order.indexOf(status);
  const labels: Record<OrderStatus, string> = {
    pending_payment: "Awaiting payment",
    funds_held: "Paid — held by SAFICK",
    seller_accepted: "Seller accepted",
    seller_rejected: "Seller rejected",
    in_transit: "Shipped",
    delivered: "Delivered",
    completed: "Released to seller",
    disputed: "Disputed",
    refunded: "Refunded",
    cancelled: "Cancelled",
  };
  return order.map((step, i) => ({
    key: step,
    label: labels[step],
    reached: currentIndex >= i,
    active: currentIndex === i,
  }));
}

export default function OrderDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const orderId = typeof params.id === "string" ? params.id : params.id?.[0];

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeCategory, setDisputeCategory] = useState<DisputeCategory>("item_not_received");
  const [disputeDetails, setDisputeDetails] = useState("");

  const load = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const fresh = await getMyOrder(orderId);
      setOrder(fresh);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load order.");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleConfirm = useCallback(() => {
    if (!order || actionBusy) return;
    Alert.alert(
      "Confirm delivery",
      "This releases the funds to the seller. Only confirm if you have received the item.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          style: "default",
          onPress: async () => {
            setActionBusy(true);
            try {
              const updated = await confirmDelivery(order.id);
              setOrder(updated);
            } catch (e) {
              Alert.alert(
                "Could not confirm",
                e instanceof Error ? e.message : "Please try again.",
              );
            } finally {
              setActionBusy(false);
            }
          },
        },
      ],
    );
  }, [order, actionBusy]);

  const handleSubmitDispute = useCallback(async () => {
    if (!order || actionBusy) return;
    if (disputeDetails.trim().length < 10) {
      Alert.alert("Add details", "Please describe the issue in at least 10 characters.");
      return;
    }
    setActionBusy(true);
    try {
      const updated = await openDispute(order.id, disputeCategory, disputeDetails.trim());
      setOrder(updated);
      setDisputeOpen(false);
      setDisputeDetails("");
    } catch (e) {
      Alert.alert(
        "Could not open dispute",
        e instanceof Error ? e.message : "Please try again.",
      );
    } finally {
      setActionBusy(false);
    }
  }, [actionBusy, disputeCategory, disputeDetails, order]);

  const timeline = useMemo(
    () => (order ? buildTimeline(order.status) : []),
    [order],
  );

  const canConfirm = order?.status === "delivered";
  const canDispute =
    order &&
    ["funds_held", "seller_accepted", "in_transit", "delivered"].includes(order.status);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="keyboard-arrow-left" size={32} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order detail</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#FF2800" />
        </View>
      ) : error || !order ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error ?? "Order not found."}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={load}>
            <Text style={styles.retryButtonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.statusCard}>
              <Text style={styles.statusLabel}>{STATUS_LABEL[order.status]}</Text>
              {order.autoReleaseAt && order.status === "delivered" ? (
                <Text style={styles.statusHint}>
                  Funds auto-release on {new Date(order.autoReleaseAt).toLocaleDateString()}
                </Text>
              ) : null}
            </View>

            <View style={styles.timeline}>
              {timeline.map((step, idx) => (
                <View key={step.key} style={styles.timelineRow}>
                  <View
                    style={[
                      styles.timelineDot,
                      step.reached && styles.timelineDotReached,
                      step.active && styles.timelineDotActive,
                    ]}
                  />
                  {idx < timeline.length - 1 ? (
                    <View
                      style={[
                        styles.timelineLine,
                        step.reached && styles.timelineLineReached,
                      ]}
                    />
                  ) : null}
                  <Text style={[styles.timelineLabel, step.reached && styles.timelineLabelActive]}>
                    {step.label}
                  </Text>
                </View>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Seller</Text>
            <View style={styles.summaryCard}>
              <Ionicons name="storefront-outline" size={18} color="#374151" />
              <Text style={styles.summaryHeading}>{order.sellerDisplayName}</Text>
              {order.conversationId ? (
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/usermessage",
                      params: { conversationId: order.conversationId ?? "", origin: "inbox" },
                    })
                  }
                >
                  <Text style={styles.chatLink}>Open chat →</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <Text style={styles.sectionTitle}>Items</Text>
            {order.items.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <Image source={imageSource(item.imageUrl)} style={styles.itemImage} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.itemMeta}>
                    {item.quantity} × {formatPriceXaf(item.unitPriceXaf)}
                  </Text>
                </View>
                <Text style={styles.itemLineTotal}>
                  {formatPriceXaf(item.unitPriceXaf * item.quantity)}
                </Text>
              </View>
            ))}

            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Total</Text>
              <Text style={styles.totalsValue}>{formatPriceXaf(order.subtotalXaf)}</Text>
            </View>
          </ScrollView>

          <View style={styles.bottomBar}>
            {canDispute ? (
              <TouchableOpacity
                style={styles.disputeButton}
                onPress={() => setDisputeOpen(true)}
                disabled={actionBusy}
                activeOpacity={0.85}
              >
                <Ionicons name="alert-circle-outline" size={18} color="#B91C1C" />
                <Text style={styles.disputeButtonText}>Open dispute</Text>
              </TouchableOpacity>
            ) : null}
            {canConfirm ? (
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleConfirm}
                disabled={actionBusy}
                activeOpacity={0.85}
              >
                {actionBusy ? (
                  <ActivityIndicator color="#FF2800" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={18} color="#FF2800" />
                    <Text style={styles.confirmButtonText}>Confirm delivery</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : null}
          </View>

          <Modal visible={disputeOpen} animationType="slide" transparent>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={styles.modalOverlay}
            >
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Open a dispute</Text>
                <Text style={styles.modalSubtitle}>
                  Funds stay frozen until a moderator resolves it. Most disputes are answered within 24h.
                </Text>

                {(Object.keys(DISPUTE_LABEL) as DisputeCategory[]).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryRow,
                      disputeCategory === cat && styles.categoryRowActive,
                    ]}
                    onPress={() => setDisputeCategory(cat)}
                  >
                    <View style={styles.radio}>
                      {disputeCategory === cat ? <View style={styles.radioInner} /> : null}
                    </View>
                    <Text style={styles.categoryLabel}>{DISPUTE_LABEL[cat]}</Text>
                  </TouchableOpacity>
                ))}

                <TextInput
                  value={disputeDetails}
                  onChangeText={setDisputeDetails}
                  placeholder="Describe what went wrong (10–2000 characters)"
                  multiline
                  numberOfLines={4}
                  style={styles.detailsInput}
                />

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancel}
                    onPress={() => setDisputeOpen(false)}
                    disabled={actionBusy}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalSubmit}
                    onPress={handleSubmitDispute}
                    disabled={actionBusy}
                  >
                    {actionBusy ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.modalSubmitText}>Submit</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </Modal>
        </>
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
  scrollContent: { padding: 16, paddingBottom: 140 },
  statusCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E3A8A",
    fontFamily: "Inter",
  },
  statusHint: {
    fontSize: 12,
    color: "#1E3A8A",
    fontFamily: "Inter",
    marginTop: 4,
  },
  timeline: {
    backgroundColor: "#FAFAFA",
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    position: "relative",
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
    marginRight: 12,
  },
  timelineDotReached: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  timelineDotActive: {
    backgroundColor: "#FF2800",
    borderColor: "#FF2800",
  },
  timelineLine: {
    position: "absolute",
    left: 6,
    top: 26,
    bottom: -6,
    width: 2,
    backgroundColor: "#E5E7EB",
  },
  timelineLineReached: {
    backgroundColor: "#10B981",
  },
  timelineLabel: {
    fontSize: 13,
    color: "#6B7280",
    fontFamily: "Inter",
  },
  timelineLabelActive: {
    color: "#111827",
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    fontFamily: "Inter",
    marginBottom: 8,
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  summaryHeading: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "Inter",
  },
  chatLink: {
    fontSize: 13,
    color: "#FF2800",
    fontWeight: "600",
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
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: 36,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 0.5,
    borderTopColor: "#E5E7EB",
  },
  disputeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 50,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: "#B91C1C",
    backgroundColor: "#FFFFFF",
  },
  disputeButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#B91C1C",
    fontFamily: "Inter",
  },
  confirmButton: {
    flex: 1.4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 50,
    borderRadius: 28,
    backgroundColor: "#10B981",
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
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
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "Inter",
  },
  modalSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    fontFamily: "Inter",
    marginTop: 4,
    marginBottom: 12,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
  },
  categoryRowActive: {},
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#FF2800",
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF2800",
  },
  categoryLabel: {
    fontSize: 14,
    color: "#111827",
    fontFamily: "Inter",
  },
  detailsInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
    marginTop: 10,
    fontFamily: "Inter",
    fontSize: 14,
    color: "#111827",
    textAlignVertical: "top",
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    fontFamily: "Inter",
  },
  modalSubmit: {
    flex: 1.5,
    paddingVertical: 14,
    borderRadius: 24,
    backgroundColor: "#FF2800",
    alignItems: "center",
    justifyContent: "center",
  },
  modalSubmitText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter",
  },
});
