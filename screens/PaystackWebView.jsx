// screens/PaystackWebView.jsx — FIXED SUCCESS DETECTION
import React, { useRef, useState, useEffect } from "react";
import { View, ActivityIndicator, StyleSheet, Alert, useColorScheme } from "react-native";
import { WebView } from "react-native-webview";
import { useNavigation, useRoute } from "@react-navigation/native";

export default function PaystackWebView() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const route = useRoute();
  const navigation = useNavigation();
  const { url, orderId, onSuccess } = route.params || {};

  const webviewRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [handled, setHandled] = useState(false);

  useEffect(() => {
    if (!url) {
      Alert.alert("Payment Error", "No payment URL provided");
      navigation.goBack();
    }
  }, [url]);

  const handleNavigationStateChange = (navState) => {
    const currentUrl = navState.url;
    if (handled || !currentUrl) return;

    // 🔥 PAYSTACK SUCCESS URL PATTERNS
    const isSuccess =
      currentUrl.includes("payment-success") ||
      currentUrl.includes("status=success") ||
      currentUrl.includes("paystack.com/close") ||
      currentUrl.includes("checkout.paystack.com/close") ||
      currentUrl.includes("close") ||
      currentUrl === "about:blank" ||
      currentUrl.includes("success");

    if (isSuccess) {
      setHandled(true);
      if (onSuccess && typeof onSuccess === "function") {
        onSuccess();
      }
      Alert.alert("Payment Successful!", "Your billboard is now unlocked.", [
        { text: "Continue", onPress: () => navigation.goBack() },
      ]);
      return;
    }

    // 🔥 FAILURE
    const isFailed =
      currentUrl.includes("payment-failed") ||
      currentUrl.includes("failed") ||
      currentUrl.includes("cancel") ||
      currentUrl.includes("abandoned");

    if (isFailed) {
      setHandled(true);
      Alert.alert("Payment Failed", "Please try again.", [
        { text: "Back", onPress: () => navigation.goBack() },
      ]);
      return;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? "#121212" : "#fff" }]}>
      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#2ecc71" />
        </View>
      )}
      <WebView
        ref={webviewRef}
        source={{ uri: url }}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onNavigationStateChange={handleNavigationStateChange}
        startInLoadingState
        javaScriptEnabled
        domStorageEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
});
