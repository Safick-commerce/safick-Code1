import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

const RED = "#FF2800";
const sellerSuccessImage = require("../../../assets/images/seller-success-illustration.png");

export default function RoleChoiceSuccessful() {
  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
      <View style={styles.content}>
        <View style={styles.illustrationWrap}>
          <Image
            source={sellerSuccessImage}
            style={styles.illustration}
            contentFit="contain"
            accessibilityLabel="Seller setup complete"
          />
        </View>

        <Text style={styles.title}>Congratulations!</Text>
        <Text style={styles.subtitle}>
          You&apos;ve successfully set up your seller profile.{"\n"}
          You can now start creating and hosting live streams to sell your products.
        </Text>

        <TouchableOpacity
          style={styles.continueButton}
          activeOpacity={0.85}
          onPress={() => router.replace("/(tabs)/unbox")}
          accessibilityRole="button"
          accessibilityLabel="Go to Unbox"
        >
          <Text style={styles.continueButtonText}>Go to Unbox</Text>
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
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
    gap: 16,
  },
  illustrationWrap: {
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  illustration: {
    width: 280,
    height: 280,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
    fontFamily: "PlayfairDisplay_800ExtraBold",
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#6B7280",
    textAlign: "center",
    fontFamily: "Inter",
  },
  continueButton: {
    marginTop: 12,
    minWidth: 220,
    backgroundColor: RED,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: "center",
  },
  continueButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter",
  },
});
