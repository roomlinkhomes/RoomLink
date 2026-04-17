import 'react-native-get-random-values';
if (typeof WeakRef === "undefined") {
  global.WeakRef = class {
    constructor(value) {
      this._value = value;
    }
    deref() {
      return this._value;
    }
  };
}

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
  useColorScheme,
  StatusBar,
  View,
  ActivityIndicator,
  Animated,
  Alert,
  AppState,
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
import * as ExpoSplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import { Ionicons } from "@expo/vector-icons";

// FCM
import {
  getMessaging,
  requestPermission,
  AuthorizationStatus,
  getToken,
  onTokenRefresh,
  registerDeviceForRemoteMessages,
  onMessage,
} from '@react-native-firebase/messaging';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';

import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import Purchases from 'react-native-purchases';

import { SafeAreaProvider } from 'react-native-safe-area-context';

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

// RevenueCat Configuration
const configureRevenueCat = async () => {
  try {
    if (__DEV__) {
      Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
    }
    const apiKey = Platform.OS === 'android'
      ? 'goog_LdPWuZBMhUKwayGKKouYdMmaBGG'
      : 'appl_xxxxxxxxxxxxxxxxxxxxxxxx';
    await Purchases.configure({ apiKey });
    console.log('✅ RevenueCat SDK configured successfully on', Platform.OS);
  } catch (error) {
    console.error('❌ RevenueCat configuration failed:', error);
  }
};

// Providers
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ListingProvider } from "./context/ListingContext";
import { UserProvider, useUser } from "./context/UserContext";
import { BookmarkProvider } from "./context/BookmarkContext";
import { NotificationProvider } from "./context/NotificationContext";
import { CartProvider } from "./context/CartContext";
import { AdsProvider } from "./context/AdsContext";
import { MessageProvider } from "./context/MessageProvider";
import { ListingTabProvider } from "./context/ListingTabContext";
import { TripCountProvider } from "./context/TripCountProvider";

// Screens & Components
import Welcome from './screens/welcome.jsx';
import Login from "./screens/login";
import Signup from "./screens/signup";
import ForgotPassword from "./screens/Forgot-Password";
import RoleSelection from "./screens/roleselection.jsx";
import OtpVerification from "./screens/OtpVerification.jsx";
import SignupSuccess from "./screens/SignupSuccess.jsx";

import HomeTopHeader from "./component/HomeTopHeader";
import ProfileTopBar from "./component/ProfileTopBar";
import VendorHeader from "./component/VendorHeader";
import VendorSearchHeader from "./component/VendorSearchHeader";
import ConversationHeader from "./component/ConversationHeader";
import ListingHeader from "./component/ListingHeader";

import AppTabs from "./navigation/AppTabs";
import VendorTabs from "./navigation/VendorTabs";
import { navigationRef } from "./navigation/RootNavigation";

import AboutApp from "./screens/AboutApp.jsx";
import EventScheduler from "./screens/EventScheduler.jsx";
import RefundScreen from "./screens/RefundScreen.jsx";
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
import GuestDetails from './screens/GuestDetails.jsx';
import Announcements from './screens/Announcements.jsx';
import HotelBookingScreen from "./screens/HotelBookingScreen";
import ChangeEmail from './screens/ChangeEmail.jsx';

const Stack = createNativeStackNavigator();

const prefix = Linking.createURL("/");
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
          Trips: "trips",
        },
      },
      PaymentSuccess: "payment-success",
      PublicProfile: { path: "profile/:userId", parse: { userId: String } },
      ListingDetails: "listing/:id",
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

