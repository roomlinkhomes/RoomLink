import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Modal,
  Alert,
  ActivityIndicator,
  useColorScheme,
  TouchableWithoutFeedback,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { UserContext } from "../context/UserContext";
import { Ionicons } from "@expo/vector-icons";
import { db } from "../firebaseConfig";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import Purchases from "react-native-purchases";

// SVG badges
import BlueBadge from "../assets/icons/blue.svg";
import YellowBadge from "../assets/icons/yellow.svg";
import RedBadge from "../assets/icons/red.svg";

const SCREEN_WIDTH = Dimensions.get("window").width;

const verificationOptions = [
  {
    type: "vendor",
    title: "Vendor Verification",
    Badge: YellowBadge,
    borderColor: "#FFD700",
    entitlement: "vendor_premium",
    features: ["Unlimited listings", "Stand out to your customers", "Edit post", "Vendor check mark", "Less ads"],
  },
  {
    type: "studentLandlord",
    title: "Student / Landlord Verification",
    Badge: BlueBadge,
    borderColor: "#1E90FF",
    entitlement: "student_premium",
    features: ["Unlimited listings", "Stand out to potential tenants", "Edit post", "Blue check mark", "No frequent ads"],
  },
  {
    type: "realEstate",
    title: "Real Estate Verification",
    Badge: RedBadge,
    borderColor: "#FF4500",
    entitlement: "realestate_premium",
    features: ["Unlimited listings", "Stand out to customers", "Edit post", "Red check mark", "No frequent ads"],
  },
];

