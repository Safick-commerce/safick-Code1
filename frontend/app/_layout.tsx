import { registerGlobals } from "@livekit/react-native";
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
import { WishlistProvider } from "../context/WishlistContext";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { MessageProvider } from "../context/MessageContext";
import { UserProfileProvider, useUserProfile } from "../context/UserProfileContext";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { SocketProvider } from "../context/SocketContext";
import { LanguageProvider } from "../context/LanguageContext";
import { useAuthGuard } from "../hooks/useAuthGuard";
import Splashscreen from "./screens/Intro/splashscreen";

registerGlobals();

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
    <LanguageProvider>
      <AuthProvider>
        <SocketProvider>
          <UserProfileProvider>
            <BootstrapGate>
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
                    <Stack.Screen name="search" />
                    <Stack.Screen name="unbox-search" />
                    <Stack.Screen
                      name="watch-live"
                      options={{
                        presentation: "fullScreenModal",
                        animation: "slide_from_bottom",
                      }}
                    />
                    <Stack.Screen name="discover-category" />
                    <Stack.Screen name="language" />
                  </Stack>
                  </WishlistProvider>
                </KeyboardProvider>
              </MessageProvider>
            </BootstrapGate>
          </UserProfileProvider>
        </SocketProvider>
      </AuthProvider>
    </LanguageProvider>
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
        <LanguageProvider>
          <Splashscreen />
        </LanguageProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <AppTree />
    </SafeAreaProvider>
  );
}
