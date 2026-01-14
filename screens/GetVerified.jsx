// screens/GetVerified.jsx — FINAL FIXED: No syntax errors, header matches EditProfile
import React, { useState, useContext } from "react";
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
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { UserContext } from "../context/UserContext";
import { Ionicons } from "@expo/vector-icons";
import { db } from "../firebaseConfig";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

// SVG badges
import BlueBadge from "../assets/icons/blue.svg";
import YellowBadge from "../assets/icons/yellow.svg";
import RedBadge from "../assets/icons/red.svg";

const SCREEN_WIDTH = Dimensions.get("window").width;

const verificationOptions = [
  {
    type: "vendor",
    title: "Vendor Verification",
    monthly: 4990,
    yearly: 49880,
    Badge: YellowBadge,
    borderColor: "#FFD700",
    features: [
      "Unlimited listings",
      "Stand out to your customers",
      "Edit post",
      "Vendor check mark",
      "Less ads",
    ],
  },
  {
    type: "studentLandlord",
    title: "Student / Landlord Verification",
    monthly: 3000,
    yearly: 26000,
    Badge: BlueBadge,
    borderColor: "#1E90FF",
    features: [
      "Unlimited listings",
      "Stand out to potential tenants",
      "Edit post",
      "Blue check mark",
      "No frequent ads",
    ],
  },
  {
    type: "realEstate",
    title: "Real Estate Verification",
    monthly: 3000,
    yearly: 26000,
    Badge: RedBadge,
    borderColor: "#FF4500",
    features: [
      "Unlimited listings",
      "Stand out to customers",
      "Edit post",
      "Red check mark",
      "No frequent ads",
    ],
  },
];

