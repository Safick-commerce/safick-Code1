import {
  Image,
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
import { CheckoutSummaryCardSkeleton } from "../../components/checkout/CheckoutSummaryCardSkeleton";
import { SkeletonBlock } from "../../components/shared/SkeletonBlock";
import { useCartStore, type CartItem } from "../../stores/cartStore";
import { useCheckoutFlowStore } from "../../stores/checkoutStore";
import {
  createCheckout,
  listAddresses,
  type Address,
  type PaymentMethod,
} from "../../utils/checkoutApi";
import { formatPriceXaf } from "../../utils/searchApi";

const STEP_INDEX = 2;
const TOTAL_STEPS = 3;

const PLACEHOLDER_IMAGE = require("../../assets/images/clothes.jpg");

function imageSource(url: string | null) {
  const trimmed = url?.trim();
  return trimmed ? { uri: trimmed } : PLACEHOLDER_IMAGE;
}

const METHOD_LABEL: Record<PaymentMethod, string> = {
  mtn_momo: "MTN Mobile Money",
  orange_money: "Orange Money",
  express_union: "Express Union Mobile",
  card: "Card",
};

interface SellerGroup {
  sellerId: string;
  sellerName: string;
  sellerAvatarUrl: string | null;
  items: CartItem[];
  subtotalXaf: number;
}

function groupBySeller(items: CartItem[]): SellerGroup[] {
  const grouped = new Map<string, SellerGroup>();
  for (const item of items) {
    const existing = grouped.get(item.sellerId);
    if (existing) {
      existing.items.push(item);
      existing.subtotalXaf += item.unitPriceXaf * item.quantity;
      if (!existing.sellerAvatarUrl && item.sellerAvatarUrl) {
        existing.sellerAvatarUrl = item.sellerAvatarUrl;
      }
    } else {
      grouped.set(item.sellerId, {
        sellerId: item.sellerId,
        sellerName: item.sellerName,
        sellerAvatarUrl: item.sellerAvatarUrl,
        items: [item],
        subtotalXaf: item.unitPriceXaf * item.quantity,
      });
    }
  }
  return Array.from(grouped.values());
}

export default function CheckoutReviewScreen() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const addressId = useCheckoutFlowStore((s) => s.addressId);
  const paymentMethod = useCheckoutFlowStore((s) => s.paymentMethod);
  const payerPhone = useCheckoutFlowStore((s) => s.payerPhone);

  const [address, setAddress] = useState<Address | null>(null);
  const [addressLoading, setAddressLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (items.length === 0) {
      router.replace("/cart");
      return;
    }
    if (!addressId) {
      router.replace("/checkout/address");
      return;
    }
    if (!paymentMethod) {
      router.replace("/checkout/payment");
      return;
    }
    setAddressLoading(true);
    listAddresses()
      .then((list) => {
        const found = list.find((a) => a.id === addressId);
        setAddress(found ?? null);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Could not load address.");
      })
      .finally(() => {
        setAddressLoading(false);
      });
  }, [addressId, items.length, paymentMethod, router]);

  const groups = useMemo(() => groupBySeller(items), [items]);
  const totalXaf = useMemo(
    () => items.reduce((sum, item) => sum + item.unitPriceXaf * item.quantity, 0),
    [items],
  );

  const handlePay = useCallback(async () => {
    if (!addressId || !paymentMethod || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const checkout = await createCheckout({
        addressId,
        paymentMethod,
        payerPhone: payerPhone ?? undefined,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      });

      if (checkout.status === "paid") {
        clearCart();
        router.replace({
          pathname: "/checkout/success",
          params: { id: checkout.id },
        });
        return;
      }

      if (checkout.status === "failed" || checkout.status === "expired") {
        setError("Payment could not be started. Please try again.");
        setSubmitting(false);
        return;
      }

      // For card flows, open hosted checkout URL — handled inside awaiting-pin
      // by passing the URL through router params.
      router.replace({
        pathname: "/checkout/awaiting-pin",
        params: {
          id: checkout.id,
          method: paymentMethod,
          hosted: checkout.hostedCheckoutUrl ?? "",
        },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start payment.");
      setSubmitting(false);
    }
  }, [addressId, clearCart, items, paymentMethod, payerPhone, router, submitting]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="keyboard-arrow-left" size={32} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review &amp; pay</Text>
        <Text style={styles.stepLabel}>
          Step {STEP_INDEX + 1} of {TOTAL_STEPS}
        </Text>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: "100%" }]} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.escrowBanner}
          activeOpacity={0.85}
          onPress={() => router.push("/how-escrow-works")}
          accessibilityRole="button"
          accessibilityLabel="Learn how escrow works"
        >
          <Ionicons name="shield-checkmark" size={18} color="#065F46" />
          <Text style={styles.escrowText}>
            Held safely by SAFICK until you confirm delivery.
          </Text>
          <Ionicons name="information-circle-outline" size={18} color="#065F46" />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Delivery Address</Text>
        {addressLoading ? (
          <CheckoutSummaryCardSkeleton />
        ) : address ? (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryHeading}>{address.recipientName}</Text>
            <Text style={styles.summaryLine}>
              {address.neighborhood}, {address.city}
            </Text>
            {address.landmark ? (
              <Text style={styles.summaryLine}>Near {address.landmark}</Text>
            ) : null}
            <Text style={styles.summaryLine}>{address.phone}</Text>
            <TouchableOpacity onPress={() => router.push("/checkout/address")}>
              <Text style={styles.changeLink}>Change</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLine}>Address not found.</Text>
            <TouchableOpacity onPress={() => router.push("/checkout/address")}>
              <Text style={styles.changeLink}>Choose address</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.sectionSeparator} />

        <Text style={styles.sectionTitle}>Pay with</Text>
        <View style={styles.summaryCard}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="card-outline" size={20} color="#1F2937" />
            <Text style={styles.summaryHeading}>
              {paymentMethod ? METHOD_LABEL[paymentMethod] : "—"}
            </Text>
          </View>
          {payerPhone ? <Text style={styles.summaryLine}>{payerPhone}</Text> : null}
          <TouchableOpacity onPress={() => router.push("/checkout/payment")}>
            <Text style={styles.changeLink}>Change</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.sectionSeparator} />

        <Text style={styles.sectionTitle}>Items</Text>
        {groups.map((group) => (
          <View key={group.sellerId} style={styles.sellerGroup}>
            {group.items.map((item) => (
              <View key={item.productId} style={styles.itemRow}>
                <Image
                  source={imageSource(item.imageUrl)}
                  style={styles.itemImage}
                  resizeMode="cover"
                />
                <View style={styles.itemBody}>
                  <Text style={styles.itemTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.itemSoldBy} numberOfLines={1}>
                    Sold by {item.sellerName}
                  </Text>
                  {item.description ? (
                    <Text style={styles.itemDescription} numberOfLines={3}>
                      {item.description}
                    </Text>
                  ) : null}
                  <Text style={styles.itemMeta}>
                    {item.quantity} × {formatPriceXaf(item.unitPriceXaf)}
                  </Text>
                </View>
                <Text style={styles.itemLineTotal}>
                  {formatPriceXaf(item.unitPriceXaf * item.quantity)}
                </Text>
              </View>
            ))}
          </View>
        ))}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.totalsBlock}>
          <Text style={styles.totalsLabel}>Total</Text>
          <Text style={styles.totalsValue}>{formatPriceXaf(totalXaf)}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.payButton,
            (submitting || addressLoading || !address) && styles.payButtonDisabled,
          ]}
          onPress={handlePay}
          disabled={submitting || addressLoading || !address}
          activeOpacity={0.85}
        >
          {submitting ? (
            <SkeletonBlock style={styles.payButtonSkeleton} />
          ) : (
            <Text style={styles.payButtonText}>Pay safely</Text>
          )}
        </TouchableOpacity>
      </View>
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
    paddingVertical: 10,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111827", fontFamily: "Inter" },
  stepLabel: { fontSize: 12, color: "#6B7280", fontFamily: "Inter" },
  progressBar: { height: 3, backgroundColor: "#F3F4F6" },
  progressFill: { height: 3, backgroundColor: "#FF2800" },
  scrollContent: { padding: 16, paddingBottom: 160 },
  escrowBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  escrowText: { fontSize: 13, color: "#065F46", fontFamily: "Inter", flex: 1 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    fontFamily: "Inter",
    marginTop: 6,
    marginBottom: 8,
    },
    sectionSeparator: {
    height: 2,
    backgroundColor: "#F3F4F6",
    marginVertical: 10,
  },
    summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  summaryHeading: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "Inter",
    marginBottom: 4,
  },
  summaryLine: {
    fontSize: 13,
    color: "#374151",
    fontFamily: "Inter",
    marginBottom: 2,
  },
  changeLink: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FF2800",
    fontFamily: "Inter",
    marginTop: 6,
  },
  sellerGroup: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  sellerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  sellerName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    fontFamily: "Inter",
  },
  sellerSubtotal: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "Inter",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 8,
  },
  itemImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  itemBody: {
    flex: 1,
    minWidth: 0,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "Inter",
  },
  itemSoldBy: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    fontFamily: "Inter",
    marginTop: 4,
  },
  itemDescription: {
    fontSize: 12,
    color: "#4B5563",
    fontFamily: "Inter",
    lineHeight: 17,
    marginTop: 4,
  },
  itemMeta: {
    fontSize: 12,
    color: "#6B7280",
    fontFamily: "Inter",
    marginTop: 6,
  },
  itemLineTotal: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "Inter",
    marginTop: 2,
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
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: 36,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 0.5,
    borderTopColor: "#E5E7EB",
  },
  totalsBlock: { flex: 1 },
  totalsLabel: { fontSize: 12, color: "#6B7280", fontFamily: "Inter" },
  totalsValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    fontFamily: "Inter",
  },
  payButton: {
    flexDirection: "row",
    gap: 8,
    height: 50,
    paddingHorizontal: 22,
    borderRadius: 28,
    backgroundColor: "#FF2800",
    alignItems: "center",
    justifyContent: "center",
  },
  payButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },
  payButtonSkeleton: {
    width: 96,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(255, 255, 255, 0.55)",
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter",
  },
});
