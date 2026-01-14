import 'intl';
import 'intl/locale-data/jsonp/en'; 
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import 'react-native-svg';
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
  Animated,
  Alert,
} from "react-native";
import {
  NavigationContainer,
  getFocusedRouteNameFromRoute,
  DefaultTheme,
  DarkTheme as NavigationDarkTheme,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import * as Notifications from "expo-notifications";
import * as ExpoSplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import { Ionicons } from "@expo/vector-icons";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebaseConfig";

ExpoSplashScreen.preventAutoHideAsync().catch(() => {});

global.getImageUri = (img) => {
  if (!img) return "https://via.placeholder.com/400x300.png?text=No+Image";
  if (typeof img === "string") return img;
  if (img.uri) return img.uri;
  if (img._url) return img._url;
  if (img.url) return img.url;
  if (img.downloadURL) return img.downloadURL;
  return "https://via.placeholder.com/400x300.png?text=No+Image";
};

WebBrowser.maybeCompleteAuthSession();

import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ListingProvider } from "./context/ListingContext";
import { UserProvider } from "./context/UserContext";
import { BookmarkProvider } from "./context/BookmarkContext";
import { NotificationProvider } from "./context/NotificationContext";
import { CartProvider } from "./context/CartContext";
import { AdsProvider } from "./context/AdsContext";
import { MessageProvider } from "./context/MessageProvider";
import { ListingTabProvider } from "./context/ListingTabContext"; // ← Added

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
import VendorCategory from "./screens/VendorCategory.jsx";
import PublicProfileScreen from "./screens/Profile/PublicProfileScreen.jsx";
import EditProfile from "./screens/EditProfile.jsx";
import Settings from "./screens/settings.jsx";
import GetVerified from "./screens/GetVerified.jsx";
import ListingDetails from "./screens/ListingDetails.jsx";
import GalleryScreen from "./screens/GalleryScreen.jsx";
import MyListings from "./screens/MyListings.jsx";
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
import OrderSummary from "./screens/OrderSummary.jsx";
import FlutterwavePayment from "./screens/FlutterwavePayment.jsx";
import AdsZone from "./screens/AdsZone.jsx";
import UserSearch from "./screens/UserSearch.jsx";
import VisitorListings from "./screens/VisitorListings.jsx";
import ProfileListingsScreen from "./screens/ProfileListingsScreen.jsx";
import PaystackWebView from "./screens/PaystackWebView.jsx";
import Wallet from "./screens/Wallet.jsx";
import Privacy from "./screens/Privacy.jsx";
import Payments from "./screens/Payments.jsx";
import Accessibility from "./screens/Accessibility.jsx";
import SwitchAccount from "./screens/SwitchAccount.jsx";
import BoostPost from "./screens/BoostPost.jsx";
import BoostInsights from "./screens/BoostInsights.jsx";
import HelpSupport from './screens/HelpSupport.jsx';

import HomeTopHeader from "./component/HomeTopHeader";
import ProfileTopBar from "./component/ProfileTopBar";
import VendorHeader from "./component/VendorHeader";
import VendorSearchHeader from "./component/VendorSearchHeader";
import SearchHeader from "./component/SearchHeader";
import ConversationHeader from "./component/ConversationHeader";
import ListingHeader from "./component/ListingHeader";
import BackIcon from "./assets/icons/back.png";

import AppTabs from "./navigation/AppTabs";
import VendorTabs from "./navigation/VendorTabs";
import { navigationRef } from "./navigation/RootNavigation";
import AboutApp from "./screens/AboutApp.jsx";
import HotelBookingScreen from "./screens/HotelBookingScreen";

const Stack = createNativeStackNavigator();
const prefix = Linking.createURL("/");

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

if (Platform.OS === "android") {
  Notifications.setNotificationChannelAsync("default", {
    name: "default",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#036dd6",
    sound: true,
  });
}

function PaymentSuccessScreen() {
  return null;
}

const linking = {
  prefixes: [prefix, "roomlink://", "https://roomlink.homes"],
  config: {
    screens: {
      HomeTabs: {
        path: "home",
        screens: {
          Home: "home",
          Profile: "profile",
          Messages: "messages",
          ListingTab: "list",
          Vendor: "vendors",
        },
      },
      PaymentSuccess: "payment-success",
      PublicProfile: { path: "profile/:userId", parse: { userId: String } },
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

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#036dd6" />
      </View>
    );
  }
  return user ? <AppTabs /> : <Login />;
}