function MainAppContent() {
  const { user, loading: userLoading } = useUser();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const backPressRef = useRef(0);
  const translateY = useRef(new Animated.Value(0)).current;
  const [appReady, setAppReady] = useState(false);

  // ====================== NOTIFICATION NAVIGATION HANDLER ======================
  const handleNotificationNavigation = (data) => {
    if (!data) return;

    console.log("🔔 Handling notification data:", data);

    if (!navigationRef.isReady()) {
      setTimeout(() => handleNotificationNavigation(data), 800);
      return;
    }

    if (data.screen) {
      if (data.screen === "HomeTabs" && data.params) {
        navigationRef.navigate("HomeTabs", data.params);
      } else {
        navigationRef.navigate(data.screen, data.params || {});
      }
    } 
    else if (data.listingId) {
      navigationRef.navigate("ListingDetails", { id: data.listingId });
    } 
    else if (data.bookingId || data.type === "refund") {
      navigationRef.navigate("RefundScreen");
    } 
    else if (data.type === "new_message") {
      navigationRef.navigate("HomeTabs", { screen: "Messages" });
    } 
    else if (data.type === "new_order") {
      navigationRef.navigate("Orders");
    } 
    else {
      navigationRef.navigate("HomeTabs", { screen: "Home" });
    }
  };

  // Font + Splash + Initial Notification (Quit State)
  useEffect(() => {
    const prepareApp = async () => {
      try {
        await Font.loadAsync(Ionicons.font);

        const initialNotification = await notifee.getInitialNotification();
        if (initialNotification?.notification?.data) {
          console.log('🚀 Opened from quit state via notification', initialNotification.notification.data);
          setTimeout(() => {
            handleNotificationNavigation(initialNotification.notification.data);
          }, 1500);
        }

        await new Promise((r) => setTimeout(r, 800));
      } catch (e) {
        console.warn("Font loading failed", e);
      } finally {
        setAppReady(true);
        await ExpoSplashScreen.hideAsync();
      }
    };
    prepareApp();
  }, []);

  // RevenueCat
  useEffect(() => {
    configureRevenueCat();
  }, []);

  // Deep Linking
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

  // Header Animation
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

  // Back Handler
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

  // ====================== CLEAN FCM + NOTIFEE SETUP (Anti-Spam) ======================
  useEffect(() => {
    if (!user?.id) return;

    let unsubscribeTokenRefresh = null;
    let foregroundListener = null;
    let notifeeForegroundSub = null;

    const setupNotifications = async () => {
      try {
        const messagingInstance = getMessaging();
        const authStatus = await requestPermission(messagingInstance);
        const enabled = authStatus === AuthorizationStatus.AUTHORIZED || authStatus === AuthorizationStatus.PROVISIONAL;

        if (!enabled) return;

        if (Platform.OS === 'ios') {
          await registerDeviceForRemoteMessages(messagingInstance);
        }

        if (Platform.OS === 'android') {
          await notifee.createChannel({
            id: 'default',
            name: 'Default Notifications',
            importance: AndroidImportance.HIGH,
            sound: 'default',
            vibration: true,
            vibrationPattern: [250, 500, 250, 500],
            lights: true,
            lightColor: '#017a6b',
          });
        }

        const token = await getToken(messagingInstance);
        if (token) {
          await updateDoc(doc(db, 'users', user.id), {
            fcmToken: token,
            fcmTokenUpdatedAt: serverTimestamp(),
            platform: Platform.OS,
            pushEnabled: true,
          });
        }

        unsubscribeTokenRefresh = onTokenRefresh(messagingInstance, async (newToken) => {
          await updateDoc(doc(db, 'users', user.id), {
            fcmToken: newToken,
            fcmTokenUpdatedAt: serverTimestamp(),
          });
        });

        // Foreground messages - show via Notifee only
        foregroundListener = onMessage(messagingInstance, async (remoteMessage) => {
          console.log("Foreground message received:", remoteMessage);
          if (Platform.OS === 'android' && remoteMessage.notification) {
            await notifee.displayNotification({
              title: remoteMessage.notification.title || 'New Notification',
              body: remoteMessage.notification.body,
              android: {
                channelId: 'default',
                importance: AndroidImportance.HIGH,
                pressAction: { id: 'default' },
              },
              data: remoteMessage.data || {},
            });
          }
        });

        // Tap in foreground
        notifeeForegroundSub = notifee.onForegroundEvent(({ type, detail }) => {
          if (type === EventType.PRESS) {
            console.log('Tapped (foreground)', detail.notification?.data);
            handleNotificationNavigation(detail.notification?.data);
          }
        });

        // Tap in background or when app was closed
        notifee.onBackgroundEvent(async ({ type, detail }) => {
          if (type === EventType.PRESS) {
            console.log('Tapped (background/quit)', detail.notification?.data);
            setTimeout(() => {
              handleNotificationNavigation(detail.notification?.data);
            }, 1000);
          }
        });

      } catch (error) {
        console.error('[FCM] Setup failed:', error);
      }
    };

    setupNotifications();

    const appStateListener = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') setupNotifications();
    });

    return () => {
      unsubscribeTokenRefresh?.();
      foregroundListener?.();
      notifeeForegroundSub?.();
      appStateListener?.remove();
    };
  }, [user?.id]);

  if (!appReady || userLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: isDarkMode ? "#121212" : "#ffffff" }}>
        <ActivityIndicator size="large" color="#017a6b" />
      </View>
    );
  }

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
        <Stack.Navigator
          initialRouteName={user ? "HomeTabs" : "Welcome"}
          screenOptions={{ headerTitleAlign: "left" }}
        >
          {/* Auth Flow */}
          <Stack.Screen name="Welcome" component={Welcome} options={{ headerShown: false }} />
          <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
          <Stack.Screen name="Signup" component={Signup} options={{ headerShown: false }} />
          <Stack.Screen name="ForgotPassword" component={ForgotPassword} options={{ headerShown: false }} />
          <Stack.Screen name="RoleSelection" component={RoleSelection} options={{ headerShown: false }} />
          <Stack.Screen name="OtpVerification" component={OtpVerification} options={{ headerShown: false }} />
          <Stack.Screen name="SignupSuccess" component={SignupSuccess} options={{ headerShown: false }} />

          {/* Main App Flow */}
          {user && (
            <>
              <Stack.Screen
                name="HomeTabs"
                component={AppTabs}
                options={({ route }) => {
                  const routeName = getFocusedRouteNameFromRoute(route) ?? "Home";
                  const hideHeaderScreens = [
                    "Trips", "Messages", "ListingDetails", "VendorListingDetails",
                    "GalleryScreen", "RatingScreen", "BoostPost", "BoostInsights",
                    "BecomeVendor", "EditListing", "Checkout", "HotelBookingScreen",
                    "GuestDetails", "EventScheduler",
                  ];

                  const hideHeader = hideHeaderScreens.includes(routeName);

                  return {
                    headerShown: !hideHeader,
                    headerBackVisible: false,
                    headerShadowVisible: false,
                    headerStyle: {
                      backgroundColor: isDarkMode ? "#1e1e1e" : "#ffffff",
                      elevation: 0,
                      height: 60,
                    },
                    headerTitle: () => {
                      switch (routeName) {
                        case "Home": return <HomeTopHeader />;
                        case "Profile": return <ProfileTopBar />;
                        case "Messages": return <ConversationHeader />;
                        case "ListingTab": return <ListingHeader />;
                        case "Vendor": return <VendorHeader />;
                        default: return null;
                      }
                    },
                  };
                }}
              />
              <Stack.Screen name="Vendor" component={VendorTabs} options={{ headerShown: false }} />
            </>
          )}

          {/* Shared & Protected Screens */}
          <Stack.Screen name="Search" component={Search} options={{ headerShown: false }} />
          <Stack.Screen name="Wallet" component={Wallet} options={{ headerShown: false }} />
          <Stack.Screen name="Privacy" component={Privacy} options={{ title: "Privacy" }} />
          <Stack.Screen name="Payments" component={Payments} options={{ title: "Payments" }} />
          <Stack.Screen name="Accessibility" component={Accessibility} options={{ title: "Accessibility" }} />
          <Stack.Screen name="SwitchAccount" component={SwitchAccount} options={{ title: "Switch account" }} />
          <Stack.Screen name="AboutApp" component={AboutApp} options={{ title: "About app" }} />
          <Stack.Screen name="BoostPost" component={BoostPost} options={{ headerShown: false }} />
          <Stack.Screen name="BoostInsights" component={BoostInsights} options={{ headerShown: false }} />
          <Stack.Screen name="GuestDetails" component={GuestDetails} options={{ headerShown: false }} />
          <Stack.Screen name="EventScheduler" component={EventScheduler} options={{ headerShown: false }} />
          <Stack.Screen name="Announcements" component={Announcements} options={{ headerShown: true }} />
          <Stack.Screen name="RefundScreen" component={RefundScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ChangeEmail" component={ChangeEmail} options={{ 
            title: "Change your email address", 
            headerShadowVisible: false, 
            headerStyle: { backgroundColor: isDarkMode ? "#1e1e1e" : "#fff" }, 
            headerTintColor: isDarkMode ? "#fff" : "#000" 
          }} />
          <Stack.Screen name="HotelBookingScreen" component={HotelBookingScreen} options={{ title: 'Book Hotel', headerShown: false }} />
          <Stack.Screen name="HelpSupport" component={HelpSupport} options={{ title: 'Get Help', headerShown: false }} />
          <Stack.Screen name="ListingDetails" component={ListingDetails} options={{ 
            headerTransparent: true, headerTitle: "", headerTintColor: "#fff" 
          }} />
          <Stack.Screen name="VendorListingDetails" component={VendorListingDetails} options={{ 
            headerTransparent: true, headerTitle: "", headerTintColor: "#fff" 
          }} />
          <Stack.Screen name="PublicProfile" component={PublicProfileScreen} />
          <Stack.Screen name="EditProfile" component={EditProfile} options={{ headerShown: false }} />
          <Stack.Screen name="Settings" component={Settings} options={{ headerShown: false }} />
          <Stack.Screen name="ChangePassword" component={ChangePassword} options={{ 
            title: "Change your password", 
            headerShadowVisible: false, 
            headerStyle: { backgroundColor: isDarkMode ? "#1e1e1e" : "#fff" }, 
            headerTintColor: isDarkMode ? "#fff" : "#000" 
          }} />
          <Stack.Screen name="GetVerified" component={GetVerified} options={{ headerShown: false }} />
          <Stack.Screen name="IdentityVerification" component={IdentityVerification} options={{ headerShown: false }} />
          <Stack.Screen name="ProfileListingsScreen" component={ProfileListingsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="MyListings" component={MyListings} />
          <Stack.Screen name="Orders" component={Orders} />
          <Stack.Screen name="Cart" component={Cart} />
          <Stack.Screen name="Checkout" component={Checkout} />
          <Stack.Screen name="OrderSummary" component={OrderSummary} options={{ title: "Order Summary" }} />
          <Stack.Screen name="FlutterwavePayment" component={FlutterwavePayment} options={{ title: "Payment" }} />
          <Stack.Screen name="PaystackWebView" component={PaystackWebView} options={{ title: "Complete Payment" }} />
          <Stack.Screen name="GalleryScreen" component={GalleryScreen} options={{ headerShown: false }} />
          <Stack.Screen name="RatingScreen" component={RatingScreen} options={{ headerShown: false }} />
          <Stack.Screen name="WriteReview" component={WriteReview} />
          <Stack.Screen name="ReportScreen" component={ReportScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Notification" component={Notification} />
          <Stack.Screen name="BecomeVendor" component={BecomeVendor} options={{ headerShown: false }} />
          <Stack.Screen name="EditListing" component={EditListing} options={{ headerShown: false }} />
          <Stack.Screen name="VendorSearch" component={VendorSearch} options={{ 
            headerTitle: () => <VendorSearchHeader />, 
            headerStyle: { height: 80, backgroundColor: isDarkMode ? "#1e1e1e" : "#fff" } 
          }} />
          <Stack.Screen name="AdsZone" component={AdsZone} options={{ title: "" }} />
        </Stack.Navigator>
      </NavigationContainer>
    </Animated.View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
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
                          <TripCountProvider>
                            <MainAppContent />
                          </TripCountProvider>
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
    </SafeAreaProvider>
  );
}