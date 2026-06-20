// Shows RoleChoiceStep — two cards: Seller Mode vs Buyer Mode
import { useCallback, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import RoleChoiceStep from "./RoleChoiceStep";
import { useAuth } from "../../../context/AuthContext";
import { useUserProfile } from "../../../stores/userProfileStore";
import { syncRoleToRemote } from "../../../utils/profileSync";

type Role = "buyer" | "seller";

export default function SellerOnboardingScreen() {
  const router = useRouter();
  const { user, refetchProfile } = useAuth();
  const { updateProfile } = useUserProfile();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [saving, setSaving] = useState(false);

  const handleContinue = useCallback(async () => {
    if (!selectedRole || saving) return;

    setSaving(true);
    try {
      if (user?.id) {
        const { error } = await syncRoleToRemote(user.id, selectedRole);
        if (error) {
          Alert.alert("Could not save role", error);
          return;
        }
      }

      await updateProfile({
        readyToSharePromptSeen: true,
        readyToShareMode: selectedRole,
        readyToShareSellerOnboardingCompleted: selectedRole === "seller",
      });

      if (user?.id) {
        await refetchProfile();
      }

      if (selectedRole === "seller") {
        router.replace("/screens/readytoshare/rolechoicesuccesful");
        return;
      }

      router.back();
    } finally {
      setSaving(false);
    }
  }, [selectedRole, saving, user?.id, updateProfile, refetchProfile, router]);

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
