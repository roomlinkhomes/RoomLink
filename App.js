import React, { useEffect, useRef, useState } from "react";
import {
  BackHandler,
  ToastAndroid,
  Platform,
  TouchableOpacity,
  useColorScheme,
  Image,
  StatusBar,
  View,
  ActivityIndicator,
  Text,
  Animated,
} from "react-native";
import {
  NavigationContainer,
  createNavigationContainerRef,
  getFocusedRouteNameFromRoute,
  DefaultTheme,
  DarkTheme as NavigationDarkTheme,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";
import * as ExpoSplashScreen from "expo-splash-screen";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebaseConfig";

// ✅ Prevent splash from auto-hiding until we manually hide it
ExpoSplashScreen.preventAutoHideAsync().catch(() => {});

// ✅ Providers
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ListingProvider, VendorListingProvider } from "./context/ListingContext";
import { UserProvider } from "./context/UserContext";
import { BookmarkProvider } from "./context/BookmarkContext";
import { NotificationProvider } from "./context/NotificationContext";
import { CartProvider } from "./context/CartContext";

// ✅ Screens
import SplashScreen from "./screens/splashscreen";
import Login from "./screens/login";
import Signup from "./screens/signup";
import ForgotPassword from "./screens/Forgot-Password";
import RoleSelection from "./screens/roleselection.jsx";
import OtpVerification from "./screens/OtpVerification.jsx";
import MessagesScreen from "./screens/message.jsx";
import ListingScreen from "./screens/listing.jsx";
import VendorListingScreen from "./screens/VendorListing.jsx";
import VendorUserListing from "./screens/VendorUserListing.jsx";
import ProfileScreen from "./screens/profile.jsx";
import VendorCategory from "./screens/VendorCategory.jsx";
import UserProfile from "./screens/UserProfile.jsx";
import EditProfile from "./screens/EditProfile.jsx";
import Settings from "./screens/settings.jsx";
import GetVerified from "./screens/GetVerified.jsx";
import ListingDetails from "./screens/ListingDetails.jsx";
import GalleryScreen from "./screens/GalleryScreen.jsx";
import UserListings from "./screens/UserListings.jsx";
import Orders from "./screens/orders.jsx";
import VendorListingDetails from "./screens/VendorListingDetails.jsx";
import RatingScreen from "./screens/RatingScreen.jsx";
import WriteReview from "./screens/WriteReview.jsx";
import ReportScreen from "./screens/ReportScreen.jsx";
import Search from "./screens/search.jsx";
import IdentityVerification from "./screens/IdentityVerification.jsx";
import Notification from "./screens/Notification.jsx";
import ChangePassword from "./screens/ChangePassword.jsx";
import BecomeVendor from "./screens/BecomeVendor.jsx";
import EditListing from "./screens/EditListing.jsx";
import VendorSearch from "./screens/VendorSearch.jsx";
import Cart from "./screens/Cart.jsx";
import Checkout from "./screens/Checkout.jsx";

// ✅ Components
import HomeTopHeader from "./component/HomeTopHeader";
import ProfileLayout from "./component/ProfileLayout";
import ProfileTopBar from "./component/ProfileTopBar";
import VendorHeader from "./component/VendorHeader";
import VendorSearchHeader from "./component/VendorSearchHeader";
import SearchHeader from "./component/SearchHeader";

// ✅ Icons
import BackIcon from "./assets/icons/back.png";

// ✅ Navigation
import AppTabs from "./navigation/AppTabs";
import VendorTabs from "./navigation/VendorTabs";

const Stack = createNativeStackNavigator();
export const navigationRef = createNavigationContainerRef();

const getActiveRouteName = (state) => {
  if (!state) return undefined;
  const route = state.routes[state.index];
  if (route.state) return getActiveRouteName(route.state);
  return route.name;
};

const prefix = Linking.createURL("/");
const linking = {
  prefixes: [prefix, "roomlink://"],
  config: {
    screens: {
      HomeTabs: "home",
      Profile: "profile/:id",
      ListingDetails: "listing/:id",
      Messages: "messages",
      Search: "search",
    },
  },
};

