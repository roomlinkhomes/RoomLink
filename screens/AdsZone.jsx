import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { auth, db } from "../firebaseConfig";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  doc,
  updateDoc,
} from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";

const CLOUD_NAME = "drserbss8";
const UPLOAD_PRESET = "roomlink_preset";

const MAX_TOTAL_ADS = 35;
const FINANCIAL_SUPPORT_UID = "e12i0xwZ5mfXzpgQUcwsLMZlApq2";

const plans = [
  { id: "daily", title: "24 Hours", price: 500, desc: "Ad runs for 24 hours", durationDays: 1 },
  { id: "weekly", title: "Weekly", price: 3500, desc: "Ad runs for 7 days", durationDays: 7 },
  { id: "monthly", title: "Monthly", price: 10500, desc: "Ad runs for 30 days", durationDays: 30 },
];

export default function AdsZone() {
  const [modalVisible, setModalVisible] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [image, setImage] = useState(null);
  const [link, setLink] = useState("");
  const [uploading, setUploading] = useState(false);
  const [activeAd, setActiveAd] = useState(null);
  const [pendingAd, setPendingAd] = useState(null);
  const [approvedAd, setApprovedAd] = useState(null);
  const [totalActiveAds, setTotalActiveAds] = useState(0);
  const [billboardFull, setBillboardFull] = useState(false);

  const navigation = useNavigation();
  const user = auth.currentUser;

  // Real-time listener for user's ads
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "ads"), where("userId", "==", user.uid));

    const unsubscribe = onSnapshot(q, (snap) => {
      let active = null;
      let pending = null;
      let approved = null;
      const now = new Date();

      snap.forEach((docSnap) => {
        const data = docSnap.data();
        const end = data.expiresAt?.toDate?.() || new Date(data.expiresAt || 0);

        if (data.status === "live" && end > now) {
          active = { id: docSnap.id, ...data, endDate: end };
        } else if (data.status === "approved" && !data.url) {
          approved = { id: docSnap.id, ...data };
        } else if (data.status === "pending_payment") {
          pending = { id: docSnap.id, ...data };
        }
      });

      setActiveAd(active);
      setPendingAd(pending);
      setApprovedAd(approved);
    });

    return unsubscribe;
  }, [user]);

  // Global active ads count
  useEffect(() => {
    const allAdsQ = query(collection(db, "ads"), where("status", "==", "live"));

    const unsub = onSnapshot(allAdsQ, (snap) => {
      let count = 0;
      const now = new Date();
      snap.forEach((d) => {
        const end = d.data().expiresAt?.toDate?.() || new Date(d.data().expiresAt || 0);
        if (end > now) count++;
      });
      setTotalActiveAds(count);
      setBillboardFull(count >= MAX_TOTAL_ADS);
    });

    return unsub;
  }, []);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });
      if (!result.canceled) setImage(result.assets[0]);
    } catch (err) {
      Alert.alert("Error", "Could not pick image");
    }
  };

  const uploadToCloudinary = async (uri) => {
    try {
      const data = new FormData();
      data.append("file", { uri, type: "image/jpeg", name: "ad.jpg" });
      data.append("upload_preset", UPLOAD_PRESET);
      data.append("cloud_name", CLOUD_NAME);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: data,
      });

      if (!res.ok) throw new Error("Upload failed");

      const json = await res.json();
      return json.secure_url;
    } catch (err) {
      Alert.alert("Upload Error", "Failed to upload image");
      return null;
    }
  };

  const handlePayment = async () => {
    if (!selectedPlan) return Alert.alert("Select a plan first");
    if (!user?.email) return Alert.alert("Login required");

    try {
      const res = await fetch("https://us-central1-roomlink-homes.cloudfunctions.net/initializePaystack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          amount: selectedPlan.price * 100,
          reference: `ad_${user.uid}_${Date.now()}`,
          callback_url: "roomlink://payment-success",
        }),
      });

      const data = await res.json();
      if (!data.url) throw new Error("Payment init failed");

      navigation.navigate("PaystackWebView", { url: data.url });
    } catch (err) {
      Alert.alert("Payment Error", err.message || "Try again");
    }
  };

  // Call this after successful payment (from Paystack success handler)
  const recordPayment = async () => {
    if (!selectedPlan) return;

    try {
      await addDoc(collection(db, "ads"), {
        userId: user.uid,
        fullName: user.displayName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User",
        email: user.email || "No email",
        amountPaid: selectedPlan.price,
        plan: selectedPlan.id,
        status: "pending_payment",
        createdAt: serverTimestamp(),
      });

      Toast.show({
        type: "success",
        text1: "Payment Sent",
        text2: "Waiting for admin approval",
      });

      setModalVisible(false);
      setSelectedPlan(null);
    } catch (err) {
      Alert.alert("Error", "Could not record payment");
    }
  };

  const uploadBanner = async () => {
    if (!image) return Alert.alert("Pick an image first");
    if (link && !/^https?:\/\//i.test(link)) return Alert.alert("Invalid link");

    setUploading(true);
    const url = await uploadToCloudinary(image.uri);
    setUploading(false);

    if (!url) return;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (approvedAd?.durationDays || 7));

    try {
      await updateDoc(doc(db, "ads", approvedAd.id), {
        url,
        link: link || null,
        expiresAt,
        status: "live",
        uploadedAt: serverTimestamp(),
      });

      Alert.alert("Success!", "Your ad is now live!");
      setUploadModalVisible(false);
      setImage(null);
      setLink("");
    } catch (err) {
      Alert.alert("Error", "Failed to go live");
    }
  };

  const openModal = (plan) => {
    if (activeAd) {
      Alert.alert("Active Ad", `You already have an active ad until ${activeAd.endDate?.toLocaleDateString()}`);
      return;
    }
    if (pendingAd) {
      Alert.alert("Pending", "Your ad is awaiting approval");
      return;
    }
    if (approvedAd) {
      setUploadModalVisible(true);
      return;
    }

    setSelectedPlan(plan);
    setModalVisible(true);
  };

  const openSupport = () => {
    Toast.show({
      type: "info",
      text1: "Payment Support",
      text2: "Send proof to RoomLink Financial",
      position: "bottom",
      visibilityTime: 7000,
    });

    navigation.navigate("HomeTabs", {
      screen: "Messages",
      params: {
        screen: "Message",
        params: {
          recipientUID: FINANCIAL_SUPPORT_UID,
          otherUserName: "RoomLink Financial",
        },
      },
    });
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>Boost Your Reach</Text>
        <Text style={styles.subText}>Promote your content on the billboard</Text>

        {activeAd && (
          <View style={[styles.statusBox, { backgroundColor: "#d1fae5" }]}>
            <Text style={styles.statusTitle}>Active Ad</Text>
            <Text>{activeAd.plan.toUpperCase()} • Expires {activeAd.endDate?.toLocaleDateString()}</Text>
          </View>
        )}

        {pendingAd && (
          <View style={[styles.statusBox, { backgroundColor: "#fef3c7" }]}>
            <Text style={styles.statusTitle}>Payment Received</Text>
            <Text>Awaiting admin approval</Text>
          </View>
        )}

        {approvedAd && (
          <View style={[styles.statusBox, { backgroundColor: "#d1fae5", borderWidth: 2, borderColor: "#10b981" }]}>
            <Text style={styles.statusTitle}>Approved! ✅</Text>
            <Text>Your slot is ready — upload banner now</Text>
            <TouchableOpacity style={styles.greenButton} onPress={() => setUploadModalVisible(true)}>
              <Text style={styles.buttonText}>Upload Banner Now</Text>
            </TouchableOpacity>
          </View>
        )}

        {billboardFull && (
          <Text style={{ color: "red", textAlign: "center", marginVertical: 12, fontWeight: "bold" }}>
            Billboard Full ({totalActiveAds}/{MAX_TOTAL_ADS}) — New ads queued after approval
          </Text>
        )}

        <View style={styles.plansContainer}>
          {plans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                (activeAd || pendingAd || approvedAd) && { opacity: 0.5 },
              ]}
              onPress={() => openModal(plan)}
              disabled={activeAd || pendingAd || approvedAd}
            >
              <Text style={styles.planTitle}>{plan.title}</Text>
              <Text style={styles.planPrice}>₦{plan.price.toLocaleString()}</Text>
              <Text style={styles.planDesc}>{plan.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.footer}>
          After payment, send receipt to RoomLink Financial (tap headset icon below)
        </Text>
      </ScrollView>

      {/* Payment Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedPlan?.title}</Text>
            <Text style={styles.modalPrice}>₦{selectedPlan?.price.toLocaleString()}</Text>

            <TouchableOpacity style={styles.payButton} onPress={handlePayment}>
              <Text style={styles.payText}>Pay Now</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Upload Modal */}
      <Modal visible={uploadModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Upload Your Banner</Text>

            <TouchableOpacity style={styles.imageArea} onPress={pickImage}>
              {image ? (
                <Image source={{ uri: image.uri }} style={styles.previewImage} />
              ) : (
                <Text style={{ color: "#666" }}>Tap to pick banner image</Text>
              )}
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="https://your-link.com (optional)"
              value={link}
              onChangeText={setLink}
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[styles.greenButton, uploading && { opacity: 0.7 }]}
              onPress={uploadBanner}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Publish Banner</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setUploadModalVisible(false)}>
              <Text style={styles.cancelText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Floating support button */}
      <TouchableOpacity style={styles.fab} onPress={openSupport}>
        <Ionicons name="headset-outline" size={26} color="#fff" />
        <View style={styles.helpBadge}>
          <Text style={styles.badgeText}>Help</Text>
        </View>
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flexGrow: 1, backgroundColor: "#f9fafb" },
  header: { fontSize: 24, fontWeight: "700", textAlign: "center", marginBottom: 8 },
  subText: { textAlign: "center", color: "#666", marginBottom: 24 },

  statusBox: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: "center",
    borderWidth: 1,
  },
  greenButton: {
    backgroundColor: "#10b981",
    paddingVertical: 14,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
    marginTop: 12,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  warning: { color: "#dc2626", textAlign: "center", marginBottom: 16, fontWeight: "600" },

  plansContainer: { gap: 12 },
  planCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  planTitle: { fontSize: 18, fontWeight: "700" },
  planPrice: { fontSize: 26, fontWeight: "bold", color: "#16a34a", marginVertical: 6 },
  planDesc: { color: "#4b5563", textAlign: "center" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 12, textAlign: "center" },
  modalPrice: { fontSize: 28, color: "#16a34a", textAlign: "center", marginBottom: 24 },

  payButton: {
    backgroundColor: "#1d4ed8",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  payText: { color: "#fff", fontSize: 18, fontWeight: "700" },

  imageArea: {
    height: 160,
    borderWidth: 2,
    borderColor: "#d1d5db",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  preview: { width: "100%", height: "100%", borderRadius: 12 },

  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 20,
  },

  fab: {
    position: "absolute",
    bottom: 30,
    right: 24,
    backgroundColor: "#017a6b",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
  },
  helpBadge: {
    position: "absolute",
    top: -6,
    right: -14,
    backgroundColor: "#ff3b30",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
});