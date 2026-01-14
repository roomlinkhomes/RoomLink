// screens/FlutterwavePayment.jsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
  Alert,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useNavigation, useRoute } from "@react-navigation/native";

export default function FlutterwavePayment() {
  const navigation = useNavigation();
  const route = useRoute();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const { total, items, address } = route.params || {};
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Your Flutterwave public key
  const FLUTTERWAVE_PUBLIC_KEY = "FLWPUBK_TEST-xxxxxxxxxxxxxxxxxxxxxxx-X";

  // ✅ Payment handler
  const handlePayment = async () => {
    try {
      setIsLoading(true);
      const tx_ref = "TX-" + Date.now();

      // Flutterwave hosted payment URL
      const paymentUrl = `https://checkout.flutterwave.com/v3/hosted/pay/${FLUTTERWAVE_PUBLIC_KEY}?amount=${total}&currency=NGN&tx_ref=${tx_ref}&redirect_url=https://example.com/success`;

      // Open Flutterwave checkout in user's browser
      const result = await WebBrowser.openBrowserAsync(paymentUrl);

      setIsLoading(false);

      // If the user closes or completes the transaction
      if (result.type === "dismiss") {
        Alert.alert(
          "Payment Check",
          "If you completed your payment, it will be verified shortly.",
          [
            {
              text: "OK",
              onPress: () =>
                navigation.navigate("Orders", {
                  address,
                  items,
                  total,
                  status: "Pending",
                }),
            },
          ]
        );
      }
    } catch (error) {
      setIsLoading(false);
      Alert.alert("Payment Error", "Unable to start payment. Try again later.");
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? "#121212" : "#fff" },
      ]}
    >
      <Text
        style={[
          styles.heading,
          { color: isDarkMode ? "#fff" : "#000" },
        ]}
      >
        Confirm Payment
      </Text>

      <View
        style={[
          styles.summaryCard,
          {
            backgroundColor: isDarkMode ? "#1e1e1e" : "#f8f8f8",
            borderColor: isDarkMode ? "#333" : "#ddd",
          },
        ]}
      >
        <Text style={[styles.label, { color: isDarkMode ? "#bbb" : "#555" }]}>
          Total Amount
        </Text>
        <Text
          style={[
            styles.amount,
            { color: isDarkMode ? "#2ecc71" : "#27ae60" },
          ]}
        >
          ₦{total?.toLocaleString()}
        </Text>
      </View>

      <Text
        style={{
          textAlign: "center",
          color: isDarkMode ? "#aaa" : "#777",
          marginTop: 10,
        }}
      >
        You’ll be redirected to Flutterwave to complete your payment
      </Text>

      <TouchableOpacity
        style={styles.payButton}
        onPress={handlePayment}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.payText}>Proceed to Pay</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center" },
  heading: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
  },
  label: { fontSize: 16, marginBottom: 5 },
  amount: { fontSize: 28, fontWeight: "800" },
  payButton: {
    backgroundColor: "#2ecc71",
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 20,
  },
  payText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
