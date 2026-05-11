import { Stack } from "expo-router";

export default function ProductsScreensLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTintColor: "#111827",
        headerTitleStyle: { fontWeight: "700" },
        contentStyle: { backgroundColor: "#FFFFFF" },
      }}
    >
      <Stack.Screen name="create" options={{ title: "New product" }} />
      <Stack.Screen name="my-products" options={{ title: "My products" }} />
    </Stack>
  );
}
