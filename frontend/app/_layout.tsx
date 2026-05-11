import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import {
  useFonts,
  PlayfairDisplay_800ExtraBold,
} from "@expo-google-fonts/playfair-display";
import "./global.css";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { WishlistProvider } from "../context/WishlistContext";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { MessageProvider } from "../context/MessageContext";
import { UserProfileProvider } from "../context/UserProfileContext";
import { AuthProvider } from "../context/AuthContext";
import { useAuthGuard } from "../hooks/useAuthGuard";

SplashScreen.preventAutoHideAsync();

function AuthGate() {
  useAuthGuard();
  return null;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlayfairDisplay_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <UserProfileProvider>
          <MessageProvider>
            <KeyboardProvider>
              <WishlistProvider>
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
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="auth" />
                  <Stack.Screen name="cart" />
                  <Stack.Screen name="messages" />
                  <Stack.Screen name="notifications" />
                  <Stack.Screen name="wishlist" />
                </Stack>
              </WishlistProvider>
            </KeyboardProvider>
          </MessageProvider>
        </UserProfileProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
