import { useEffect } from "react";
import { StatusBar, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { markSplashStart } from "../../../constants/splash";

/** Visual splash only — routing is handled in app/index.tsx. */
export default function Splashscreen() {
  useEffect(() => {
    markSplashStart();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <Animated.Image
        source={require("../../../assets/images/safick-prlogo.png")}
        entering={FadeInDown.duration(1200).springify()}
        style={styles.logo}
        resizeMode="contain"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  logo: {
    height: "23%",
    aspectRatio: 1,
  },
});
