import { Stack } from "expo-router";
import { useLanguage } from "../../../context/LanguageContext";

export default function ProductsScreensLayout() {
  const { t } = useLanguage();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTintColor: "#111827",
        headerTitleStyle: { fontWeight: "700" },
        contentStyle: { backgroundColor: "#FFFFFF" },
      }}
    >
      <Stack.Screen name="my-products" options={{ title: t("my_products_title") }} />
    </Stack>
  );
}
