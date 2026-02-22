import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "./global.css";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { WishlistProvider } from "../context/WishlistContext";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { MessageProvider } from "../context/MessageContext";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <MessageProvider>
      <KeyboardProvider>
        <WishlistProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { 
                backgroundColor: "#ffffff" ,
              },
            }}
          />
        </WishlistProvider>
      </KeyboardProvider>
      </MessageProvider>
    </SafeAreaProvider>
  );
}