function AppInner() {
  const backPressRef = useRef(0);
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const [appReady, setAppReady] = useState(false);
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const prepareApp = async () => {
      try {
        await Font.loadAsync(Ionicons.font);
        await new Promise((r) => setTimeout(r, 1000));
      } catch (e) {
        console.warn("Font loading failed", e);
      } finally {
        setAppReady(true);
        await ExpoSplashScreen.hideAsync();
      }
    };
    prepareApp();
  }, []);

  useEffect(() => {
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (!navigationRef.isReady()) return;

      if (data?.screen) {
        navigationRef.navigate(data.screen, data.params || {});
      } else if (data?.type === "message") {
        navigationRef.navigate("HomeTabs", { screen: "Messages" });
      } else if (data?.type === "order") {
        navigationRef.navigate("Orders");
      } else if (data?.listingId) {
        navigationRef.navigate("ListingDetails", { id: data.listingId });
      }
    });
    return () => responseSubscription.remove(); // ← FIXED: deprecated warning gone
  }, []);

  useEffect(() => {
    const handleUrl = ({ url }) => {
      if (url?.includes("payment-success")) {
        WebBrowser.dismissBrowser();
        Alert.alert(
          "Payment Successful!",
          "Your order has been placed. Thank you!",
          [{ text: "View Orders", onPress: () => navigationRef.navigate("Orders") }]
        );
      }
    };

    const subscription = Linking.addEventListener("url", handleUrl);
    Linking.getInitialURL().then((url) => url && handleUrl({ url }));
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const unsubscribe = navigationRef.addListener("state", () => {
      const state = navigationRef.getRootState();
      const routeName = getFocusedRouteNameFromRoute(state?.routes[state.index]) ?? "";
      const isVendorRoute = ["Vendor", "VendorCategory", "VendorListing"].includes(routeName);
      Animated.timing(translateY, {
        toValue: isVendorRoute ? -10 : 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
    return unsubscribe;
  }, [translateY]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      const state = navigationRef.getRootState();
      const currentRoute = getFocusedRouteNameFromRoute(state?.routes[state.index]) ?? "Home";

      if (["Home", "Profile", "Messages", "ListingTab", "Vendor"].includes(currentRoute)) {
        if (backPressRef.current === 0) {
          backPressRef.current = 1;
          if (typeof global.scrollToTop === "function") global.scrollToTop();
          ToastAndroid.show("Press back again to exit", ToastAndroid.SHORT);
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

      <NavigationContainer ref={navigationRef} theme={isDarkMode ? CustomDarkTheme : DefaultTheme} linking={linking}>
        <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerTitleAlign: "left" }}>
          {/* All your screens — unchanged */}
          <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
          <Stack.Screen name="AuthGate" component={AuthGate} options={{ headerShown: false }} />
          <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
          <Stack.Screen name="Signup" component={Signup} options={{ headerShown: false }} />
          <Stack.Screen name="ForgotPassword" component={ForgotPassword} options={{ headerShown: false }} />
          <Stack.Screen name="RoleSelection" component={RoleSelection} options={{ headerShown: false }} />
          <Stack.Screen name="OtpVerification" component={OtpVerification} options={{ headerShown: false }} />
          <Stack.Screen name="Wallet" component={Wallet} options={{ headerShown: false }} />
          <Stack.Screen name="Privacy" component={Privacy} options={{ title: "Privacy" }} />
          <Stack.Screen name="Payments" component={Payments} options={{ title: "Payments" }} />
          <Stack.Screen name="Accessibility" component={Accessibility} options={{ title: "Accessibility" }} />
          <Stack.Screen name="SwitchAccount" component={SwitchAccount} options={{ title: "Switch account" }} />
          <Stack.Screen name="AboutApp" component={AboutApp} options={{ title: "About app" }} />

          <Stack.Screen name="BoostPost" component={BoostPost} options={{ headerShown: false }} />
          <Stack.Screen name="BoostInsights" component={BoostInsights} options={{ headerShown: false }} />

          <Stack.Screen 
    name="HotelBookingScreen" 
    component={HotelBookingScreen} 
    options={{ 
      title: 'Book Hotel', 
      headerShown: false,
      headerTintColor: '#000',
    }} 
  />
            <Stack.Screen 
    name="HelpSupport" 
    component={HelpSupport} 
    options={{ 
      title: 'Get Help', 
      headerShown: false,
      headerTintColor: '#000',
    }} 
  />

          <Stack.Screen
  name="HomeTabs"
  component={AppTabs}
  options={({ route }) => {
    const routeName = getFocusedRouteNameFromRoute(route) ?? "Home";

    // Hide header when deep inside Messages → Message (chat screen)
    const hideHeaderForMessages = routeName === "Message" || routeName === "Messages";

    const showBack = !["Home", "Profile", "Messages", "ListingTab", "Vendor"].includes(routeName);
    const hideHeaderFor = ["Cart", "Orders"];

    return {
      headerShown: !hideHeaderFor.includes(routeName) && !hideHeaderForMessages,
      headerBackVisible: false,
      headerShadowVisible: false,
      headerStyle: { backgroundColor: isDarkMode ? "#1e1e1e" : "#ffffff", elevation: 0, height: 60 },
      headerTitleContainerStyle: { top: -5 },
      headerTitle:
        routeName === "Home"
          ? () => <HomeTopHeader />
          : routeName === "Profile"
          ? () => <ProfileTopBar />
          : routeName === "Messages" && !hideHeaderForMessages
          ? () => <ConversationHeader />
          : routeName === "ListingTab"
          ? () => <ListingHeader />
          : routeName === "Vendor"
          ? () => <VendorHeader />
          : () => null,
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

          {/* Rest of screens unchanged */}
          <Stack.Screen name="Vendor" component={VendorTabs} options={{ headerShown: false }} />
          <Stack.Screen name="VendorSearch" component={VendorSearch} options={{ headerTitle: () => <VendorSearchHeader />, headerStyle: { height: 80, backgroundColor: isDarkMode ? "#1e1e1e" : "#fff" } }} />
          <Stack.Screen name="Search" component={Search} options={{ headerTitle: () => <SearchHeader />, headerStyle: { height: 80, backgroundColor: isDarkMode ? "#1e1e1e" : "#fff" } }} />
          <Stack.Screen name="VendorUserListing" component={VendorUserListing} options={{ headerShown: false }} />
          <Stack.Screen name="VendorCategory" component={VendorCategory} />
          <Stack.Screen name="VendorListing" component={VendorListingScreen} />
          <Stack.Screen name="VendorListingDetails" component={VendorListingDetails} options={{ headerTransparent: true, headerTitle: "", headerTintColor: "#fff", headerLeftContainerStyle: { marginLeft: 15, marginTop: Platform.OS === "ios" ? 40 : 20 } }} />
          <Stack.Screen name="ListingDetails" component={ListingDetails} options={{ headerTransparent: true, headerTitle: "", headerTintColor: "#fff", headerLeftContainerStyle: { marginLeft: 15, marginTop: Platform.OS === "ios" ? 40 : 20 } }} />
          <Stack.Screen name="AdsZone" component={AdsZone} options={{ title: "" }} />
          <Stack.Screen name="Orders" component={Orders} />
          <Stack.Screen name="Cart" component={Cart} />
          <Stack.Screen name="Checkout" component={Checkout} />
          <Stack.Screen name="OrderSummary" component={OrderSummary} options={{ title: "Order Summary", headerShadowVisible: false, headerStyle: { backgroundColor: isDarkMode ? "#1e1e1e" : "#fff" }, headerTintColor: isDarkMode ? "#fff" : "#000" }} />
          <Stack.Screen name="FlutterwavePayment" component={FlutterwavePayment} options={{ title: "Payment", headerShadowVisible: false, headerStyle: { backgroundColor: isDarkMode ? "#1e1e1e" : "#fff" }, headerTintColor: isDarkMode ? "#fff" : "#000" }} />
          <Stack.Screen name="PaystackWebView" component={PaystackWebView} options={{ title: "Complete Payment", headerShadowVisible: false, headerStyle: { backgroundColor: isDarkMode ? "#1e1e1e" : "#fff" }, headerTintColor: isDarkMode ? "#fff" : "#000" }} />
          
          <Stack.Screen name="GalleryScreen" component={GalleryScreen} options={{ headerShown: false }} />
          
          <Stack.Screen name="RatingScreen" component={RatingScreen} options={{ headerShown: false }} />
          <Stack.Screen name="WriteReview" component={WriteReview} />
          <Stack.Screen name="ReportScreen" component={ReportScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Notification" component={Notification} />
          <Stack.Screen name="BecomeVendor" component={BecomeVendor} options={{ headerShown: false }} />
          <Stack.Screen name="EditListing" component={EditListing} />
          <Stack.Screen name="PublicProfile" component={PublicProfileScreen} />
          <Stack.Screen name="EditProfile" component={EditProfile} options={{ headerShown: false }} />
          
          <Stack.Screen name="Settings" component={Settings} options={{ headerShown: false }} />
          
          <Stack.Screen name="ChangePassword" component={ChangePassword} />
          <Stack.Screen name="GetVerified" component={GetVerified} options={{ headerShown: false }} />
          <Stack.Screen name="IdentityVerification" component={IdentityVerification} />
          <Stack.Screen name="ProfileListingsScreen" component={ProfileListingsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="MyListings" component={MyListings} />
          <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>
    </Animated.View>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <UserProvider>
          <ListingProvider>
            <BookmarkProvider>
              <NotificationProvider>
                <CartProvider>
                  <AdsProvider>
                    <MessageProvider>
                      <ListingTabProvider>
                        <AppInner />
                      </ListingTabProvider>
                    </MessageProvider>
                  </AdsProvider>
                </CartProvider>
              </NotificationProvider>
            </BookmarkProvider>
          </ListingProvider>
        </UserProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}