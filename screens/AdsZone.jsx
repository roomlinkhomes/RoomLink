// screens/AdsZone.jsx — FULLY FIXED: Upload works reliably, no silent failures
import React, { useState, useContext, useEffect } from "react";
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
import { AdsContext } from "../context/AdsContext";
import { auth, db } from "../firebaseConfig";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  doc,
  onSnapshot,
  setDoc,
} from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";

const CLOUD_NAME = "drserbss8";
const UPLOAD_PRESET = "roomlink_preset";

const MAX_TOTAL_ADS = 35;

const plans = [
  { id: "free", title: "1 Week Free", price: 0, desc: "Ad runs for 7 days", durationDays: 7 },
  { id: "daily", title: "24 Hours", price: 100, desc: "Ad runs for 24 hours", durationDays: 1 },
  { id: "weekly", title: "Weekly", price: 3500, desc: "Ad runs for 7 days", durationDays: 7 },
  { id: "monthly", title: "Monthly", price: 10500, desc: "Ad runs for 30 days", durationDays: 30 },
];

export default function AdsZone() {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [image, setImage] = useState(null);
  const [link, setLink] = useState("");
  const [uploading, setUploading] = useState(false);
  const [activeAd, setActiveAd] = useState(null);
  const [activeAdEndDate, setActiveAdEndDate] = useState(null);
  const [totalAdsCount, setTotalAdsCount] = useState(0);
  const [billboardFull, setBillboardFull] = useState(false);
  const { addAd } = useContext(AdsContext) || {};
  const screenHeight = Dimensions.get("window").height;
  const navigation = useNavigation();
  const user = auth.currentUser;

  // Real-time: user's active ad + global total active ads count
  useEffect(() => {
    if (!user) {
      setActiveAd(null);
      setActiveAdEndDate(null);
      setTotalAdsCount(0);
      setBillboardFull(false);
      return;
    }

    // User's active ad
    const userAdsQuery = query(collection(db, "ads"), where("userId", "==", user.uid));
    const unsubUser = onSnapshot(userAdsQuery, (snap) => {
      let active = null;
      const now = new Date();
      snap.forEach((doc) => {
        const data = doc.data();
        const end = data.expiresAt?.toDate?.() || new Date(data.expiresAt);
        if (end > now) {
          active = { ...data, id: doc.id };
          setActiveAdEndDate(end);
        }
      });
      setActiveAd(active);
    });

    // Global total active ads count (paid + free)
    const allAdsQuery = query(collection(db, "ads"));
    const unsubAll = onSnapshot(allAdsQuery, (snap) => {
      let count = 0;
      const now = new Date();
      snap.forEach((doc) => {
        const data = doc.data();
        const end = data.expiresAt?.toDate?.() || new Date(data.expiresAt);
        if (end > now) count++;
      });
      setTotalAdsCount(count);
      setBillboardFull(count >= MAX_TOTAL_ADS);
    });

    return () => {
      unsubUser();
      unsubAll();
    };
  }, [user]);

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

  // Fixed: No longer controls uploading state here
  const uploadToCloudinary = async (imageUri) => {
    try {
      const data = new FormData();
      data.append("file", { uri: imageUri, type: "image/jpeg", name: "ad-banner.jpg" });
      data.append("upload_preset", UPLOAD_PRESET);
      data.append("cloud_name", CLOUD_NAME);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: data,
      });

      if (!res.ok) {
        throw new Error(`Upload failed with status ${res.status}`);
      }

      const json = await res.json();
      return json.secure_url || null;
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      Alert.alert("Upload Error", "Failed to upload image. Check your connection and try again.");
      return null;
    }
  };

  const handlePayment = async () => {
    if (!selectedPlan) return Alert.alert("Select Plan", "Please select a plan first");
    if (!user) return Alert.alert("Not Logged In", "Please log in to continue");

    try {
      const res = await fetch("https://us-central1-roomlink-homes.cloudfunctions.net/initializePaystack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          amount: Math.max(selectedPlan.price, 50) * 100,
          reference: `billboard_${user.uid}_${Date.now()}`,
          callback_url: "roomlink://payment-success",
        }),
      });
      const data = await res.json();
      if (!data.url) throw new Error("Payment initialization failed");

      navigation.navigate("PaystackWebView", { url: data.url });
    } catch (error) {
      Alert.alert("Payment Error", error.message || "Try again");
    }
  };

  // Fixed: Proper loading control + no silent failures
  const uploadBanner = async () => {
    if (!image) {
      Alert.alert("No Image", "Please pick an image first!");
      return;
    }
    if (link && !/^https?:\/\//i.test(link)) {
      Alert.alert("Invalid Link", "Link must start with http:// or https://");
      return;
    }

    setUploading(true);

    const cloudUrl = await uploadToCloudinary(image.uri);

    setUploading(false);

    if (!cloudUrl) {
      // uploadToCloudinary already shows alert, but reinforce
      Alert.alert("Upload Failed", "Could not upload image. Please try again.");
      return;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (selectedPlan?.durationDays || 7));

    let message = "Your ad will appear immediately on the billboard.";
    if (billboardFull) {
      message = "The billboard is full (35 ads). Your ad is queued and will appear once the oldest ad expires.";
    }

    Alert.alert(
      "Confirm Upload",
      message + "\n\nProceed?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Upload",
          onPress: async () => {
            try {
              const docRef = await addDoc(collection(db, "ads"), {
                userId: user.uid,
                url: cloudUrl,
                link: link || null,
                plan: selectedPlan.id,
                createdAt: serverTimestamp(),
                expiresAt,
              });

              const newAd = {
                id: docRef.id,
                userId: user.uid,
                url: cloudUrl,
                link: link || null,
                plan: selectedPlan.id,
                createdAt: new Date().toISOString(),
                expiresAt: expiresAt.toISOString(),
              };
              if (typeof addAd === "function") addAd(newAd);

              // Mark free plan as used
              if (selectedPlan.id === "free") {
                await setDoc(doc(db, "users", user.uid), {
                  freeAdUsed: true,
                  freeAdUsedAt: serverTimestamp(),
                }, { merge: true });
              }

              Alert.alert("Success!", billboardFull ? "Your ad is queued and will appear soon!" : "Your ad is now live on the billboard!");
              setModalVisible(false);
              setImage(null);
              setLink("");
              setSelectedPlan(null);
            } catch (err) {
              console.error("Firestore save error:", err);
              Alert.alert("Save Failed", "Could not save ad to database. Try again.");
            }
          },
        },
      ]
    );
  };

  const openModal = (plan) => {
    if (activeAd) {
      Alert.alert("Active Ad", `You already have an active ${activeAd.plan} ad running until ${activeAdEndDate.toLocaleDateString()}. Wait until it expires to post a new one.`);
      return;
    }
    setSelectedPlan(plan);
    setModalVisible(true);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Boost your reach</Text>
      <Text style={styles.subText}>Select a plan to promote your post, website, or product.</Text>

      {activeAd && (
        <Text style={{ color: "green", fontWeight: "bold", textAlign: "center", marginBottom: 20 }}>
          Active Ad: {activeAd.plan.toUpperCase()} (expires {activeAdEndDate.toLocaleDateString()})
        </Text>
      )}

      {billboardFull && (
        <Text style={{ color: "red", fontWeight: "bold", textAlign: "center", marginBottom: 15 }}>
          Billboard Full (35/35 ads) — All new ads will be queued
        </Text>
      )}

      <View style={styles.planContainer}>
        {plans.map((plan) => {
          const isActive = activeAd && activeAd.plan === plan.id;
          const isFreeUsed = plan.id === "free" && activeAd?.plan === "free";

          return (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                isActive && { borderColor: "orange", borderWidth: 2, backgroundColor: "#fff4e6" },
                (plan.id === "free" && isFreeUsed) && { opacity: 0.5, backgroundColor: "#f0f0f0" },
              ]}
              onPress={() => openModal(plan)}
              disabled={isActive || (plan.id === "free" && isFreeUsed)}
            >
              <Ionicons name="megaphone-outline" size={24} color="orange" style={{ marginBottom: 5 }} />
              <Text style={styles.planTitle}>{plan.title}</Text>
              <Text style={styles.planPrice}>{plan.price === 0 ? "₦0" : `₦${plan.price}`}</Text>
              <Text style={styles.planDesc}>{plan.desc}</Text>
              {isActive && (
                <View style={styles.activeBadge}>
                  <Text style={styles.activeText}>Active</Text>
                </View>
              )}
              {plan.id === "free" && isFreeUsed && (
                <Text style={{ color: "red", fontSize: 12, marginTop: 5, fontWeight: "bold" }}>Already Used</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.footerText}>Your sponsored ad will appear instantly on RoomLink’s home billboard.</Text>

      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.bottomModalOverlay}>
          <View style={[styles.bottomModalContent, { maxHeight: screenHeight * 0.8 }]}>
            <Text style={styles.modalTitle}>{selectedPlan?.title} Promotion</Text>

            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              {image ? (
                <Image source={{ uri: image.uri }} style={{ width: "100%", height: 150, borderRadius: 10 }} />
              ) : (
                <View style={{ alignItems: "center" }}>
                  <Ionicons name="images-outline" size={30} color="orange" />
                  <Text style={{ color: "#666", marginTop: 5 }}>Pick Image from Gallery</Text>
                </View>
              )}
            </TouchableOpacity>

            <TextInput
              placeholder="https://example.com"
              style={styles.input}
              value={link}
              onChangeText={setLink}
              keyboardType="url"
            />

            {uploading ? (
              <ActivityIndicator size="large" color="#1A237E" />
            ) : selectedPlan?.price > 0 ? (
              <TouchableOpacity style={styles.payBtn} onPress={handlePayment}>
                <Text style={styles.payText}>Pay ₦{selectedPlan.price}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.uploadBtn} onPress={uploadBanner}>
                <Text style={styles.uploadText}>Upload Banner</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff", flexGrow: 1 },
  header: { fontSize: 20, fontWeight: "bold", textAlign: "center", marginBottom: 10 },
  subText: { textAlign: "center", marginBottom: 20 },
  planContainer: { gap: 10 },
  planCard: { backgroundColor: "#f5f7ff", borderRadius: 12, padding: 15, alignItems: "center", borderWidth: 1, borderColor: "#036dd6" },
  planTitle: { fontSize: 16, fontWeight: "bold" },
  planPrice: { fontSize: 14, color: "green", marginTop: 2 },
  planDesc: { color: "#000", marginTop: 2, textAlign: "center", fontSize: 13 },
  activeBadge: { marginTop: 5, backgroundColor: "orange", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  activeText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  footerText: { marginTop: 20, textAlign: "center", fontStyle: "italic", fontSize: 13 },
  bottomModalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  bottomModalContent: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  imagePicker: { width: "100%", height: 150, borderWidth: 1, borderColor: "#ccc", borderRadius: 10, justifyContent: "center", alignItems: "center", marginBottom: 15 },
  input: { width: "100%", borderWidth: 1, borderColor: "#ccc", padding: 10, borderRadius: 8, marginBottom: 15 },
  payBtn: { backgroundColor: "#1A237E", paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  payText: { color: "#fff", fontWeight: "bold" },
  uploadBtn: { backgroundColor: "green", paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  uploadText: { color: "#fff", fontWeight: "bold" },
  cancelBtn: { marginTop: 15, alignItems: "center" },
  cancelText: { color: "red", fontWeight: "600" },
});