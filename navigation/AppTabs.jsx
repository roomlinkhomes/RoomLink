import React, { useEffect, useState, useMemo } from "react";
import {
  Image,
  useColorScheme,
  View,
  Text,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  getFocusedRouteNameFromRoute,
  useNavigation,          // ✅ FIX
} from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useUser } from "../context/UserContext";
import { onSnapshot, doc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useMessageCount } from "../context/MessageProvider.jsx";

// Screens
import Home from "../screens/home";
import ListingScreen from "../screens/listing";
import VendorScreen from "../screens/vendor";
import MyProfileScreen from "../screens/Profile/MyProfileScreen.jsx";
import MessagesStack from "./MessagesStack";

const Tab = createBottomTabNavigator();

const SIZES = {
  default: 26,
  plus: 30,
  vendor: 24,
};

export default function AppTabs() {
  const navigation = useNavigation();   // ✅ FIX
  const { user } = useUser();
  const [liveUser, setLiveUser] = useState(null);
  const { unreadConversations: unreadCount } = useMessageCount();
  const scheme = useColorScheme();
  const isDarkMode = scheme === "dark";

  const theme = {
    tabBarBackground: isDarkMode ? "#121212" : "#fafafa",
    tabBarActive: isDarkMode ? "#00ff7f" : "#017a6b",
    tabBarInactive: isDarkMode ? "#b0b0b0" : "#666",
    tabBarVendorActive: "#017a6b",
    badgeBackground: "#ef4444",
    badgeText: "#ffffff",
  };

  // Realtime avatar listener
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists()) {
        setLiveUser({ uid: user.uid, ...snap.data() });
      }
    });
    return () => unsub();
  }, [user?.uid]);

  const tabBarStyle = {
    backgroundColor: theme.tabBarBackground,
    height: Platform.OS === "ios" ? 70 : 65,
    paddingBottom: Platform.OS === "ios" ? 24 : 8,
    paddingTop: 8,
  };

  const screenOptions = useMemo(
    () => ({ route }) => {
      const focusedRouteName =
        getFocusedRouteNameFromRoute(route) ?? route.name;

      const hideTabBarRoutes = [
        "Message",
        "Listing",
        "VendorListing",
        "VendorCategory",
        "ListingDetails",
        "VendorListingDetails",
        "Search",
      ];

      const isHidden = hideTabBarRoutes.includes(focusedRouteName);

      return {
        headerShown: false,
        tabBarActiveTintColor: theme.tabBarActive,
        tabBarInactiveTintColor: theme.tabBarInactive,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: isHidden ? { display: "none" } : tabBarStyle,
        tabBarHideOnKeyboard: true,
        tabBarPressColor: "transparent",
        tabBarPressOpacity: 1,
      };
    },
    [theme]
  );

  const MessageBadge = ({ count }) => {
    if (!count) return null;
    return (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>
          {count > 99 ? "99+" : count}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 70 : 0}
      enabled={Platform.OS === "ios"}
    >
      <Tab.Navigator screenOptions={screenOptions}>
        <Tab.Screen
          name="Home"
          component={Home}
          options={{
            tabBarLabel: "Home",
            tabBarIcon: ({ focused }) => (
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={SIZES.default}
                color={focused ? theme.tabBarActive : theme.tabBarInactive}
              />
            ),
          }}
        />

        <Tab.Screen
          name="Messages"
          component={MessagesStack}
          options={{
            tabBarLabel: "Messages",
            tabBarIcon: ({ focused }) => (
              <View style={styles.iconContainer}>
                <Ionicons
                  name={focused ? "chatbubble" : "chatbubble-outline"}
                  size={SIZES.default}
                  color={focused ? theme.tabBarActive : theme.tabBarInactive}
                />
                <MessageBadge count={unreadCount} />
              </View>
            ),
          }}
        />

        <Tab.Screen
          name="ListingTab"
          component={ListingScreen}
          options={{
            tabBarLabel: "List",
            tabBarIcon: ({ focused }) => (
              <Ionicons
                name={focused ? "add-circle" : "add-circle-outline"}
                size={SIZES.plus}
                color={focused ? theme.tabBarActive : theme.tabBarInactive}
              />
            ),
          }}
        />

        <Tab.Screen
          name="Vendor"
          component={VendorScreen}
          options={{
            tabBarLabel: "Vendors",
            tabBarIcon: ({ focused }) => (
              <Ionicons
                name={focused ? "storefront" : "storefront-outline"}
                size={SIZES.vendor}
                color={focused ? theme.tabBarVendorActive : theme.tabBarInactive}
              />
            ),
          }}
        />

        <Tab.Screen
          name="Profile"
          component={MyProfileScreen}
          options={{
            tabBarLabel: "You",
            tabBarIcon: ({ focused }) => {
              const avatar = liveUser?.avatar || user?.avatar;
              return avatar ? (
                <Image
                  source={{ uri: avatar }}
                  style={[
                    styles.avatar,
                    {
                      borderWidth: focused ? 3 : 1,
                      borderColor: focused
                        ? theme.tabBarActive
                        : theme.tabBarInactive,
                    },
                  ]}
                />
              ) : (
                <Ionicons
                  name={focused ? "person" : "person-outline"}
                  size={SIZES.default}
                  color={focused ? theme.tabBarActive : theme.tabBarInactive}
                />
              );
            },
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              navigation.navigate("HomeTabs", {
                screen: "Profile",
                params: { userId: undefined },
              });
            },
          }}
        />
      </Tab.Navigator>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  tabLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  iconContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    right: -8,
    top: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
});
