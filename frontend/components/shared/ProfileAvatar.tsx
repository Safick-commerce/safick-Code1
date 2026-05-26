import { View, Image, StyleSheet, type ImageStyle, type StyleProp, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type ProfileAvatarProps = {
  uri?: string | null;
  size?: number;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  iconColor?: string;
};

export function ProfileAvatar({
  uri,
  size = 40,
  style,
  containerStyle,
  iconColor = "#6B7280",
}: ProfileAvatarProps) {
  const radius = size / 2;
  const trimmed = uri?.trim();

  if (trimmed) {
    return (
      <Image
        source={{ uri: trimmed }}
        style={[{ width: size, height: size, borderRadius: radius, backgroundColor: "#E5E7EB" }, style]}
        resizeMode="cover"
      />
    );
  }

  return (
    <View
      style={[
        styles.placeholder,
        { width: size, height: size, borderRadius: radius },
        containerStyle,
      ]}
    >
      <Ionicons name="person" size={Math.round(size * 0.45)} color={iconColor} />
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
});
