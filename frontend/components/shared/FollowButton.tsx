import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { fetchFollowStatus, followSeller, unfollowSeller } from "../../utils/followApi";

type Props = {
  sellerId: string;
  variant?: "profile" | "compact" | "glass";
};

export function FollowButton({ sellerId, variant = "profile" }: Props) {
  const { t } = useLanguage();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchFollowStatus(sellerId)
      .then((res) => {
        if (!cancelled) setFollowing(res.following);
      })
      .catch(() => {
        if (!cancelled) setFollowing(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sellerId]);

  const onPress = useCallback(async () => {
    if (busy || loading) return;
    setBusy(true);
    const next = !following;
    setFollowing(next);
    try {
      if (next) {
        await followSeller(sellerId);
      } else {
        await unfollowSeller(sellerId);
      }
    } catch {
      setFollowing(following);
    } finally {
      setBusy(false);
    }
  }, [busy, following, loading, sellerId]);

  if (loading) {
    return (
      <View style={[styles.button, variant === "profile" && styles.buttonProfile]}>
        <ActivityIndicator size="small" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === "profile" && styles.buttonProfile,
        variant === "glass" && styles.buttonGlass,
        following && variant !== "glass" && styles.buttonActive,
        following && variant === "glass" && styles.buttonGlassActive,
        variant === "compact" && styles.buttonCompact,
      ]}
      onPress={() => void onPress()}
      disabled={busy}
      accessibilityRole="button"
      accessibilityLabel={
        following ? t("user_profile_unfollow") : t("user_profile_follow_seller")
      }
    >
      <Ionicons
        name={following ? "checkmark" : "person-add"}
        size={variant === "compact" ? 14 : 16}
        color="#FFFFFF"
      />
      <Text style={[styles.label, variant === "compact" && styles.labelCompact]}>
        {following ? t("common_following") : t("common_follow")}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#FF2800",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonProfile: {
    marginTop: 12,
    alignSelf: "flex-start",
  },
  buttonCompact: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  buttonGlass: {
    backgroundColor: "rgba(1, 1, 1, 0.46)",
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: "rgba(255, 255, 255, 0.32)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  buttonGlassActive: {
    backgroundColor: "rgba(255, 40, 0, 0.22)",
    borderColor: "rgba(254, 202, 202, 0.45)",
  },
  buttonActive: {
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.45)",
  },
  label: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  labelCompact: {
    fontSize: 12,
  },
});
