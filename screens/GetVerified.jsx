// screens/GetVerified.jsx — Fixed null error + Proper Google Play Integration

import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Modal,
  Linking,
  TouchableWithoutFeedback,
  useColorScheme,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { UserContext } from "../context/UserContext";
import { Ionicons } from "@expo/vector-icons";
import { db } from "../firebaseConfig";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import * as RNIap from "react-native-iap";

// SVG badges
import BlueBadge from "../assets/icons/blue.svg";
import YellowBadge from "../assets/icons/yellow.svg";
import RedBadge from "../assets/icons/red.svg";

// === YOUR SUBSCRIPTION IDs FROM GOOGLE PLAY CONSOLE ===
const MONTHLY_VENDOR_ID = "vendor_monthly";
const YEARLY_VENDOR_ID = "vendor_yearly";

const SCREEN_WIDTH = Dimensions.get("window").width;

const verificationOptions = [
  {
    type: "vendor",
    title: "Vendor Verification",
    Badge: YellowBadge,
    borderColor: "#FFD700",
    features: [
      "Unlimited listings",
      "Stand out to your customers",
      "Edit post",
      "Vendor check mark",
      "Less ads",
    ],
    monthlySku: MONTHLY_VENDOR_ID,
    yearlySku: YEARLY_VENDOR_ID,
    monthlyPrice: 4990,
    yearlyPrice: 49880,
  },
  {
    type: "studentLandlord",
    title: "Student / Landlord Verification",
    Badge: BlueBadge,
    borderColor: "#1E90FF",
    features: [
      "Unlimited listings",
      "Stand out to potential tenants",
      "Edit post",
      "Blue check mark",
      "No frequent ads",
    ],
    monthlySku: "student_monthly",     // ← CHANGE TO YOUR ACTUAL SKU
    yearlySku: "student_yearly",       // ← CHANGE TO YOUR ACTUAL SKU
    monthlyPrice: 3000,
    yearlyPrice: 26000,
  },
  {
    type: "realEstate",
    title: "Real Estate Verification",
    Badge: RedBadge,
    borderColor: "#FF4500",
    features: [
      "Unlimited listings",
      "Stand out to customers",
      "Edit post",
      "Red check mark",
      "No frequent ads",
    ],
    monthlySku: "realestate_monthly",   // ← CHANGE TO YOUR ACTUAL SKU
    yearlySku: "realestate_yearly",     // ← CHANGE TO YOUR ACTUAL SKU
    monthlyPrice: 3000,
    yearlyPrice: 26000,
  },
];

