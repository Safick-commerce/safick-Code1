// =============================================================================
// /seller-payout — MoMo wallet where escrow releases are paid out.
// =============================================================================
// SAFICK pays sellers automatically via Maviance S3P cashin (MTN / Orange only).
// =============================================================================

import {
  ActivityIndicator,
  Alert,
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
import { useCallback, useEffect, useState } from "react";
import {
  getSellerPayout,
  updateSellerPayout,
  type SellerPayout,
} from "../utils/checkoutApi";

const PHONE_REGEX = /^6[0-9]{8}$/;
function normalizePhone(raw: string): string {
  return raw.replace(/[\s\-\(\)]/g, "").replace(/^\+?237/, "");
}

export default function SellerPayoutScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [momoNumber, setMomoNumber] = useState("");
  const [momoOperator, setMomoOperator] = useState<"mtn" | "orange">("mtn");
  const [existing, setExisting] = useState<SellerPayout | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getSellerPayout();
        setExisting(data);
        if (data.payoutMomoNumber) {
          setMomoNumber(data.payoutMomoNumber);
          setMomoOperator(data.payoutMomoOperator ?? "mtn");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load payout details.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onSave = useCallback(async () => {
    setError(null);
    const cleaned = normalizePhone(momoNumber.trim());
    if (!PHONE_REGEX.test(cleaned)) {
      setError("Enter a 9-digit Cameroon mobile number starting with 6.");
      return;
    }
    setSaving(true);
    try {
      const updated = await updateSellerPayout({
        payoutMomoNumber: cleaned,
        payoutMomoOperator: momoOperator,
      });
      setExisting(updated);
      Alert.alert("Saved", "Payout details updated.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save payout details.");
    } finally {
      setSaving(false);
    }
  }, [momoNumber, momoOperator, router]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="keyboard-arrow-left" size={32} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payout details</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#FF2800" />
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.infoBanner}>
              <Ionicons name="shield-checkmark" size={18} color="#065F46" />
              <Text style={styles.infoBannerText}>
                After a buyer confirms delivery, we send your payout automatically to
                your Mobile Money wallet.
              </Text>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.sectionTitle}>Mobile Money</Text>

              <Text style={styles.label}>Operator</Text>
              <View style={styles.opRow}>
                <TouchableOpacity
                  style={[styles.opChip, momoOperator === "mtn" && styles.opChipActive]}
                  onPress={() => setMomoOperator("mtn")}
                >
                  <Text
                    style={[
                      styles.opChipText,
                      momoOperator === "mtn" && styles.opChipTextActive,
                    ]}
                  >
                    MTN MoMo
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.opChip, momoOperator === "orange" && styles.opChipActive]}
                  onPress={() => setMomoOperator("orange")}
                >
                  <Text
                    style={[
                      styles.opChipText,
                      momoOperator === "orange" && styles.opChipTextActive,
                    ]}
                  >
                    Orange Money
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>MoMo number</Text>
              <TextInput
                value={momoNumber}
                onChangeText={setMomoNumber}
                placeholder="6XX XX XX XX"
                keyboardType="phone-pad"
                style={styles.input}
                autoCorrect={false}
                maxLength={20}
              />
              <Text style={styles.hint}>
                9-digit Cameroon number. Payouts go directly to this wallet.
              </Text>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {existing?.payoutMomoNumber ? (
              <Text style={styles.currentlySetText}>
                Currently set to {existing.payoutMomoOperator?.toUpperCase()}{" "}
                {existing.payoutMomoNumber}.
              </Text>
            ) : null}
          </ScrollView>

          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={onSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save payout details</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
  },
  scrollContent: { padding: 16, paddingBottom: 120, gap: 14 },
  infoBanner: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    color: "#065F46",
    fontFamily: "Inter",
    lineHeight: 19,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "Inter",
    marginBottom: 4,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
    gap: 8,
  },
  opRow: {
    flexDirection: "row",
    gap: 10,
  },
  opChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  opChipActive: {
    borderColor: "#FF2800",
    backgroundColor: "#ffffff",
  },
  opChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    fontFamily: "Inter",
  },
  opChipTextActive: {
    color: "#FF2800",
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    fontFamily: "Inter",
    marginTop: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: "Inter",
    color: "#111827",
    backgroundColor: "#ffffff",
  },
  hint: {
    fontSize: 12,
    color: "#6B7280",
    fontFamily: "Inter",
    marginTop: 4,
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 14,
    fontFamily: "Inter",
  },
  currentlySetText: {
    fontSize: 12,
    color: "#6B7280",
    fontFamily: "Inter",
    fontStyle: "italic",
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
  saveButton: {
    height: 52,
    borderRadius: 28,
    backgroundColor: "#FF2800",
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter",
  },
});
