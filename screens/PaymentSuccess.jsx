// screens/PaymentSuccess.jsx — FINAL: RELIABLE AD UNLOCK + CLEAN FLOW
import React, { useEffect } from "react";
import { View, Alert, ActivityIndicator, Text } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { collection, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import * as WebBrowser from "expo-web-browser";
import { useUser } from "../context/UserContext"; // Optional: for context reload

const PaymentSuccess = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { cartItems, totalAmount, deliveryInfo } = route.params || {};
  const { reloadUser } = useUser() || {};

  useEffect(() => {
    WebBrowser.dismissBrowser();

    const finalizeOrderAndUnlockAds = async () => {
      if (!auth.currentUser) {
        Alert.alert("Error", "You must be logged in");
        navigation.replace("HomeTabs");
        return;
      }

      try {
        // 1. Save the order
        const itemsWithVendorId = (cartItems || []).map((item) => ({
          id: item.id || "",
          name: item.title || item.name || "Unknown Item",
          price: item.price || 0,
          quantity: item.quantity || 1,
          vendorId: item.author || item.vendorId || "unknown",
          vendorName: item.authorName || "Vendor",
          image: item.images?.[0] || null,
        }));

        await addDoc(collection(db, "orders"), {
          buyerId: auth.currentUser.uid,
          buyerName: auth.currentUser.displayName || "Customer",
          buyerEmail: auth.currentUser.email || "no-email@example.com",
          items: itemsWithVendorId,
          totalAmount: totalAmount || 0,
          itemTotal: totalAmount || 0,
          deliveryFee: 0,
          serviceFee: 2,
          currency: "NGN",
          deliveryInfo: deliveryInfo || {},
          status: "paid",
          createdAt: serverTimestamp(),
        });

        // 2. UNLOCK BILLBOARD POSTING (critical for AdsZone)
        await updateDoc(doc(db, "users", auth.currentUser.uid), {
          adsPaid: true,
          adsPaidAt: serverTimestamp(),
        });

        // 3. Refresh user context if available
        if (typeof reloadUser === "function") {
          await reloadUser();
        }

        // 4. Success + direct to AdsZone
        Alert.alert(
          "Payment Successful! 🎉",
          "Your order is complete and premium billboard posting is now unlocked.",
          [
            {
              text: "Post Billboard Ad",
              onPress: () => navigation.replace("AdsZone"), // ← Sends user straight to AdsZone
            },
            {
              text: "Go Home",
              onPress: () => navigation.replace("HomeTabs"),
            },
          ],
          { cancelable: false }
        );
      } catch (error) {
        console.error("PaymentSuccess Error:", error);
        Alert.alert(
          "Issue Completing Order",
          "Payment was successful, but we couldn't update your account fully. Contact support if billboard posting doesn't unlock.",
          [{ text: "OK", onPress: () => navigation.replace("HomeTabs") }]
        );
      }
    };

    finalizeOrderAndUnlockAds();
  }, [navigation, route.params, reloadUser]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
      <ActivityIndicator size="large" color="#017a6b" />
      <Text style={{ marginTop: 20, fontSize: 18, color: "#017a6b", textAlign: "center", paddingHorizontal: 40 }}>
        Finalizing your order and unlocking premium features...
      </Text>
    </View>
  );
};

export default PaymentSuccess;