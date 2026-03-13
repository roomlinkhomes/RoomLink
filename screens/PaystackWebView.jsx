// screens/PaystackWebView.jsx — FIXED OPAY DEEP LINK + OPAY WRAPPER HANDLING
import { Text } from 'react-native';
import React, { useRef, useState } from "react";
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Alert,
  useColorScheme,
  Linking,
} from "react-native";
import { WebView } from "react-native-webview";
import { useNavigation, useRoute } from "@react-navigation/native";

export default function PaystackWebView() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const route = useRoute();
  const navigation = useNavigation();
  const { url, orderId, bookingId } = route.params || {};

  const webviewRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [redirectHandled, setRedirectHandled] = useState(false);

  if (!url) {
    Alert.alert("Error", "No payment URL provided");
    navigation.goBack();
    return null;
  }

  const handleShouldStartLoad = (request) => {
    const { url: reqUrl } = request;

    console.log("[WebView] shouldStartLoadWithRequest - URL:", reqUrl);

    // Allow http/https
    if (reqUrl.startsWith("http://") || reqUrl.startsWith("https://")) {
      return true;
    }

    const lowerUrl = reqUrl.toLowerCase();

    // Special handling for Paystack's btravel wrapper → extract inner opay://
    if (lowerUrl.startsWith("btravel://") || lowerUrl.includes("payment_new")) {
      try {
        const urlObj = new URL(reqUrl);
        const action = urlObj.searchParams.get("action");
        if (action && action.startsWith("opay://")) {
          console.log("[WebView] Extracted inner OPay deep link:", action);
          // Try opening the real OPay deep link
          Linking.canOpenURL(action)
            .then((supported) => {
              if (supported) {
                Linking.openURL(action);
                console.log("[WebView] Opened inner OPay deep link");
              } else {
                console.log("[WebView] Inner OPay not supported");
                Alert.alert(
                  "OPay Not Installed",
                  "Install OPay app to complete payment or choose another method.",
                  [{ text: "OK" }]
                );
              }
            })
            .catch((err) => console.error("[WebView] Inner Linking error:", err));

          return false;
        }
      } catch (e) {
        console.error("[WebView] Failed to parse btravel URL:", e);
      }
    }

    // General deep link handling (fallback)
    if (
      lowerUrl.startsWith("opay://") ||
      lowerUrl.startsWith("intent://") ||
      lowerUrl.includes("cashier/payment") ||
      lowerUrl.includes("://payment")
    ) {
      console.log("[WebView] Intercepted direct deep link:", reqUrl);

      Linking.canOpenURL(reqUrl)
        .then((supported) => {
          if (supported) {
            Linking.openURL(reqUrl);
          } else {
            Alert.alert(
              "Payment App Required",
              "Please install the required app (e.g., OPay) or choose another method.",
              [{ text: "OK" }]
            );
          }
        })
        .catch((err) => {
          console.error("[WebView] Deep link error:", err);
          Alert.alert("Error", "Unable to open payment app.");
        });

      return false;
    }

    console.log("[WebView] Allowing unknown:", reqUrl);
    return true;
  };

  const handleNavigationStateChange = (navState) => {
    if (redirectHandled || !navState.url) return;

    const urlLower = navState.url.toLowerCase();

    const isCallback =
      urlLower.includes("payment-success") ||
      urlLower.includes("roomlink://") ||
      urlLower.includes("checkout.paystack.com/close") ||
      urlLower.includes("paystack.com/close") ||
      urlLower.includes("close") ||
      urlLower === "about:blank";

    if (isCallback) {
      setRedirectHandled(true);
      navigation.replace("PaymentSuccess", { orderId, bookingId });
      return;
    }

    const isCancelled =
      urlLower.includes("cancel") ||
      urlLower.includes("failed") ||
      urlLower.includes("abandoned");

    if (isCancelled) {
      setRedirectHandled(true);
      Alert.alert("Payment Cancelled", "You cancelled the payment.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? "#121212" : "#fff" }]}>
      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#2ecc71" />
          <Text style={{ marginTop: 12, color: isDarkMode ? "#ddd" : "#333" }}>
            Loading Paystack Checkout...
          </Text>
        </View>
      )}

      <WebView
        ref={webviewRef}
        source={{ uri: url }}
        style={{ flex: 1 }}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onNavigationStateChange={handleNavigationStateChange}
        onShouldStartLoadWithRequest={handleShouldStartLoad}
        originWhitelist={["*", "http://*", "https://*", "opay://*", "intent://*", "btravel://*"]}
        startInLoadingState
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    zIndex: 10,
  },
});