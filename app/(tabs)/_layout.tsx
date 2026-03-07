import { Tabs } from "expo-router";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import type { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faBox, faBoxOpen } from "@fortawesome/free-solid-svg-icons";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";


export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#FF2800", // primary-600
        tabBarInactiveTintColor: "#000000", // gray-400
        tabBarLabelStyle: {
          marginTop: 2, // Reduces space between icon and title
          textAlign: 'center', // Centers the text labels
        },
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#E5E7EB",
          height: 90,
          paddingBottom: 4,
          paddingTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons name={focused ? "home" : "home-variant-outline"} size={30} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: "Categories",
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons name="text-search" size={30} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="unbox"
        options={{
          title: "Unbox",
          tabBarIcon: ({ color, focused }) => (
            <FontAwesomeIcon
              icon={(focused ? faBoxOpen : faBox) as IconProp}
              size={30}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={30} color={color} />
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
        name="productDetails"
        options={{
          href: null, // Hide from tab bar but keep accessible via navigation
        }}
      />
      <Tabs.Screen
        name="userprofile"
        options={{
          href: null, // Hide from tab bar but keep accessible via navigation
        }}
      />
    </Tabs>
  );
}