export default function GetVerified() {
  const { updateUser, user: currentUser } = useContext(UserContext);
  const navigation = useNavigation();

  const [selectedOption, setSelectedOption] = useState(null);
  const [billing, setBilling] = useState("monthly");
  const [modalVisible, setModalVisible] = useState(false);
  const [activeBadge, setActiveBadge] = useState(null);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  // Initialize Billing
  useEffect(() => {
    const initBilling = async () => {
      try {
        await RNIap.initConnection();

        const allSkus = verificationOptions.flatMap((opt) => [
          opt.monthlySku,
          opt.yearlySku,
        ]);

        const fetched = await RNIap.getSubscriptions({ skus: allSkus });
        setProducts(fetched || []);
        console.log("Subscriptions loaded:", fetched);
      } catch (err) {
        console.error("Billing init failed:", err);
        Alert.alert("Error", "Failed to load subscription options.");
      } finally {
        setLoadingProducts(false);
      }
    };

    initBilling();

    // Purchase Listener
    const purchaseListener = RNIap.purchaseUpdatedListener(async (purchase) => {
      try {
        if (purchase.transactionReceipt && selectedOption) {
          await activatePremium(purchase.productId);
          Alert.alert("Success", `${selectedOption.title} activated!`);
          setActiveBadge({ type: selectedOption.type });
          updateUser({ badge: selectedOption.type, isPremium: true });
        }
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Failed to activate subscription.");
      } finally {
        await RNIap.finishTransaction({ purchase, isConsumable: false });
        setPurchasing(false);
        setModalVisible(false);
      }
    });

    return () => {
      purchaseListener.remove();
      RNIap.endConnection();
    };
  }, [selectedOption]);

  const getProductDetails = (sku) => products.find((p) => p.productId === sku);

  const handleSubscribe = (option) => {
    setSelectedOption(option);
    setBilling("monthly");
    setModalVisible(true);
  };

  const handlePay = async () => {
    if (!currentUser?.uid || !selectedOption) {
      Alert.alert("Error", "Please log in again.");
      return;
    }

    const sku = billing === "monthly" ? selectedOption.monthlySku : selectedOption.yearlySku;
    const product = getProductDetails(sku);

    if (!product) {
      Alert.alert("Error", "Subscription not found. Please try again.");
      return;
    }

    setPurchasing(true);

    try {
      let requestParams = { sku };

      if (Platform.OS === "android") {
        const offerToken = product.subscriptionOfferDetails?.[0]?.offerToken;

        if (!offerToken) {
          throw new Error("Offer token not found. Check Google Play Console.");
        }

        requestParams = {
          sku,
          subscriptionOffers: [{ sku, offerToken }],
        };
      }

      await RNIap.requestSubscription(requestParams);
    } catch (err) {
      console.error("Purchase error:", err);
      Alert.alert("Purchase Failed", err.message || "Something went wrong.");
      setPurchasing(false);
    }
  };

  const activatePremium = async (productId) => {
    if (!currentUser?.uid || !selectedOption) return;

    const userRef = doc(db, "users", currentUser.uid);
    await updateDoc(userRef, {
      verificationType: selectedOption.type,
      verifiedAt: serverTimestamp(),
      isPremium: true,
      premiumPlan: productId,
      premiumSince: serverTimestamp(),
    });
  };

  // Safe price display
  const getDisplayPrice = (option, isMonthly) => {
    if (!option) return "₦0";
    const sku = isMonthly ? option.monthlySku : option.yearlySku;
    const product = getProductDetails(sku);
    return product?.price || (isMonthly ? `₦${option.monthlyPrice}` : `₦${option.yearlyPrice}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? "#000" : "#fff" }]}>
      {/* HEADER */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 10 }}>
          <Ionicons name="arrow-back" size={28} color={isDark ? "#fff" : "#000"} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center", marginRight: 48 }}>
          <Text style={[styles.header, { color: isDark ? "#fff" : "#000" }]}>
            Choose Verification Type
          </Text>
        </View>
      </View>

      {loadingProducts ? (
        <ActivityIndicator size="large" color="#017a6b" style={styles.loader} />
      ) : (
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
                {
                  marginRight: idx === verificationOptions.length - 1 ? 0 : 15,
                  backgroundColor: isDark ? "#121212" : "#f9f9f9",
                },
                activeBadge?.type === option.type && { borderColor: option.borderColor, borderWidth: 3 },
              ]}
            >
              <View style={styles.titleRow}>
                <option.Badge width={32} height={32} />
                <Text style={[styles.title, { color: isDark ? "#fff" : "#000" }]}>
                  {option.title}
                </Text>
              </View>

              <View style={styles.billingRow}>
                <TouchableOpacity
                  style={[styles.billingOption, billing === "monthly" && styles.selectedBilling]}
                  onPress={() => setBilling("monthly")}
                >
                  <Text style={styles.billingText}>Monthly {getDisplayPrice(option, true)}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.billingOption, billing === "yearly" && styles.selectedBilling]}
                  onPress={() => setBilling("yearly")}
                >
                  <Text style={styles.billingText}>
                    Yearly {getDisplayPrice(option, false)}{" "}
                    <Text style={styles.saveText}>
                      (Save ₦{option.monthlyPrice * 12 - option.yearlyPrice})
                    </Text>
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.features}>
                {option.features.map((feat, i) => (
                  <View key={i} style={styles.featureRow}>
                    <Ionicons name="checkmark-circle" size={18} color="#036dd6" style={{ marginRight: 8 }} />
                    <Text style={[styles.featureItem, { color: isDark ? "#ddd" : "#333" }]}>
                      {feat}
                    </Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.subscribeButton, { backgroundColor: isDark ? "#a8c8fb" : "#036dd6" }]}
                onPress={() => handleSubscribe(option)}
              >
                <Text style={styles.subscribeButtonText}>
                  Subscribe • {getDisplayPrice(option, billing === "monthly")}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* CONFIRMATION MODAL */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: isDark ? "#121212" : "#fff" }]}>
                <Text style={[styles.modalTitle, { color: isDark ? "#fff" : "#000" }]}>
                  Confirm {selectedOption?.title}
                </Text>

                <Text style={{ marginBottom: 16, color: isDark ? "#aaa" : "#555" }}>
                  Choose billing cycle:
                </Text>

                <View style={styles.modalBillingRow}>
                  <TouchableOpacity
                    style={[styles.billingOption, billing === "monthly" && styles.selectedBilling]}
                    onPress={() => setBilling("monthly")}
                  >
                    <Text style={styles.billingText}>Monthly {getDisplayPrice(selectedOption, true)}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.billingOption, billing === "yearly" && styles.selectedBilling]}
                    onPress={() => setBilling("yearly")}
                  >
                    <Text style={styles.billingText}>Yearly {getDisplayPrice(selectedOption, false)}</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.subscribeButton, { backgroundColor: isDark ? "#a8c8fb" : "#036dd6" }]}
                  onPress={handlePay}
                  disabled={purchasing || !selectedOption}
                >
                  {purchasing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.subscribeButtonText}>Pay & Subscribe Now</Text>
                  )}
                </TouchableOpacity>

                <Text style={styles.disclaimer}>
                  Payment will be charged to your Google Play account. Subscription renews automatically unless canceled at least 24 hours before renewal.
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
  loader: { flex: 1, justifyContent: "center" },
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
  billingRow: { flexDirection: "row", marginBottom: 20, gap: 10 },
  modalBillingRow: { flexDirection: "row", marginBottom: 24, gap: 12 },
  billingOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#ddd",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
  },
  selectedBilling: {
    borderColor: "#036dd6",
    backgroundColor: "#e6f0ff",
  },
  billingText: { fontWeight: "600" },
  saveText: { color: "#00aa00", fontWeight: "700" },
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