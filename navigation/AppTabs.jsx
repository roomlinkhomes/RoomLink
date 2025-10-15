// navigation/AppTabs.jsx
import React, { useContext } from "react";
import { TouchableOpacity, Image, useColorScheme } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { getFocusedRouteNameFromRoute } from "@react-navigation/native";
import { UserContext } from "../context/UserContext";

// Screens
import Home from "../screens/home";
import ListingScreen from "../screens/listing";
import VendorScreen from "../screens/vendor";
import ProfileScreen from "../screens/profile";

// Stack for Messages
import MessagesStack from "./MessagesStack"; // stack navigator for messages

// SVGs
import HomeIcon from "../assets/icons/svg/home.svg";
import MessageIcon from "../assets/icons/svg/message.svg";
import PlusIcon from "../assets/icons/svg/plus.svg";
import VendorIcon from "../assets/icons/svg/vendor.svg";
import ProfileIcon from "../assets/icons/svg/profile.svg";

const Tab = createBottomTabNavigator();

export default function AppTabs() {
  const { user } = useContext(UserContext);
  const scheme = useColorScheme();

  const inactiveColor = scheme === "dark" ? "#fff" : "#000";
  const activeColor = "#036dd6";

  // Function to hide tab bar on certain screens
  const getTabBarStyle = (route) => {
    const routeName = getFocusedRouteNameFromRoute(route) ?? "";

    if (routeName === "Message" || routeName === "Listing") {
      return { display: "none" };
    }

    return {
      backgroundColor: scheme === "dark" ? "#1e1e1e" : "#fff",
      height: 70,
      paddingBottom: 10,
      paddingTop: 10,
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      borderTopWidth: 0,
      overflow: "hidden",
    };
  };

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
      }}
    >
      {/* Home */}
      <Tab.Screen
        name="Home"
        component={Home}
        options={({ route }) => ({
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size, focused }) => (
            <HomeIcon
              width={size}
              height={size}
              fill={focused ? color : "none"}
              stroke={color}
              strokeWidth={1.5}
            />
          ),
          tabBarStyle: getTabBarStyle(route),
        })}
      />

      {/* Messages Stack */}
      <Tab.Screen
        name="Messages"
        component={MessagesStack} // stack navigator here
        options={({ route }) => ({
          tabBarLabel: "Messages",
          tabBarIcon: ({ color, size, focused }) => (
            <MessageIcon
              width={size}
              height={size}
              fill={focused ? color : "none"}
              stroke={color}
              strokeWidth={1.5}
            />
          ),
          tabBarStyle: getTabBarStyle(route),
        })}
      />

      {/* Listing (Plus) */}
      <Tab.Screen
        name="ListingTab"
        component={ListingScreen}
        options={{
          tabBarLabel: "",
          tabBarButton: ({ onPress }) => (
            <TouchableOpacity
              onPress={onPress}
              activeOpacity={0.8}
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <PlusIcon width={32} height={32} fill={activeColor} />
            </TouchableOpacity>
          ),
        }}
      />

      {/* Vendor */}
      <Tab.Screen
        name="Vendor"
        component={VendorScreen}
        options={{
          tabBarLabel: "Vendors",
          tabBarStyle: { display: "none" },
          tabBarIcon: ({ color, size, focused }) => (
            <VendorIcon
              width={size}
              height={size}
              fill={focused ? color : "none"}
              stroke={color}
              strokeWidth={1.5}
            />
          ),
        }}
      />

      {/* Profile */}
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: "You",
          tabBarStyle: { display: "none" },
          tabBarIcon: ({ color, focused, size = 24 }) =>
            user?.avatar ? (
              <Image
                source={{ uri: user.avatar }}
                style={{ width: size, height: size, borderRadius: size / 2 }}
              />
            ) : (
              <ProfileIcon
                width={size}
                height={size}
                fill={focused ? color : "none"}
                stroke={color}
                strokeWidth={1.5}
              />
            ),
        }}
      />
    </Tab.Navigator>
  );
}
