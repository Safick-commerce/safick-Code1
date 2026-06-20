import {
  ActivityIndicator,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { getCheckoutStatus, type CheckoutStatus } from "../../utils/checkoutApi";
import { useCartStore } from "../../stores/cartStore";

const METHOD_LABEL: Record<string, string> = {
  mtn_momo: "MTN Mobile Money",
  orange_money: "Orange Money",
  express_union: "Express Union Mobile",
  card: "Card",
};

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000;

export default function AwaitingPinScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string | string[];
    method?: string | string[];
    hosted?: string | string[];
  }>();
  const checkoutId = typeof params.id === "string" ? params.id : params.id?.[0];
  const method = typeof params.method === "string" ? params.method : params.method?.[0];
  const hostedUrl =
    typeof params.hosted === "string"
      ? params.hosted
      : Array.isArray(params.hosted)
        ? params.hosted[0]
        : "";

  const clearCart = useCartStore((s) => s.clearCart);

  const [status, setStatus] = useState<CheckoutStatus | "loading">("loading");
  const [failureReason, setFailureReason] = useState<string | null>(null);
  const stoppedRef = useRef(false);

  const isCard = method === "card";

  const openHostedCheckout = useCallback(async () => {
    if (!hostedUrl) return;
    try {
      await Linking.openURL(hostedUrl);
    } catch {
      /* user cancels — they'll come back to this screen */
    }
  }, [hostedUrl]);

  useEffect(() => {
    if (!checkoutId) {
      router.replace("/cart");
      return;
    }
    stoppedRef.current = false;
    const startedAt = Date.now();
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const poll = async () => {
      if (stoppedRef.current) return;
      try {
        const fresh = await getCheckoutStatus(checkoutId);
        setStatus(fresh.status);
        setFailureReason(fresh.failureReason ?? null);
        if (fresh.status === "paid") {
          clearCart();
          router.replace({ pathname: "/checkout/success", params: { id: checkoutId } });
          return;
        }
        if (
          fresh.status === "failed" ||
          fresh.status === "expired" ||
          fresh.status === "refunded"
        ) {
          return;
        }
      } catch {
        // ignore transient network error; we keep polling until the timeout fires
      }
      if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        setStatus("failed");
        setFailureReason("Timed out waiting for payment confirmation.");
        return;
      }
      timeoutId = setTimeout(poll, POLL_INTERVAL_MS);
    };

    if (isCard && hostedUrl) {
      openHostedCheckout();
    }
    poll();

    return () => {
      stoppedRef.current = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [checkoutId, clearCart, hostedUrl, isCard, openHostedCheckout, router]);

  const isFinalFailure =
    status === "failed" || status === "expired" || status === "refunded";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.body}>
        {isFinalFailure ? (
          <>
            <Ionicons name="alert-circle" size={64} color="#B91C1C" />
            <Text style={styles.title}>Payment didn&apos;t go through</Text>
            <Text style={styles.subtitle}>
              {failureReason ?? "Please try a different method or try again."}
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.replace("/checkout/payment")}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>Try a different method</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkButton} onPress={() => router.replace("/cart")}>
              <Text style={styles.linkButtonText}>Back to cart</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <ActivityIndicator size="large" color="#FF2800" />
            <Text style={styles.title}>
              {isCard ? "Complete your card payment" : "Confirm on your phone"}
            </Text>
            <Text style={styles.subtitle}>
              {isCard
                ? "We opened the secure checkout in your browser. Come back to this screen once you have paid."
                : `Enter your ${
                    method ? (METHOD_LABEL[method] ?? "mobile money") : "mobile money"
                  } PIN on the prompt that just appeared on your SIM.`}
            </Text>
            {isCard && hostedUrl ? (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={openHostedCheckout}
                activeOpacity={0.85}
              >
                <Text style={styles.secondaryButtonText}>Reopen checkout</Text>
              </TouchableOpacity>
            ) : null}
            <Text style={styles.smallText}>
              This screen will update automatically once we hear from the payment provider.
            </Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "Inter",
    textAlign: "center",
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: "#374151",
    fontFamily: "Inter",
    textAlign: "center",
  },
  smallText: {
    fontSize: 12,
    color: "#6B7280",
    fontFamily: "Inter",
    textAlign: "center",
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: "#FF2800",
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 28,
    marginTop: 14,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter",
  },
  secondaryButton: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: "#FF2800",
    marginTop: 10,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FF2800",
    fontFamily: "Inter",
  },
  linkButton: { marginTop: 4 },
  linkButtonText: {
    fontSize: 13,
    color: "#6B7280",
    fontFamily: "Inter",
  },
});
