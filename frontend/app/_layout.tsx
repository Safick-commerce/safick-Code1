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

SplashScreen.preventAutoHideAsync();

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
                <StatusBar style="dark" />
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: {
                      backgroundColor: "#ffffff",
                    },
                  }}
                />
              </WishlistProvider>
            </KeyboardProvider>
          </MessageProvider>
        </UserProfileProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