const CustomDarkTheme = {
  ...NavigationDarkTheme,
  colors: {
    ...NavigationDarkTheme.colors,
    background: "#121212",
    card: "#1e1e1e",
    text: "#ffffff",
    border: "#272727",
    notification: "#ff453a",
  },
};

// ✅ AuthGate
function AuthGate() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading)
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );

  if (user) return <AppTabs />;
  return <Login />;
}

// ✅ App Inner
function AppInner() {
  const backPressRef = useRef(0);
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const [appReady, setAppReady] = useState(false);
  const translateY = useRef(new Animated.Value(0)).current; // 👈 For VendorHeader shift

  useEffect(() => {
    const prepare = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } finally {
        setAppReady(true);
        await ExpoSplashScreen.hideAsync();
      }
    };
    prepare();
  }, []);

  // ✅ Listen for navigation changes and push VendorHeader up only
  useEffect(() => {
    const unsubscribe = navigationRef.addListener("state", () => {
      const route = getActiveRouteName(navigationRef.getRootState());
      if (route === "Vendor" || route === "VendorCategory" || route === "VendorListing") {
        Animated.timing(translateY, {
          toValue: -10, // adjust height upwards
          duration: 250,
          useNativeDriver: true,
        }).start();
      } else {
        Animated.timing(translateY, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start();
      }
    });
    return unsubscribe;
  }, [translateY]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      const state = navigationRef.getRootState();
      const current = getActiveRouteName(state);

      if (current === "HomeTabs" || current === "Vendor") {
        if (backPressRef.current === 0) {
          backPressRef.current = 1;
          if (typeof global.scrollToTop === "function") global.scrollToTop();
          if (Platform.OS === "android") {
            ToastAndroid.show("Press back again to exit", ToastAndroid.SHORT);
          }
          setTimeout(() => (backPressRef.current = 0), 2000);
          return true;
        }
        return false;
      }
      return false;
    });

    return () => sub.remove();
  }, []);

  if (!appReady) return null;

  return (
    <Animated.View style={{ flex: 1, transform: [{ translateY }] }}>
      <StatusBar
        translucent={false}
        backgroundColor={isDarkMode ? "#121212" : "#ffffff"}
        barStyle={isDarkMode ? "light-content" : "dark-content"}
      />

      <NavigationContainer
        ref={navigationRef}
        theme={isDarkMode ? CustomDarkTheme : DefaultTheme}
        linking={linking}
      >
        <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerTitleAlign: "left" }}>
          <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AuthGate" component={AuthGate} options={{ headerShown: false }} />
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Signup" component={Signup} />
          <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
          <Stack.Screen name="RoleSelection" component={RoleSelection} />
          <Stack.Screen name="OtpVerification" component={OtpVerification} />

          <Stack.Screen
            name="HomeTabs"
            component={AppTabs}
            options={({ route }) => {
              const routeName = getFocusedRouteNameFromRoute(route) ?? "Home";
              const showBack = routeName !== "Home";
              const hideHeaderFor = ["Cart", "Orders"];

              return {
                headerShown: !hideHeaderFor.includes(routeName),
                headerBackVisible: false,
                headerShadowVisible: false,
                headerStyle: {
                  backgroundColor: isDarkMode ? "#1e1e1e" : "#ffffff",
                  elevation: 0,
                  height: 60,
                },
                headerTitleContainerStyle: { top: -5 },
                headerTitle:
                  routeName === "Home"
                    ? () => <HomeTopHeader />
                    : routeName === "Profile"
                    ? () => <ProfileTopBar />
                    : () => <Text></Text>,
                headerLeft:
                  showBack && routeName !== "Vendor"
                    ? () => (
                        <TouchableOpacity
                          onPress={() =>
                            navigationRef.canGoBack()
                              ? navigationRef.goBack()
                              : navigationRef.navigate("HomeTabs", { screen: "Home" })
                          }
                          style={{ marginLeft: 5, paddingRight: 15 }}
                        >
                          <Image source={BackIcon} style={{ width: 24, height: 24 }} />
                        </TouchableOpacity>
                      )
                    : undefined,
              };
            }}
          />

          <Stack.Screen name="Vendor" component={VendorTabs} options={{ headerShown: false }} />
          <Stack.Screen
            name="VendorSearch"
            component={VendorSearch}
            options={{
              headerBackVisible: false,
              headerTitle: () => <VendorSearchHeader />,
              headerStyle: {
                height: 80,
                backgroundColor: isDarkMode ? "#1e1e1e" : "#fff",
                elevation: 0,
              },
              headerTitleContainerStyle: { width: "100%" },
            }}
          />
          <Stack.Screen
            name="Search"
            component={Search}
            options={{
              headerBackVisible: false,
              headerTitle: () => <SearchHeader />,
              headerStyle: {
                height: 80,
                backgroundColor: isDarkMode ? "#1e1e1e" : "#fff",
                elevation: 0,
              },
              headerTitleContainerStyle: { width: "100%" },
            }}
          />

          {/* Vendor & Listing */}
          <Stack.Screen name="VendorUserListing" component={VendorUserListing} />
          <Stack.Screen name="VendorCategory" component={VendorCategory} />
          <Stack.Screen name="VendorListing" component={VendorListingScreen} />
          <Stack.Screen
            name="VendorListingDetails"
            component={VendorListingDetails}
            options={{
              headerTransparent: true,
              headerTitle: "",
              headerTintColor: "#fff",
              headerBackTitleVisible: false,
              headerShadowVisible: false,
              headerLeftContainerStyle: {
                marginLeft: 15,
                marginTop: Platform.OS === "ios" ? 40 : 20,
              },
            }}
          />
          <Stack.Screen
            name="ListingDetails"
            component={ListingDetails}
            options={{
              headerTransparent: true,
              headerTitle: "",
              headerTintColor: "#fff",
              headerBackTitleVisible: false,
              headerShadowVisible: false,
              headerLeftContainerStyle: {
                marginLeft: 15,
                marginTop: Platform.OS === "ios" ? 40 : 20,
              },
            }}
          />

          {/* Others */}
          <Stack.Screen name="Orders" component={Orders} />
          <Stack.Screen name="Cart" component={Cart} />
          <Stack.Screen name="Checkout" component={Checkout} />
          <Stack.Screen name="GalleryScreen" component={GalleryScreen} />
          <Stack.Screen name="UserListings" component={UserListings} />
          <Stack.Screen name="RatingScreen" component={RatingScreen} />
          <Stack.Screen name="WriteReview" component={WriteReview} />
          <Stack.Screen name="ReportScreen" component={ReportScreen} />
          <Stack.Screen name="Notification" component={Notification} />
          <Stack.Screen name="BecomeVendor" component={BecomeVendor} />
          <Stack.Screen name="EditListing" component={EditListing} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="ProfileLayout" component={ProfileLayout} />
          <Stack.Screen name="UserProfile" component={UserProfile} />
          <Stack.Screen name="EditProfile" component={EditProfile} />
          <Stack.Screen name="Settings" component={Settings} />
          <Stack.Screen name="ChangePassword" component={ChangePassword} />
          <Stack.Screen name="GetVerified" component={GetVerified} />
          <Stack.Screen name="IdentityVerification" component={IdentityVerification} />
        </Stack.Navigator>
      </NavigationContainer>
    </Animated.View>
  );
}

// ✅ MAIN WRAPPER
export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ListingProvider>
          <VendorListingProvider>
            <UserProvider>
              <BookmarkProvider>
                <NotificationProvider>
                  <CartProvider>
                    <AppInner />
                  </CartProvider>
                </NotificationProvider>
              </BookmarkProvider>
            </UserProvider>
          </VendorListingProvider>
        </ListingProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
