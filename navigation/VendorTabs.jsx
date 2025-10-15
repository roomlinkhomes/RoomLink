import React from "react";
import { useColorScheme } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";


// Screens
import VendorScreen from "../screens/vendor";
import OrdersScreen from "../screens/orders";
import CollectionScreen from "../screens/collections";
import SearchScreen from "../screens/search";

// Icons (SVG)
import VendorIcon from "../assets/icons/vendor.svg";
import OrdersIcon from "../assets/icons/order.svg";
import CollectionIcon from "../assets/icons/collection.svg";
import SearchIcon from "../assets/icons/search.svg";

const Tab = createBottomTabNavigator();

export default function VendorTabs() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDarkMode ? "#121212" : "#ffffff",
          borderTopWidth: 0,
          height: 60,
        },
        tabBarActiveTintColor: "#1A237E", // Blue for active
        tabBarInactiveTintColor: isDarkMode ? "#ffffff" : "#888888", // White in dark, gray in light
        tabBarLabelStyle: { fontSize: 12 },
      }}
    >
      <Tab.Screen
        name="vendor"
        component={VendorScreen}
        options={{
          tabBarLabel: "Vendor",
          tabBarIcon: ({ color }) => <VendorIcon width={24} height={24} fill={color} />,
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{
          tabBarLabel: "Orders",
          tabBarIcon: ({ color }) => <OrdersIcon width={24} height={24} fill={color} />,
        }}
      />
      <Tab.Screen
        name="Collection"
        component={CollectionScreen}
        options={{
          tabBarLabel: "Collection",
          tabBarIcon: ({ color }) => <CollectionIcon width={24} height={24} fill={color} />,
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarLabel: "Search",
          tabBarIcon: ({ color }) => <SearchIcon width={24} height={24} fill={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
	
