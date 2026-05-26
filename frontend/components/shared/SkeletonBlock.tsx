import { useEffect } from "react";
import { StyleSheet, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

type Props = {
  style?: ViewStyle | ViewStyle[];
};

/** Pulsing placeholder block for skeleton loading states. */
export function SkeletonBlock({ style }: Props) {
  const opacity = useSharedValue(0.45);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(1, { duration: 650 }), withTiming(0.45, { duration: 650 })),
      -1,
      false,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.block, style, animatedStyle]} />;
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: "#E5E7EB",
  },
});
