import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as ExpoSplashScreen from "expo-splash-screen";
import { useEffect, type ReactNode } from "react";
import {
  useFonts,
  PlayfairDisplay_800ExtraBold,
} from "@expo-google-fonts/playfair-display";
import "./global.css";
import { SafeAreaProvider } from "react-native-safe-area-context";
// Wishlist + Message moved from React Context to Zustand stores under frontend/stores/.
// No Provider wrappers needed — the stores are global singletons consumed via
// useWishlist() / useMessage() hooks at the call sites.
import { KeyboardProvider } from "react-native-keyboard-controller";
import { useUserProfile } from "../stores/userProfileStore";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { SocketProvider } from "../context/SocketContext";
import { useAuthGuard } from "../hooks/useAuthGuard";
import Splashscreen from "./screens/Intro/splashscreen";

ExpoSplashScreen.preventAutoHideAsync().catch(() => {});

function AuthGate() {
  useAuthGuard();
  return null;
}

/**
 * Shows the in-app splash until Supabase session + local profile are restored.
 * Native Expo splash is hidden as soon as this component mounts.
 */
function BootstrapGate({ children }: { children: ReactNode }) {
  const { isReady: authReady } = useAuth();
  const { isLoaded: profileLoaded } = useUserProfile();
  const bootstrapped = authReady && profileLoaded;

  useEffect(() => {
    ExpoSplashScreen.hideAsync().catch(() => {});
  }, []);

  if (!bootstrapped) {
    return <Splashscreen />;
  }

  return children;
}

function AppTree() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BootstrapGate>
          <KeyboardProvider>
              <AuthGate />
              <StatusBar style="dark" />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: {
                    backgroundColor: "#ffffff",
                  },
                }}
              >
                <Stack.Screen name="index" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen
                  name="productDetails"
                  options={{
                    animation: "slide_from_right",
                    gestureEnabled: true,
                  }}
                />
                <Stack.Screen name="auth" />
                <Stack.Screen name="messages" />
                <Stack.Screen name="notifications" />
                <Stack.Screen name="wishlist" />
                <Stack.Screen name="cart" />
                <Stack.Screen name="checkout/address" />
                <Stack.Screen name="checkout/payment" />
                <Stack.Screen name="checkout/review" />
                <Stack.Screen name="checkout/awaiting-pin" />
                <Stack.Screen name="checkout/success" />
                <Stack.Screen name="orders/index" />
                <Stack.Screen name="orders/[id]" />
                <Stack.Screen name="seller-orders" />
                <Stack.Screen name="seller-payout" />
                <Stack.Screen name="how-escrow-works" />
                <Stack.Screen name="search" />
                <Stack.Screen name="unbox-search" />
                <Stack.Screen
                  name="watch-live"
                  options={{
                    presentation: "fullScreenModal",
                    animation: "slide_from_bottom",
                  }}
                />
                <Stack.Screen
                  name="profile-clips"
                  options={{
                    presentation: "fullScreenModal",
                    animation: "slide_from_bottom",
                    contentStyle: { backgroundColor: "#000000" },
                  }}
                />
                <Stack.Screen name="discover-category" />
              </Stack>
          </KeyboardProvider>
        </BootstrapGate>
      </SocketProvider>
    </AuthProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlayfairDisplay_800ExtraBold,
  });

  useEffect(() => {
    if (fontError) {
      ExpoSplashScreen.hideAsync().catch(() => {});
    }
  }, [fontError]);

  if (!fontsLoaded && !fontError) {
    return (
      <SafeAreaProvider>
        <Splashscreen />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <AppTree />
    </SafeAreaProvider>
  );
}
