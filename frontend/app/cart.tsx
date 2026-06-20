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
import { useMemo } from "react";
import { CartListSkeleton } from "../components/shared/CartListSkeleton";
import { useCartHasHydrated, useCartStore } from "../stores/cartStore";
import { formatPriceXaf } from "../utils/searchApi";

const PLACEHOLDER_IMAGE = require("../assets/images/clothes.jpg");

function cartImageSource(url: string | null | undefined) {
  const trimmed = url?.trim();
  return trimmed ? { uri: trimmed } : PLACEHOLDER_IMAGE;
}

export default function CartScreen() {
  const router = useRouter();
  const hasHydrated = useCartHasHydrated();
  const items = useCartStore((state) => state.items);
  const increment = useCartStore((state) => state.increment);
  const decrement = useCartStore((state) => state.decrement);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);

  // Must memoize — groupedBySeller() returns a new array each call; using it
  // directly in a Zustand selector causes an infinite re-render loop.
  const groups = useMemo(
    () => useCartStore.getState().groupedBySeller(),
    [items],
  );

  const totalXaf = useMemo(
    () => items.reduce((sum, item) => sum + item.unitPriceXaf * item.quantity, 0),
    [items],
  );

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const handleCheckout = () => {
    router.push("/checkout/address");
  };

  if (!hasHydrated) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="keyboard-arrow-left" size={32} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Cart</Text>
          <View style={{ width: 48 }} />
        </View>
        <CartListSkeleton />
      </SafeAreaView>
    );
  }

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="keyboard-arrow-left" size={32} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Cart</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>
            Tap the bag icon on any product to start a checkout, paid safely via SAFICK escrow.
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => router.replace("/(tabs)")}
            activeOpacity={0.85}
          >
            <Text style={styles.browseButtonText}>Browse products</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="keyboard-arrow-left" size={32} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Cart ({itemCount})</Text>
        <TouchableOpacity onPress={clearCart} hitSlop={10}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {groups.map((group) => (
          <View key={group.sellerId} style={styles.sellerGroup}>
            {group.items.map((item) => (
              <View key={item.productId} style={styles.itemRow}>
                <Image
                  source={cartImageSource(item.imageUrl)}
                  style={styles.itemImage}
                  resizeMode="cover"
                />
                <View style={styles.itemInfo}>
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
                  <Text style={styles.itemPrice}>
                    {formatPriceXaf(item.unitPriceXaf)}
                  </Text>
                  <View style={styles.stepperRow}>
                    <View style={styles.stepper}>
                      <TouchableOpacity
                        onPress={() => decrement(item.productId)}
                        style={styles.stepperButton}
                        hitSlop={8}
                        accessibilityLabel="Decrease quantity"
                      >
                        <Ionicons name="remove" size={18} color="#111827" />
                      </TouchableOpacity>
                      <Text style={styles.stepperValue}>{item.quantity}</Text>
                      <TouchableOpacity
                        onPress={() => increment(item.productId)}
                        style={styles.stepperButton}
                        hitSlop={8}
                        accessibilityLabel="Increase quantity"
                      >
                        <Ionicons name="add" size={18} color="#111827" />
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      onPress={() => removeItem(item.productId)}
                      hitSlop={10}
                      accessibilityLabel="Remove item"
                    >
                      <Text style={styles.removeText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.totalsBlock}>
          <Text style={styles.totalsLabel}>Total</Text>
          <Text style={styles.totalsValue}>{formatPriceXaf(totalXaf)}</Text>
        </View>
        <TouchableOpacity
          style={styles.checkoutButton}
          activeOpacity={0.85}
          onPress={handleCheckout}
        >
          <Text style={styles.checkoutText}>Pay safely</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "Inter",
  },
  clearText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FF2800",
    fontFamily: "Inter",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 140,
  },
  sellerGroup: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 1,
    marginBottom: 1,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  itemRow: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 10,
    gap: 12,
    marginBottom: 8,
  },
  itemImage: {
    width: 100,
    height: 110,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
  },
  itemInfo: {
    flex: 1,
    minWidth: 0,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    fontFamily: "Inter",
    marginBottom: 4,
  },
  itemSoldBy: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    fontFamily: "Inter",
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 12,
    fontWeight: "400",
    color: "#6B7280",
    fontFamily: "Inter",
    lineHeight: 17,
    marginBottom: 8,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "Inter",
    marginBottom: 8,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 999,
    paddingHorizontal: 4,
    gap: 6,
  },
  stepperButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "Inter",
    minWidth: 18,
    textAlign: "center",
  },
  removeText: {
    fontSize: 13,
    color: "#6B7280",
    fontFamily: "Inter",
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
  totalsBlock: {
    flex: 1,
  },
  totalsLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontFamily: "Inter",
  },
  totalsValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    fontFamily: "Inter",
  },
  checkoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FF2800",
    paddingHorizontal: 22,
    height: 50,
    borderRadius: 28,
    shadowColor: "#FF2800",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  checkoutText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 14,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "Inter",
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: "#6B7280",
    fontFamily: "Inter",
    textAlign: "center",
  },
  browseButton: {
    backgroundColor: "#FF2800",
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 8,
  },
  browseButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter",
  },
});
