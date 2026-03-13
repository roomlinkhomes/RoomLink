// screens/PaymentSuccess.jsx
import React, { useEffect, useState } from "react";
import { View, Alert, ActivityIndicator, Text } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig"; // ← make sure db is exported

const PaymentSuccess = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { orderId, bookingId } = route.params || {}; // ← must receive this!

  const [status, setStatus] = useState("processing");
  const [message, setMessage] = useState("Confirming your payment... Please wait a moment");

  useEffect(() => {
    // Use whichever ID you pass — orderId or bookingId
    const docId = orderId || bookingId;
    if (!docId) {
      setMessage("Error: Missing payment reference");
      setTimeout(() => navigation.replace("HomeTabs"), 4000);
      return;
    }

    // IMPORTANT: change collection name to match your Firestore
    // If you use "bookings" collection → use "bookings"
    const docRef = doc(db, "orders", docId); // ← or "bookings", docId

    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const currentStatus = data?.status;

        setStatus(currentStatus);

        if (currentStatus === "paid" || currentStatus === "successful") {
          setMessage("Payment Confirmed! 🎉");

          Alert.alert(
            "Success! Payment Received",
            "Your payment has been confirmed and features unlocked.",
            [
              {
                text: "Continue to AdsZone",
                onPress: () => navigation.replace("AdsZone"),
              },
              {
                text: "Go Home",
                onPress: () => navigation.replace("HomeTabs"),
              },
            ],
            { cancelable: false }
          );
        } else if (currentStatus === "failed" || currentStatus === "cancelled") {
          setMessage("Payment issue detected");
          Alert.alert("Payment Failed", "The transaction did not complete.", [
            { text: "OK", onPress: () => navigation.replace("HomeTabs") },
          ]);
        }
      } else {
        setMessage("Payment record not found — contact support");
      }
    }, (error) => {
      console.error("onSnapshot error:", error);
      setMessage("Connection issue... checking again shortly");
    });

    // Fallback timeout — in case webhook is slow or never fires
    const timeout = setTimeout(() => {
      if (status === "processing") {
        setMessage("Taking longer than expected... redirecting home");
        setTimeout(() => navigation.replace("HomeTabs"), 2000);
      }
    }, 90000); // 90 seconds

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, [orderId, bookingId, navigation]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
      <ActivityIndicator size="large" color="#017a6b" />
      <Text
        style={{
          marginTop: 24,
          fontSize: 16,
          color: "#333",
          textAlign: "center",
          paddingHorizontal: 32,
        }}
      >
        {message}
      </Text>
      {status === "processing" && (
        <Text style={{ marginTop: 16, color: "#666", fontSize: 14 }}>
          This usually takes 5–30 seconds...
        </Text>
      )}
    </View>
  );
};

export default PaymentSuccess;