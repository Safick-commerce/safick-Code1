import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PaymentMethodIcon } from "../../components/checkout/PaymentMethodIcon";
import { useCheckoutFlowStore } from "../../stores/checkoutStore";
import type { PaymentMethod } from "../../utils/checkoutApi";

const STEP_INDEX = 1;
const TOTAL_STEPS = 3;
const GRID_GAP = 12;
const HORIZONTAL_PADDING = 16;

interface MethodOption {
  id: PaymentMethod;
  label: string;
  shortLabel: string;
  needsPhone: boolean;
}

const METHODS: MethodOption[] = [
  {
    id: "mtn_momo",
    label: "MTN Mobile Money",
    shortLabel: "MTN MoMo",
    needsPhone: true,
  },
  {
    id: "orange_money",
    label: "Orange Money",
    shortLabel: "Orange Money",
    needsPhone: true,
  },
];

function isLikelyCameroonMobile(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-\(\)]/g, "").replace(/^\+?237/, "");
  return /^6[0-9]{8}$/.test(cleaned);
}

export default function CheckoutPaymentScreen() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const addressId = useCheckoutFlowStore((s) => s.addressId);
  const paymentMethod = useCheckoutFlowStore((s) => s.paymentMethod);
  const payerPhone = useCheckoutFlowStore((s) => s.payerPhone);
  const setPaymentMethod = useCheckoutFlowStore((s) => s.setPaymentMethod);
  const setPayerPhone = useCheckoutFlowStore((s) => s.setPayerPhone);

  const [localPhone, setLocalPhone] = useState(payerPhone ?? "");

  const tileWidth = useMemo(
    () => (screenWidth - HORIZONTAL_PADDING * 2 - GRID_GAP) / 2,
    [screenWidth],
  );

  useEffect(() => {
    if (!addressId) {
      router.replace("/checkout/address");
    }
  }, [addressId, router]);

  const selectedMethod = useMemo(
    () => METHODS.find((m) => m.id === paymentMethod) ?? null,
    [paymentMethod],
  );

  const canContinue = useMemo(() => {
    if (!selectedMethod) return false;
    if (!selectedMethod.needsPhone) return true;
    return isLikelyCameroonMobile(localPhone);
  }, [localPhone, selectedMethod]);

  const handleContinue = useCallback(() => {
    if (!canContinue || !selectedMethod) return;
    if (selectedMethod.needsPhone) {
      setPayerPhone(localPhone.trim());
    } else {
      setPayerPhone(null);
    }
    router.push("/checkout/review");
  }, [canContinue, localPhone, router, selectedMethod, setPayerPhone]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="keyboard-arrow-left" size={32} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment method</Text>
        <Text style={styles.stepLabel}>
          Step {STEP_INDEX + 1} of {TOTAL_STEPS}
        </Text>
      </View>

      <View style={styles.progressBar}>
        <View
          style={[styles.progressFill, { width: `${((STEP_INDEX + 1) / TOTAL_STEPS) * 100}%` }]}
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          <View style={styles.methodGrid}>
            {METHODS.map((method) => {
              const isSelected = method.id === paymentMethod;
              return (
                <TouchableOpacity
                  key={method.id}
                  onPress={() => setPaymentMethod(method.id)}
                  style={[
                    styles.methodTile,
                    { width: tileWidth, height: tileWidth },
                    isSelected && styles.methodTileSelected,
                  ]}
                  activeOpacity={0.85}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={method.label}
                >
                  <PaymentMethodIcon method={method.id} size={52} />
                  <Text style={styles.methodShortLabel} numberOfLines={2}>
                    {method.shortLabel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {selectedMethod?.needsPhone ? (
            <View style={styles.phoneSection}>
              <Text style={styles.fieldLabel}>
                {selectedMethod.label} number
              </Text>
              <TextInput
                value={localPhone}
                onChangeText={setLocalPhone}
                placeholder="6XX XXX XXX"
                placeholderTextColor="#828282"
                style={styles.input}
                keyboardType="phone-pad"
                maxLength={9}
              />
              <Text style={styles.helperText}>
                Cameroon 9-digit number starting with 6.
              </Text>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.primaryButton, !canContinue && styles.primaryButtonDisabled]}
          onPress={handleContinue}
          disabled={!canContinue}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>Continue</Text>
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
  scrollContent: { padding: HORIZONTAL_PADDING, paddingBottom: 140 },
  methodGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
  },
  methodTile: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
  },
  methodTileSelected: {
    borderColor: "#FF2800",
    backgroundColor: "#FFFFFF",
  },
  methodShortLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "Inter",
    textAlign: "center",
    lineHeight: 20,
  },
  phoneSection: { marginTop: 20 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    fontFamily: "Inter",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#000000",
    fontFamily: "Inter",
    backgroundColor: "#ffffff",
  },
  helperText: {
    fontSize: 12,
    color: "#6B7280",
    fontFamily: "Inter",
    marginTop: 4,
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
  primaryButtonDisabled: { backgroundColor: "#D1D5DB" },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter",
  },
});
