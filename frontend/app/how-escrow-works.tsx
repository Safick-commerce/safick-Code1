// =============================================================================
// /how-escrow-works — bilingual (EN + FR) explainer of the SAFICK escrow flow.
// =============================================================================
// Linked from the checkout review screen and the profile "Help & Support" row
// so any buyer / seller can read what "Held safely by SAFICK" actually means
// before they pay. Cameroon launch requires French parity (rule:
// docs-sync-rule + the bilingual commitment in the Cameroon launch strategy).
// =============================================================================

import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

type Lang = "en" | "fr";

interface Step {
  title: string;
  body: string;
}

const CONTENT: Record<Lang, { title: string; steps: Step[]; faqs: { q: string; a: string }[]; footer: string }> = {
  en: {
    title: "How escrow works",
    steps: [
      {
        title: "1. You pay SAFICK",
        body: "When you tap Pay, your MTN MoMo, Orange Money, Express Union, or card payment goes to SAFICK, not directly to the seller. The seller sees the order land immediately but cannot withdraw the money.",
      },
      {
        title: "2. We hold the money",
        body: "Your funds stay in escrow inside SAFICK's Maviance wallet. We do not invest them, we do not lend them, they wait there for you.",
      },
      {
        title: "3. The seller ships your order",
        body: "The seller confirms the order in the chat and ships it. Every status change shows up in the order card inside your conversation.",
      },
      {
        title: "4. You confirm delivery",
        body: "Once you receive the item and it matches the listing, tap Confirm Delivery. Your funds are released to the seller within minutes.",
      },
      {
        title: "Auto-release after 7 days",
        body: "If you forget to confirm, SAFICK auto-releases the funds 7 days after the seller marks the order delivered. You can extend this by opening a dispute first.",
      },
      {
        title: "Disputes freeze the funds",
        body: "If something is wrong, like a wrong item, never delivered, damaged. Open a dispute from the order screen. The money is frozen until a SAFICK moderator decides.",
      },
    ],
    faqs: [
      {
        q: "Is my money safe?",
        a: "Yes. We use Maviance (Smobilpay S3P), the licensed Cameroon payment rail. SAFICK never sees your MoMo PIN — you enter it on your own phone.",
      },
      {
        q: "What if the seller rejects my order?",
        a: "You are refunded automatically, no action needed. The refund lands back in the same MoMo wallet you paid from.",
      },
      {
        q: "What about delivery fees?",
        a: "Delivery cost is agreed between you and the seller in chat — it's not part of the escrowed amount for now.",
      },
      {
        q: "Can I cancel after paying?",
        a: "Yes, while the order is still in 'Funds held' (before the seller accepts). After acceptance, open a dispute.",
      },
    ],
    footer: "Questions? Tap Help & Support in your profile or contact support@safick.com.",
  },
  fr: {
    title: "Comment fonctionne le séquestre",
    steps: [
      {
        title: "1. Vous payez SAFICK",
        body: "En appuyant sur Payer, votre paiement MTN MoMo, Orange Money, Express Union ou carte va à SAFICK, et non directement au vendeur. Le vendeur voit la commande arriver mais ne peut pas retirer l'argent.",
      },
      {
        title: "2. Nous gardons l'argent",
        body: "Vos fonds restent en séquestre dans le portefeuille Maviance de SAFICK. Nous ne les investissons pas, nous ne les prêtons pas, ils attendent pour vous.",
      },
      {
        title: "3. Le vendeur expédie",
        body: "Le vendeur confirme la commande dans le chat puis l'expédie. Chaque changement de statut apparaît sur la carte de commande dans votre conversation.",
      },
      {
        title: "4. Vous confirmez la livraison",
        body: "Une fois l'article reçu et conforme à l'annonce, appuyez sur Confirmer la livraison. Les fonds sont versés au vendeur en quelques minutes.",
      },
      {
        title: "Libération automatique après 7 jours",
        body: "Si vous oubliez de confirmer, SAFICK libère automatiquement les fonds 7 jours après que le vendeur a marqué la commande comme livrée. Vous pouvez prolonger ce délai en ouvrant un litige d'abord.",
      },
      {
        title: "Les litiges gèlent les fonds",
        body: "Si quelque chose ne va pas, comme un mauvais article, non livré, endommagé. Ouvrez un litige depuis l'écran de la commande. L'argent reste gelé jusqu'à la décision d'un modérateur SAFICK.",
      },
    ],
    faqs: [
      {
        q: "Mon argent est-il en sécurité ?",
        a: "Oui. Nous utilisons Maviance (Smobilpay S3P), la passerelle de paiement camerounaise agréée. SAFICK ne voit jamais votre code PIN MoMo — vous le saisissez sur votre propre téléphone.",
      },
      {
        q: "Et si le vendeur refuse ma commande ?",
        a: "Vous êtes remboursé(e) automatiquement, sans rien faire. Le remboursement revient sur le même portefeuille MoMo utilisé pour payer.",
      },
      {
        q: "Et les frais de livraison ?",
        a: "Le coût de la livraison se négocie entre vous et le vendeur dans le chat — il n'est pas inclus dans le montant sous séquestre pour l'instant.",
      },
      {
        q: "Puis-je annuler après avoir payé ?",
        a: "Oui, tant que la commande est encore en « Fonds retenus » (avant l'acceptation du vendeur). Après acceptation, ouvrez un litige.",
      },
    ],
    footer: "Des questions ? Appuyez sur Aide et support dans votre profil ou écrivez à support@safick.com.",
  },
};

export default function HowEscrowWorksScreen() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("en");
  const content = CONTENT[lang];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="keyboard-arrow-left" size={32} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{content.title}</Text>
        <TouchableOpacity
          onPress={() => setLang(lang === "en" ? "fr" : "en")}
          style={styles.langToggle}
        >
          <Text style={styles.langToggleText}>{lang === "en" ? "FR" : "EN"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <Text style={styles.sectionTitle}>{lang === "en" ? "The flow" : "Le déroulement"}</Text>

        {content.steps.map((step, i) => (
          <View key={i} style={styles.stepCard}>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepBody}>{step.body}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>{lang === "en" ? "Questions" : "Questions fréquentes"}</Text>

        {content.faqs.map((faq, i) => (
          <View key={i} style={styles.faqCard}>
            <Text style={styles.faqQuestion}>{faq.q}</Text>
            <Text style={styles.faqAnswer}>{faq.a}</Text>
          </View>
        ))}

        <Text style={styles.footerText}>{content.footer}</Text>
      </ScrollView>
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
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "Inter",
    textAlign: "center",
  },
  langToggle: {
    width: 40,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#FF2800",
    alignItems: "center",
    justifyContent: "center",
  },
  langToggleText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FF2800",
    fontFamily: "Inter",
  },
  scrollContent: { padding: 16, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    fontFamily: "Inter",
    marginBottom: 10,
    marginTop: 4,
  },
  stepCard: {
    backgroundColor: "#FAFAFA",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "Inter",
    marginBottom: 4,
  },
  stepBody: {
    fontSize: 13,
    color: "#4B5563",
    fontFamily: "Inter",
    lineHeight: 19,
  },
  faqCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "Inter",
    marginBottom: 4,
  },
  faqAnswer: {
    fontSize: 13,
    color: "#4B5563",
    fontFamily: "Inter",
    lineHeight: 19,
  },
  footerText: {
    marginTop: 18,
    fontSize: 12,
    color: "#6B7280",
    fontFamily: "Inter",
    fontStyle: "italic",
    textAlign: "center",
  },
});
