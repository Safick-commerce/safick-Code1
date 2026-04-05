import { useCallback, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import RoleChoiceStep from "./RoleChoiceStep";
import { useUserProfile } from "../../../context/UserProfileContext";

type Role = "buyer" | "seller";

export default function SellerOnboardingScreen() {
  const router = useRouter();
  const { updateProfile } = useUserProfile();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const handleContinue = useCallback(async () => {
    if (!selectedRole) return;

    await updateProfile({
      readyToSharePromptSeen: true,
      readyToShareMode: selectedRole,
      // Mark complete to avoid loops while recovery is in progress.
      readyToShareSellerOnboardingCompleted: selectedRole === "seller",
    });

    router.back();
  }, [selectedRole, updateProfile, router]);

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right", "bottom"]}>
      <View style={styles.container}>
        <RoleChoiceStep
          selectedRole={selectedRole}
          onSelectRole={setSelectedRole}
          onContinue={handleContinue}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
  },
});
