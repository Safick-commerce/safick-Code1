import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "./global.css";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { WishlistProvider } from "../context/WishlistContext";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
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
    </SafeAreaProvider>
  );
}
