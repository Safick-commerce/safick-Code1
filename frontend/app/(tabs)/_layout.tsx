import type { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { PlatformPressable } from "@react-navigation/elements";
import { Tabs } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useLanguage } from "../../context/LanguageContext";

function HapticTabBarButton(props: BottomTabBarButtonProps) {
  return (
    <PlatformPressable
      {...props}
      onPressIn={(ev) => {
        if (Platform.OS !== "web") {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}
    />
  );
}

export default function TabsLayout() {
  const { t } = useLanguage();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#FF2800", // primary-600
        tabBarInactiveTintColor: "#000000", // gray-400
        animation: "fade",
        tabBarButton: (props) => <HapticTabBarButton {...props} />,
        tabBarLabelStyle: {
          marginTop: 2, // Reduces space between icon and title
          textAlign: 'center', // Centers the text labels
        },
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#E5E7EB",
          height: 105,
          paddingBottom: 4,
          paddingTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs_home"),
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons 
            name={focused ? "home" : "home-variant-outline"} 
            size={30} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: t("tabs_categories"),
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name={focused ? "text-box-search" : "text-box-search-outline"}
              size={30}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="unbox"
        options={{
          title: t("tabs_unbox"),
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name={focused ? "package-variant" : "package-variant-closed"}
              size={30}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("tabs_profile"),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
            name={focused ? "person" : "person-outline"} 
            size={30} 
            color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="userTab"
        options={{
          href: null, // Hide from tab bar but keep accessible via navigation
        }}
      />
      <Tabs.Screen
        name="edit_profile"
        options={{
          href: null, // Hide from tab bar but keep accessible via navigation
        }}
      />
    </Tabs>
  );
}

