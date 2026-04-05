import { useEffect, useState } from "react";
import { AccessibilityInfo, StyleSheet, View } from "react-native";
import Svg, { Circle, Polygon } from "react-native-svg";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

type Variant = "dark" | "light";

type Props = {
  /** dark = navy banner (#1C1C2E); light = pale / white banner */
  variant?: Variant;
  /** Subtle drift + scale twinkle (off when Reduce motion is on) */
  animated?: boolean;
};

/** Small 4-point star as a diamond */
function SparkStar({
  cx,
  cy,
  size,
  fill,
  opacity = 1,
}: {
  cx: number;
  cy: number;
  size: number;
  fill: string;
  opacity?: number;
}) {
  const s = size / 2;
  const points = `${cx},${cy - s} ${cx + s},${cy} ${cx},${cy + s} ${cx - s},${cy}`;
  return <Polygon points={points} fill={fill} opacity={opacity} />;
}

function BannerSvg({
  dim,
  faint,
  accent,
}: {
  dim: string;
  faint: string;
  accent: string;
}) {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 360 150" preserveAspectRatio="xMidYMid slice">
      <Circle cx={28} cy={22} r={3.2} fill={faint} />
      <Circle cx={312} cy={28} r={2.4} fill={faint} />
      <Circle cx={180} cy={12} r={2} fill={dim} />
      <Circle cx={250} cy={118} r={3} fill={faint} />
      <Circle cx={90} cy={130} r={2.4} fill={faint} />
      <Circle cx={330} cy={95} r={2} fill={dim} />
      <Circle cx={200} cy={88} r={1.8} fill={faint} />

      <SparkStar cx={52} cy={48} size={11} fill={dim} opacity={0.95} />
      <SparkStar cx={300} cy={42} size={8} fill={accent} opacity={0.55} />
      <SparkStar cx={220} cy={24} size={7} fill={dim} opacity={0.75} />
      <SparkStar cx={140} cy={115} size={13} fill={dim} opacity={0.6} />
      <SparkStar cx={28} cy={98} size={8} fill={accent} opacity={0.4} />
      <SparkStar cx={335} cy={62} size={9} fill={dim} opacity={0.7} />
    </Svg>
  );
}

function AnimatedBannerSvg({
  dim,
  faint,
  accent,
}: {
  dim: string;
  faint: string;
  accent: string;
}) {
  const driftY = useSharedValue(0);
  const driftX = useSharedValue(0);
  const twinkle = useSharedValue(0);

  useEffect(() => {
    driftY.value = withRepeat(
      withTiming(1, { duration: 5200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    driftX.value = withRepeat(
      withTiming(1, { duration: 6800, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    twinkle.value = withRepeat(
      withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [driftY, driftX, twinkle]);

  const motionStyle = useAnimatedStyle(() => ({
    opacity: interpolate(twinkle.value, [0, 1], [0.72, 1]),
    transform: [
      { translateX: interpolate(driftX.value, [0, 1], [-7, 7]) },
      { translateY: interpolate(driftY.value, [0, 1], [-5, 5]) },
      { scale: interpolate(twinkle.value, [0, 1], [0.97, 1.06]) },
    ],
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, motionStyle]}>
      <BannerSvg dim={dim} faint={faint} accent={accent} />
    </Animated.View>
  );
}

/**
 * Decorative stars / dots above the banner background.
 * Parent should use overflow: "hidden" and position relative; place this first, then content.
 */
export function ReadyToShareBannerDecoration({ variant = "dark", animated = true }: Props) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    return () => sub.remove();
  }, []);

  const shouldAnimate = animated && !reduceMotion;

  const dim = variant === "dark" ? "rgba(255,255,255,0.18)" : "rgba(255, 40, 0, 0.16)";
  const faint = variant === "dark" ? "rgba(255,255,255,0.1)" : "rgba(17, 24, 39, 0.07)";
  const accent = "rgba(255, 40, 0, 0.42)";

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" accessible={false}>
      {shouldAnimate ? (
        <AnimatedBannerSvg dim={dim} faint={faint} accent={accent} />
      ) : (
        <View style={StyleSheet.absoluteFill}>
          <BannerSvg dim={dim} faint={faint} accent={accent} />
        </View>
      )}
    </View>
  );
}
