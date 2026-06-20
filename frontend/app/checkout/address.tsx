import {
  ActivityIndicator,
  KeyboardAvoidingView,
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
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createAddress,
  listAddresses,
  type Address,
} from "../../utils/checkoutApi";
import { useCheckoutFlowStore } from "../../stores/checkoutStore";
import { useCartItemCount } from "../../stores/cartStore";

type Mode = "list" | "new";

const STEP_INDEX = 0;
const TOTAL_STEPS = 3;

export default function CheckoutAddressScreen() {
  const router = useRouter();
  const cartCount = useCartItemCount();
  const setAddress = useCheckoutFlowStore((s) => s.setAddress);
  const selectedAddressId = useCheckoutFlowStore((s) => s.addressId);
  const start = useCheckoutFlowStore((s) => s.start);

  const [mode, setMode] = useState<Mode>("list");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [landmark, setLandmark] = useState("");

  useEffect(() => {
    start();
  }, [start]);

  const loadAddresses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listAddresses();
      setAddresses(list);
      if (list.length === 0) {
        setMode("new");
      } else {
        setMode("list");
        if (!selectedAddressId) {
          const fallback = list.find((a) => a.isDefault) ?? list[0];
          setAddress(fallback.id);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load addresses.");
    } finally {
      setLoading(false);
    }
  }, [selectedAddressId, setAddress]);

  useEffect(() => {
    if (cartCount === 0) {
      router.replace("/cart");
      return;
    }
    loadAddresses();
  }, [cartCount, loadAddresses, router]);

  const handleSelect = useCallback(
    (id: string) => {
      setAddress(id);
    },
    [setAddress],
  );

  const canSubmitNew = useMemo(
    () =>
      recipientName.trim().length >= 2 &&
      phone.trim().length >= 9 &&
      city.trim().length >= 2 &&
      neighborhood.trim().length >= 2,
    [recipientName, phone, city, neighborhood],
  );

  const handleCreate = useCallback(async () => {
    if (!canSubmitNew || saving) return;
    setSaving(true);
    setError(null);
    try {
      const created = await createAddress({
        recipientName: recipientName.trim(),
        phone: phone.trim(),
        city: city.trim(),
        neighborhood: neighborhood.trim(),
        landmark: landmark.trim() || undefined,
        isDefault: addresses.length === 0,
      });
      setAddresses((prev) => [created, ...prev]);
      setAddress(created.id);
      setMode("list");
      setRecipientName("");
      setPhone("");
      setCity("");
      setNeighborhood("");
      setLandmark("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the address.");
    } finally {
      setSaving(false);
    }
  }, [
    addresses.length,
    canSubmitNew,
    city,
    landmark,
    neighborhood,
    phone,
    recipientName,
    saving,
    setAddress,
  ]);

  const handleContinue = useCallback(() => {
    if (!selectedAddressId) return;
    router.push("/checkout/payment");
  }, [router, selectedAddressId]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="keyboard-arrow-left" size={32} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery address</Text>
        <Text style={styles.stepLabel}>
          Step {STEP_INDEX + 1} of {TOTAL_STEPS}
        </Text>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((STEP_INDEX + 1) / TOTAL_STEPS) * 100}%` }]} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {loading ? (
            <ActivityIndicator size="large" color="#FF2800" style={{ marginTop: 40 }} />
          ) : mode === "list" ? (
            <View>
              {addresses.map((addr) => {
                const isSelected = addr.id === selectedAddressId;
                return (
                  <TouchableOpacity
                    key={addr.id}
                    onPress={() => handleSelect(addr.id)}
                    style={[styles.addressCard, isSelected && styles.addressCardSelected]}
                    activeOpacity={0.85}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.recipientText}>{addr.recipientName}</Text>
                      <Text style={styles.addressLine}>
                        {addr.neighborhood}, {addr.city}
                      </Text>
                      {addr.landmark ? (
                        <Text style={styles.addressLine}>Near {addr.landmark}</Text>
                      ) : null}
                      <Text style={styles.addressPhone}>{addr.phone}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                onPress={() => setMode("new")}
                style={styles.addNewButton}
                activeOpacity={0.85}
              >
                <Ionicons name="add" size={20} color="#FF2800" />
                <Text style={styles.addNewText}>Add a new address</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text style={styles.fieldLabel}>Recipient name</Text>
              <TextInput
                value={recipientName}
                onChangeText={setRecipientName}
                placeholder="Who receives the order?"
                style={styles.input}
                autoCapitalize="words"
              />

              <Text style={styles.fieldLabel}>Phone (Cameroon)</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="6XX XXX XXX"
                style={styles.input}
                keyboardType="phone-pad"
                maxLength={20}
              />

              <Text style={styles.fieldLabel}>City</Text>
              <TextInput
                value={city}
                onChangeText={setCity}
                placeholder="e.g. Douala"
                style={styles.input}
              />

              <Text style={styles.fieldLabel}>Neighborhood / quartier</Text>
              <TextInput
                value={neighborhood}
                onChangeText={setNeighborhood}
                placeholder="e.g. Bonapriso"
                style={styles.input}
              />

              <Text style={styles.fieldLabel}>Landmark (optional)</Text>
              <TextInput
                value={landmark}
                onChangeText={setLandmark}
                placeholder="e.g. behind the Total station"
                style={styles.input}
              />

              {addresses.length > 0 ? (
                <TouchableOpacity
                  onPress={() => setMode("list")}
                  style={styles.linkButton}
                >
                  <Text style={styles.linkButtonText}>Use a saved address instead</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.bottomBar}>
        {mode === "new" ? (
          <TouchableOpacity
            style={[styles.primaryButton, (!canSubmitNew || saving) && styles.primaryButtonDisabled]}
            onPress={handleCreate}
            disabled={!canSubmitNew || saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Save address</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.primaryButton, !selectedAddressId && styles.primaryButtonDisabled]}
            onPress={handleContinue}
            disabled={!selectedAddressId}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Continue</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  keyboardView: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  backButton: { padding: 4 },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "Inter",
  },
  stepLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontFamily: "Inter",
  },
  progressBar: {
    height: 3,
    backgroundColor: "#F3F4F6",
  },
  progressFill: {
    height: 3,
    backgroundColor: "#FF2800",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 140,
    backgroundColor: "#FFFFFF",
  },
  addressCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  addressCardSelected: {
    borderColor: "#FF2800",
    backgroundColor: "#FFFFFF",
  },
  recipientText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "Inter",
    marginBottom: 2,
  },
  addressLine: {
    fontSize: 13,
    color: "#374151",
    fontFamily: "Inter",
    marginBottom: 2,
  },
  addressPhone: {
    fontSize: 13,
    color: "#6B7280",
    fontFamily: "Inter",
    marginTop: 2,
  },
  addNewButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FF2800",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
  },
  addNewText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FF2800",
    fontFamily: "Inter",
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    fontFamily: "Inter",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
    fontFamily: "Inter",
    backgroundColor: "#FAFAFA",
  },
  linkButton: {
    marginTop: 16,
    alignSelf: "center",
  },
  linkButtonText: {
    fontSize: 14,
    color: "#FF2800",
    fontFamily: "Inter",
    fontWeight: "600",
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 13,
    fontFamily: "Inter",
    marginTop: 14,
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
  primaryButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter",
  },
});