export default function GetVerified() {
  const { updateUser, user: currentUser } = useContext(UserContext);
  const navigation = useNavigation();
  const [selectedOption, setSelectedOption] = useState(null);
  const [billing, setBilling] = useState("monthly");
  const [modalVisible, setModalVisible] = useState(false);
  const [activeBadge, setActiveBadge] = useState(null);
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const handleSubscribe = (option) => {
    setSelectedOption(option);
    setModalVisible(true);
  };

  const handlePay = async () => {
    if (!currentUser?.uid) {
      Alert.alert("Error", "User not found. Please log in again.");
      return;
    }

    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        verificationType: selectedOption.type,
        verifiedAt: serverTimestamp(),
      });

      updateUser({ badge: selectedOption.type });

      setActiveBadge({ type: selectedOption.type });
      setModalVisible(false);
      Alert.alert("Success!", `${selectedOption.title} activated! Badge applied.`);
    } catch (err) {
      console.error("Verification save error:", err);
      Alert.alert("Error", "Failed to activate verification. Try again.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? "#000" : "#fff" }]}>
      {/* ========== HEADER AREA - SAME HEIGHT AS EDITPROFILE ========== */}
      <View style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-start",
        paddingHorizontal: 20,
        paddingTop: 50,           // ← Matches EditProfile exactly
        paddingBottom: 32,
      }}>
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: 10 }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={28} color={isDark ? "#fff" : "#000"} />
        </TouchableOpacity>

        {/* Title */}
        <View style={{ flex: 1, alignItems: "center", marginRight: 48 }}>
          <Text style={[styles.header, { color: isDark ? "#fff" : "#000" }]}>
            Choose Verification Type
          </Text>
        </View>
      </View>
      {/* ========== END HEADER AREA ========== */}

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
              activeBadge?.type === option.type && {
                borderColor: option.borderColor,
                borderWidth: 2,
              },
            ]}
          >
            <View style={styles.titleRow}>
              <option.Badge width={28} height={28} />
              <Text style={[styles.title, { color: isDark ? "#fff" : "#000" }]}>
                {option.title}
              </Text>
            </View>

            <View style={styles.billingRow}>
              <TouchableOpacity
                style={[
                  styles.billingOption,
                  {
                    backgroundColor: isDark ? "#1e1e1e" : "#fff",
                  },
                  billing === "monthly" && {
                    borderColor: "#036dd6",
                    borderWidth: 2,
                  },
                ]}
                onPress={() => setBilling("monthly")}
              >
                <Text style={[styles.billingText, { color: isDark ? "#fff" : "#000" }]}>
                  Monthly ₦{option.monthly}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.billingOption,
                  {
                    backgroundColor: isDark ? "#1e1e1e" : "#fff",
                  },
                  billing === "yearly" && {
                    borderColor: "#036dd6",
                    borderWidth: 2,
                  },
                ]}
                onPress={() => setBilling("yearly")}
              >
                <Text style={[styles.billingText, { color: isDark ? "#fff" : "#000" }]}>
                  Yearly ₦{option.yearly}{" "}
                  <Text style={styles.saveText}>
                    (Save ₦{option.monthly * 12 - option.yearly})
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.features}>
              {option.features.map((feat, i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 4,
                  }}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color="#036dd6"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.featureItem, { color: isDark ? "#ddd" : "#000" }]}>
                    {feat}
                  </Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.subscribeButton,
                { backgroundColor: isDark ? "#a8c8fb" : "#036dd6" },
              ]}
              onPress={() => handleSubscribe(option)}
            >
              <Text style={styles.subscribeButtonText}>
                {billing === "monthly"
                  ? `Subscribe ₦${option.monthly}`
                  : `Subscribe ₦${option.yearly}`}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Modal */}
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
                <Text style={{ marginBottom: 10, color: isDark ? "#aaa" : "#000" }}>
                  Choose your plan:
                </Text>
                <View style={{ flexDirection: "row", marginBottom: 20 }}>
                  <TouchableOpacity
                    style={[
                      styles.billingOption,
                      billing === "monthly" && {
                        borderColor: "#036dd6",
                        borderWidth: 2,
                      },
                    ]}
                    onPress={() => setBilling("monthly")}
                  >
                    <Text style={{ color: isDark ? "#fff" : "#000" }}>
                      Monthly ₦{selectedOption?.monthly}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.billingOption,
                      billing === "yearly" && {
                        borderColor: "#036dd6",
                        borderWidth: 2,
                      },
                    ]}
                    onPress={() => setBilling("yearly")}
                  >
                    <Text style={{ color: isDark ? "#fff" : "#000" }}>
                      Yearly ₦{selectedOption?.yearly}
                    </Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={[
                    styles.subscribeButton,
                    { backgroundColor: isDark ? "#a8c8fb" : "#036dd6" },
                  ]}
                  onPress={handlePay}
                >
                  <Text style={styles.subscribeButtonText}>Pay & Subscribe</Text>
                </TouchableOpacity>

                <Text style={styles.disclaimer}>
                  By tapping Subscribe, your payment will be charged to your
                  Google Play account. Subscription renews automatically unless
                  canceled at least 24 hours before the end of the current
                  period. Manage your subscription in Google Play settings.{" "}
                  <Text
                    style={styles.link}
                    onPress={() =>
                      Linking.openURL("https://play.google.com/intl/en_us/about/play-terms/")
                    }
                  >
                    Google Play Terms of Service
                  </Text>{" "}
                  &{" "}
                  <Text
                    style={styles.link}
                    onPress={() =>
                      Linking.openURL("https://support.google.com/googleplay/answer/2479637")
                    }
                  >
                    Refund Policy
                  </Text>
                  .
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
  header: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  card: {
    width: SCREEN_WIDTH - 100,
    borderRadius: 12,
    padding: 20,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  titleRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  title: { fontSize: 18, fontWeight: "700", flexShrink: 1, marginLeft: 6 },
  billingRow: { flexDirection: "row", marginBottom: 12 },
  billingOption: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    marginRight: 10,
    alignItems: "center",
  },
  billingText: { fontWeight: "600" },
  saveText: { color: "green", fontWeight: "600" },
  features: { marginBottom: 20 },
  featureItem: { fontSize: 14 },
  subscribeButton: {
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 12,
    width: "100%",
  },
  subscribeButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-end",
  },
  modalContent: {
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  disclaimer: {
    fontSize: 12,
    color: "#888",
    marginTop: 10,
    lineHeight: 16,
    textAlign: "center",
  },
  link: {
    color: "#1A73E8",
    textDecorationLine: "underline",
  },
});