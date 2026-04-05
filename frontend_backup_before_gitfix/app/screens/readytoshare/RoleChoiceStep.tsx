import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const RED = "#FF2800";

type Role = "buyer" | "seller";

type Props = {
  selectedRole: Role | null;
  onSelectRole: (role: Role) => void;
  onContinue: () => void;
};

export default function RoleChoiceStep({ selectedRole, onSelectRole, onContinue }: Props) {
  const sellerSelected = selectedRole === "seller";
  const buyerSelected = selectedRole === "buyer";

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>How do you want to use SAFICK?</Text>
      <Text style={styles.subtitle}>Choose your starting mode. You can switch anytime in settings.</Text>

      <TouchableOpacity
        style={[styles.option, styles.sellerOption, sellerSelected && styles.sellerOptionSelected]}
        activeOpacity={0.85}
        onPress={() => onSelectRole("seller")}
      >
        <View style={styles.optionBody}>
          <View style={styles.sellerHeaderIcon}>
            <MaterialCommunityIcons name="storefront-outline" size={22} color="#FFFFFF" />
          </View>
          <Text style={styles.optionTitleLight}>Seller Mode</Text>
          <Text style={styles.optionTextLight}>List products, go live, and start selling faster.</Text>
          <View style={styles.sellerBenefits}>
            <View style={styles.benefitRow}>
              <MaterialCommunityIcons name="check-circle-outline" size={18} color="#FFFFFF" />
              <Text style={styles.benefitText}>Professional inventory tools</Text>
            </View>
         <View style={styles.benefitRow}>
              <MaterialCommunityIcons name="check-circle-outline" size={18} color="#FFFFFF" />
              <Text style={styles.benefitText}>CRM & Lead conversion</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.option, styles.buyerOption, buyerSelected && styles.buyerOptionSelected]}
        activeOpacity={0.85}
        onPress={() => onSelectRole("buyer")}
      >
        <View style={styles.optionBody}>
          <View style={styles.buyerHeaderIcon}>
            <MaterialCommunityIcons name="shopping-outline" size={22} color={RED} />
          </View>
          <Text style={styles.optionTitleDark}>Consumer Mode</Text>
          <Text style={styles.optionTextDark}>Browse and buy products from trusted sellers. No selling features.</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.continueButton, !selectedRole && styles.continueButtonDisabled]}
        activeOpacity={0.85}
        disabled={!selectedRole}
        onPress={onContinue}
      >
        <Text style={styles.continueText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 16,
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    color: "#111827",
    fontWeight: "800",
    fontFamily: "PlayfairDisplay_800ExtraBold",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
    fontFamily: "Inter",
  },
  option: {
    borderRadius: 16,
    padding: 26,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sellerOption: {
    backgroundColor: "#111827",
    borderWidth: 2,
    borderColor: "#111827",
  },
  sellerOptionSelected: {
    borderColor: RED,
  },
  buyerOption: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
  buyerOptionSelected: {
    borderColor: RED,
    backgroundColor: "#FFF1EE",
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  buyerIconWrap: {
    backgroundColor: "#FFF1EE",
  },
  optionBody: {
    flex: 1,
    gap: 2,
  },
  optionTitleLight: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  optionTextLight: {
    color: "#D1D5DB",
    fontSize: 13,
  },
  sellerBenefits: {
    marginTop: 8,
    gap: 6,
  },
  sellerHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  buyerHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFF1EE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  benefitText: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  optionTitleDark: {
    color: "#111827",
    fontSize: 17,
    fontWeight: "700",
  },
  optionTextDark: {
    color: "#6B7280",
    fontSize: 13,
  },
  continueButton: {
    marginTop: 8,
    backgroundColor: RED,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  continueButtonDisabled: {
    opacity: 0.4,
  },
  continueText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
