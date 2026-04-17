import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Image,
  useColorScheme,
  View,
  Text,
  StyleSheet,
  Platform,
} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { getFocusedRouteNameFromRoute, CommonActions } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
// Used for the thick plus icon
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
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
  container: 32, // Consistent container size prevents jitter
};

const MessageBadge = React.memo(({ count }) => {
  if (!count) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > 99 ? "99+" : count}</Text>
    </View>
  );
});

const ProfileIcon = React.memo(({ avatar, focused, tabBarActive, tabBarInactive }) => {
  // FIX: Prevents "Image source null" warning by validating string
  const hasValidAvatar = typeof avatar === 'string' && avatar.trim().length > 0;

  return (
    <View style={styles.iconContainer}>
      {hasValidAvatar ? (
        <Image
          source={{ uri: avatar }}
          style={[
            styles.avatar,
            {
              width: SIZES.avatar,
              height: SIZES.avatar,
              borderWidth: focused ? 2 : 1,
              borderColor: focused ? tabBarActive : tabBarInactive,
            },
          ]}
        />
      ) : (
        <Ionicons
          name={focused ? "person" : "person-outline"}
          size={SIZES.icon}
          color={focused ? tabBarActive : tabBarInactive}
        />
      )}
    </View>
  );
});

export default function AppTabs() {
  const { user } = useUser();
  const [liveUser, setLiveUser] = useState(null);
  const [hasNewPosts, setHasNewPosts] = useState(false);

  const { unreadConversations: unreadCount } = useMessageCount();
  const { upcomingCount } = useTripCount();

  const scheme = useColorScheme();
  const isDarkMode = scheme === "dark";

  const theme = useMemo(() => ({
    tabBarActive: isDarkMode ? "#00ff7f" : "#017a6b",
    tabBarInactive: isDarkMode ? "#b0b0b0" : "#666",
    tabBarBackground: isDarkMode ? "#121212" : "#fafafa",
    borderTopColor: isDarkMode ? "#333" : "#ddd",
  }), [isDarkMode]);

  const tabBarStyle = useMemo(() => ({
    backgroundColor: theme.tabBarBackground,
    height: Platform.OS === "ios" ? 88 : 64,
    paddingBottom: Platform.OS === "ios" ? 32 : 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.borderTopColor,
    elevation: 0,
    shadowOpacity: 0,
  }), [theme]);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setLiveUser(prev => prev?.avatar === data.avatar ? prev : { uid: user.uid, avatar: data.avatar });
      }
    });
    return () => unsub();
  }, [user?.uid]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!!global.hasNewPosts !== hasNewPosts) {
        setHasNewPosts(!!global.hasNewPosts);
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [hasNewPosts]);

  const screenOptions = useCallback(({ route }) => {
    const routeName = getFocusedRouteNameFromRoute(route) ?? route.name;
    const hideTabBarRoutes = [
      "Message", "ListingTab", "VendorListing", "VendorCategory", 
      "ListingDetails", "VendorListingDetails", "Search"
    ];
    
    const isHidden = hideTabBarRoutes.includes(routeName);

    return {
      headerShown: false,
      tabBarActiveTintColor: theme.tabBarActive,
      tabBarInactiveTintColor: theme.tabBarInactive,
      tabBarLabelStyle: styles.tabLabel,
      tabBarHideOnKeyboard: true,
      tabBarStyle: isHidden ? { display: 'none' } : tabBarStyle,
      tabBarItemStyle: { height: 50 },
    };
  }, [theme, tabBarStyle]);

  return (
    <Tab.Navigator screenOptions={screenOptions} backBehavior="history">
      <Tab.Screen
        name="Home"
        component={Home}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            if (navigation.isFocused()) {
              e.preventDefault();
              global.scrollToTop?.();
            }
          },
        })}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconContainer}>
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={SIZES.icon}
                color={focused ? theme.tabBarActive : theme.tabBarInactive}
              />
              {hasNewPosts && <View style={styles.newDot} />}
            </View>
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
                name={focused ? "mail" : "mail-outline"}
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
            <View style={styles.iconContainer}>
              <View style={[
                styles.postRect, 
                { borderColor: focused ? theme.tabBarActive : theme.tabBarInactive }
              ]}>
                {/* FIX: Swapped to 'plus-thick' for a bolder weight inside the box */}
                <MaterialCommunityIcons 
                  name="plus-thick" 
                  size={16} 
                  color={focused ? theme.tabBarActive : theme.tabBarInactive} 
                />
              </View>
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="Trips"
        component={Trips}
        options={{
          tabBarLabel: "Trips",
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconContainer}>
              <Ionicons
                name={focused ? "calendar" : "calendar-outline"}
                size={SIZES.icon}
                color={focused ? theme.tabBarActive : theme.tabBarInactive}
              />
              {upcomingCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{upcomingCount > 9 ? "9+" : upcomingCount}</Text>
                </View>
              )}
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="Profile"
        component={MyProfileScreen}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.dispatch(CommonActions.reset({
              index: 0,
              routes: [{ name: "Profile", params: { userId: null } }],
            }));
          },
        })}
        options={{
          tabBarLabel: "You",
          tabBarIcon: ({ focused }) => (
            <ProfileIcon
              avatar={liveUser?.avatar || user?.avatar}
              focused={focused}
              tabBarActive={theme.tabBarActive}
              tabBarInactive={theme.tabBarInactive}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  iconContainer: {
    width: SIZES.container,
    height: SIZES.container,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    right: -4,
    top: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "900",
    paddingHorizontal: 2,
  },
  avatar: {
    borderRadius: SIZES.avatar / 2,
  },
  postRect: {
    width: 26,
    height: 19,
    borderRadius: 6,
    borderWidth: 2.2, // Box weight
    alignItems: "center",
    justifyContent: "center",
  },
  newDot: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ff3b30",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
});