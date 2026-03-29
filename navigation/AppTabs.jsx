// navigation/AppTabs.jsx
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
  useNavigation,
} from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useUser } from "../context/UserContext";
import { onSnapshot, doc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useMessageCount } from "../context/MessageProvider.jsx";
import { useTripCount } from "../context/TripCountProvider";

// Screens
import Home from "../screens/home";
import ListingScreen from "../screens/listing";
import MyProfileScreen from "../screens/Profile/MyProfileScreen.jsx";
import MessagesStack from "./MessagesStack";
import Trips from "../screens/Trips";

const Tab = createBottomTabNavigator();

const SIZES = {
  icon: 22,
  avatar: 24,
};

export default function AppTabs() {
  const navigation = useNavigation();
  const { user } = useUser();
  const [liveUser, setLiveUser] = useState(null);
  const { unreadConversations: unreadCount } = useMessageCount();
  const { upcomingCount } = useTripCount();
  const scheme = useColorScheme();
  const isDarkMode = scheme === "dark";

  const theme = {
    tabBarBackground: isDarkMode ? "#121212" : "#fafafa",
    tabBarActive: isDarkMode ? "#00ff7f" : "#017a6b",
    tabBarInactive: isDarkMode ? "#b0b0b0" : "#666",
  };

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
    height: Platform.OS === "ios" ? 64 : 60,
    paddingBottom: Platform.OS === "ios" ? 20 : 6,
    paddingTop: 6,
  };

  const screenOptions = useMemo(
    () => ({ route }) => {
      const focusedRouteName =
        getFocusedRouteNameFromRoute(route) ?? route.name;

      const hideTabBarRoutes = [
        "Message",
        "ListingTab",
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
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      enabled={Platform.OS === "ios"}
    >
      <Tab.Navigator screenOptions={screenOptions} backBehavior="history">
        <Tab.Screen
          name="Home"
          component={Home}
          options={{
            tabBarLabel: "Home",
            tabBarIcon: ({ focused }) => (
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={SIZES.icon}
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
                  size={SIZES.icon}
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
            tabBarLabel: "Post",
            tabBarIcon: ({ focused }) => (
              <View
                style={[
                  styles.postRect,
                  {
                    borderColor: focused
                      ? theme.tabBarActive
                      : theme.tabBarInactive,
                  },
                ]}
              >
                <Ionicons
                  name="add"
                  size={16}
                  color={
                    focused ? theme.tabBarActive : theme.tabBarInactive
                  }
                />
              </View>
            ),
          }}
        />

        <Tab.Screen
          name="Trips"
          component={Trips}
          options={{
            tabBarLabel: "trips",
            tabBarIcon: ({ focused }) => (
              <View style={styles.iconContainer}>
                <Ionicons
                  name={focused ? "calendar" : "calendar-outline"}
                  size={SIZES.icon}
                  color={focused ? theme.tabBarActive : theme.tabBarInactive}
                />
                {upcomingCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {upcomingCount > 9 ? "9+" : upcomingCount}
                    </Text>
                  </View>
                )}
              </View>
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
                      width: SIZES.avatar,
                      height: SIZES.avatar,
                      borderWidth: focused ? 2.5 : 1,
                      borderColor: focused
                        ? theme.tabBarActive
                        : theme.tabBarInactive,
                    },
                  ]}
                />
              ) : (
                <Ionicons
                  name={focused ? "person" : "person-outline"}
                  size={SIZES.icon}
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
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  iconContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    right: -7,
    top: -3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "800",
    paddingHorizontal: 4,
  },
  avatar: {
    borderRadius: 12,
  },
  postRect: {
    width: 28,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.7,
    alignItems: "center",
    justifyContent: "center",
  },
});