export default function GetVerified() {
  const { updateUser, user: currentUser } = useContext(UserContext);
  const navigation = useNavigation();

  const [selectedOption, setSelectedOption] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeBadge, setActiveBadge] = useState(null);
  const [offerings, setOfferings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  // RevenueCat Initialization
  useEffect(() => {
    let isMounted = true;

    const initializeRevenueCat = async () => {
      try {
        setErrorMessage("");
        setLoading(true);

        // Your RevenueCat Google Public Key
        const GOOGLE_API_KEY = "goog_LdPWuZBMhUKwayGKKouYdMmaBGG";

        console.log("🚀 Configuring RevenueCat...");

        // Enable verbose logging for debugging
        Purchases.setLogLevel("VERBOSE");

        // 1. Configure RevenueCat (MUST be done first)
        await Purchases.configure({ apiKey: GOOGLE_API_KEY });

        // 2. Set App User ID
        const appUserID = currentUser?.uid || `roomlink_${Date.now()}`;
        await Purchases.setAppUserID(appUserID);

        console.log(`✅ RevenueCat configured for user: ${appUserID}`);

        // 3. Fetch offerings
        const offeringsData = await Purchases.getOfferings();

        if (isMounted) {
          setOfferings(offeringsData);
          console.log("✅ Offerings loaded successfully:", JSON.stringify(offeringsData?.current, null, 2));
        }
      } catch (err) {
        console.error("❌ RevenueCat Error:", err);
        const msg = err.message || "Failed to initialize RevenueCat";
        setErrorMessage(msg);

        if (isMounted) {
          Alert.alert("RevenueCat Error", msg);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializeRevenueCat();

    // Customer info listener
    const listener = Purchases.addCustomerInfoUpdateListener((customerInfo) => {
      console.log("👤 Customer info updated:", customerInfo);
    });

    return () => {
      isMounted = false;
      if (listener?.remove) listener.remove();
    };
  }, [currentUser?.uid]);

  const handleSubscribe = (option) => {
    if (!offerings) {
      Alert.alert("Error", "Subscription options are still loading. Please wait.");
      return;
    }
    setSelectedOption(option);
    setModalVisible(true);
  };

  const handlePay = async () => {
    if (!selectedOption || !offerings?.current) {
      Alert.alert("Error", "Offerings not loaded yet.");
      return;
    }

    setPurchasing(true);

    try {
      const currentOffering = offerings.current;
      const packageToBuy = currentOffering.monthly || currentOffering.availablePackages?.[0];

      if (!packageToBuy) {
        Alert.alert("Error", "No package found for this plan. Check RevenueCat dashboard.");
        return;
      }

      const { customerInfo } = await Purchases.purchasePackage(packageToBuy);

      await activatePremium(selectedOption, customerInfo);

      Alert.alert("Success", `${selectedOption.title} activated successfully!`);

      setActiveBadge({ type: selectedOption.type });
      updateUser({
        badge: selectedOption.type,
        isPremium: true,
        verificationType: selectedOption.type,
      });

      setModalVisible(false);
    } catch (err) {
      console.error("Purchase error:", err);
      if (err.userCancelled) {
        Alert.alert("Cancelled", "Purchase was cancelled.");
      } else {
        Alert.alert("Purchase Failed", err.message || "Something went wrong.");
      }
    } finally {
      setPurchasing(false);
    }
  };

  const activatePremium = async (option, customerInfo) => {
    if (!currentUser?.uid) return;

    const userRef = doc(db, "users", currentUser.uid);
    await updateDoc(userRef, {
      verificationType: option.type,
      verifiedAt: serverTimestamp(),
      isPremium: true,
      premiumPlan: option.entitlement,
      premiumSince: serverTimestamp(),
      revenuecatCustomerInfo: customerInfo,
    });
  };

  // Loading Screen
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? "#000" : "#fff", justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#017a6b" />
        <Text style={{ marginTop: 16, color: isDark ? "#aaa" : "#666" }}>Connecting to RevenueCat...</Text>
      </View>
    );
  }

  // Error Screen
  if (errorMessage) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? "#000" : "#fff", justifyContent: "center", padding: 30, alignItems: "center" }]}>
        <Ionicons name="alert-circle-outline" size={70} color="#ff4444" />
        <Text style={{ fontSize: 18, fontWeight: "bold", color: "#ff4444", marginTop: 20, textAlign: "center" }}>
          Failed to Load Plans
        </Text>
        <Text style={{ color: isDark ? "#ddd" : "#333", marginTop: 12, textAlign: "center" }}>{errorMessage}</Text>

        <TouchableOpacity
          style={[styles.subscribeButton, { marginTop: 30, backgroundColor: "#017a6b" }]}
          onPress={() => navigation.replace("GetVerified")} // Simple retry by reloading screen
        >
          <Text style={styles.subscribeButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? "#000" : "#fff" }]}>
      {/* HEADER */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 10 }}>
          <Ionicons name="arrow-back" size={28} color={isDark ? "#fff" : "#000"} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center", marginRight: 48 }}>
          <Text style={[styles.header, { color: isDark ? "#fff" : "#000" }]}>Choose Verification Type</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20 }}
        snapToInterval={SCREEN_WIDTH - 100}
        decelerationRate="fast"
      >
        {verificationOptions.map((option, idx) => (
          <View
            key={idx}
            style={[
              styles.card,
              { backgroundColor: isDark ? "#121212" : "#f9f9f9" },
              activeBadge?.type === option.type && { borderColor: option.borderColor, borderWidth: 3 },
            ]}
          >
            <View style={styles.titleRow}>
              <option.Badge width={32} height={32} />
              <Text style={[styles.title, { color: isDark ? "#fff" : "#000" }]}>{option.title}</Text>
            </View>

            <View style={styles.features}>
              {option.features.map((feat, i) => (
                <View key={i} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={18} color="#036dd6" style={{ marginRight: 8 }} />
                  <Text style={[styles.featureItem, { color: isDark ? "#ddd" : "#333" }]}>{feat}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.subscribeButton, { backgroundColor: isDark ? "#a8c8fb" : "#036dd6" }]}
              onPress={() => handleSubscribe(option)}
            >
              <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* CONFIRMATION MODAL */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: isDark ? "#121212" : "#fff" }]}>
                <Text style={[styles.modalTitle, { color: isDark ? "#fff" : "#000" }]}>
                  Confirm {selectedOption?.title}
                </Text>

                <TouchableOpacity
                  style={[styles.subscribeButton, { backgroundColor: isDark ? "#a8c8fb" : "#036dd6", marginTop: 20 }]}
                  onPress={handlePay}
                  disabled={purchasing}
                >
                  {purchasing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.subscribeButtonText}>Pay & Subscribe Now</Text>
                  )}
                </TouchableOpacity>

                <Text style={styles.disclaimer}>
                  Payment will be charged to your Google Play account. Subscription renews automatically unless canceled.
                </Text>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 32,
  },
  header: { fontSize: 18, fontWeight: "bold" },
  card: {
    width: SCREEN_WIDTH - 100,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    elevation: 5,
  },
  titleRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  title: { fontSize: 18, fontWeight: "700", marginLeft: 8, flex: 1 },
  features: { marginBottom: 24 },
  featureRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  featureItem: { fontSize: 14.5, flex: 1 },
  subscribeButton: {
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
  },
  subscribeButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalContent: {
    padding: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalTitle: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  disclaimer: {
    fontSize: 12.5,
    color: "#888",
    marginTop: 20,
    lineHeight: 17,
    textAlign: "center",
  },
});