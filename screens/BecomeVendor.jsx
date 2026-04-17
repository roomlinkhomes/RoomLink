// screens/BecomeVendorScreen.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useColorScheme } from "react-native";
import { TextInput, Button, Checkbox } from "react-native-paper";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";

// Firebase
import { auth, db } from "../firebaseConfig";
import {
  doc,
  setDoc,
  onSnapshot,
  updateDoc,
  getDoc,        // ← Added
} from "firebase/firestore";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

const BANK_CODES = {
  "Access Bank": "044",
  "GTBank": "058",
  "Zenith Bank": "057",
  "First Bank": "011",
  "UBA": "033",
  "FCMB": "214",
  "Wema Bank": "035",
  "Fidelity Bank": "070",
  "Polaris Bank": "076",
  "Kuda": "50211",
  "Opay": "999992",
  "Moniepoint": "505",
  "PalmPay": "999991",
  "VFD Microfinance Bank": "090110",
  "Sterling Bank": "232",
  "Union Bank": "032",
  "Keystone Bank": "082",
  "Stanbic IBTC": "221",
  "Unity Bank": "215",
  "Taj Bank": "302",
  "Lotus Bank": "303",
};

const BANKS = Object.keys(BANK_CODES);

export default function BecomeVendorScreen() {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const theme = {
    background: isDark ? "#121212" : "#fafafa",
    card: isDark ? "#1e1e1e" : "#ffffff",
    text: isDark ? "#e0e0e0" : "#1a1a1a",
    textSecondary: isDark ? "#b0b0b0" : "#666",
    primary: isDark ? "#00ff7f" : "#017a6b",
    border: isDark ? "#333" : "#e0e6ed",
    error: "#ff4444",
  };

  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState(null);

  // Form states
  const [role, setRole] = useState("Host");
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [governmentIdUri, setGovernmentIdUri] = useState(null);
  const [governmentIdUrl, setGovernmentIdUrl] = useState(null);
  const [livePhotoUri, setLivePhotoUri] = useState(null);
  const [livePhotoUrl, setLivePhotoUrl] = useState(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [bankModalVisible, setBankModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingId, setUploadingId] = useState(false);
  const [uploadingLivePhoto, setUploadingLivePhoto] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const storage = getStorage();
  const snapshotUnsubRef = useRef(null); // To safely cleanup snapshot

  // Real-time listener for vendor application + manual fallback
  useEffect(() => {
    let authUnsub;

    authUnsub = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setStatus("error");
        setErrorMsg("Please sign in to continue.");
        return;
      }

      const appRef = doc(db, "vendorApplications", user.uid);

      // Clean previous snapshot if exists
      if (snapshotUnsubRef.current) {
        snapshotUnsubRef.current();
      }

      // Real-time listener
      snapshotUnsubRef.current = onSnapshot(
        appRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setStatus(data.status || "pending");
            setRole(data.role || "Host");
            setFullName(data.fullName || "");
            setBusinessName(data.businessName || "");
            setEmail(data.email || user.email || "");
            setPhoneNumber(data.phoneNumber || "");
            setBankName(data.bankName || "");
            setBankCode(data.bankCode || "");
            setAccountNumber(data.accountNumber || "");
            setAccountHolderName(data.accountHolderName || "");
            setGovernmentIdUrl(data.governmentIdUrl || null);
            setGovernmentIdUri(data.governmentIdUrl || null);
            setLivePhotoUrl(data.livePhotoUrl || null);
            setLivePhotoUri(data.livePhotoUrl || null);
            setAgreedToTerms(true);
          } else {
            setStatus("not_submitted");
            setEmail(user.email || "");
            setFullName("");
            setBusinessName("");
            setPhoneNumber("");
            setBankName("");
            setBankCode("");
            setAccountNumber("");
            setAccountHolderName("");
            setGovernmentIdUri(null);
            setGovernmentIdUrl(null);
            setLivePhotoUri(null);
            setLivePhotoUrl(null);
            setAgreedToTerms(false);
          }
        },
        (error) => {
          console.error("Firestore snapshot error:", error);
          setStatus("error");
          setErrorMsg("Failed to load application data. Please try again.");
        }
      );

      // Manual fetch as fallback (Critical for production builds)
      try {
        const docSnap = await getDoc(appRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setStatus(data.status || "pending");
          // You can also populate other fields here if needed
        } else {
          setStatus("not_submitted");
        }
      } catch (err) {
        console.error("Manual getDoc fallback failed:", err);
      }
    });

    // Cleanup function
    return () => {
      if (authUnsub) authUnsub();
      if (snapshotUnsubRef.current) {
        snapshotUnsubRef.current();
        snapshotUnsubRef.current = null;
      }
    };
  }, []);

  // When application is approved → update main user document
  useEffect(() => {
    if (status === "approved" && auth.currentUser?.uid) {
      const userRef = doc(db, "users", auth.currentUser.uid);
      updateDoc(userRef, {
        isVerified: true,
      }).catch((err) => {
        console.error("Failed to update verification status:", err);
      });
    }
  }, [status]);

  // ===================== Upload Functions =====================
  const uploadGovernmentId = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "image/*",
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || !result.assets?.[0]) return;

      const uri = result.assets[0].uri;
      setGovernmentIdUri(uri);
      setUploadingId(true);

      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Not logged in");

      const response = await fetch(uri);
      const blob = await response.blob();
      const fileRef = ref(storage, `vendorIds/${currentUser.uid}/id_${Date.now()}.jpg`);
      const uploadTask = uploadBytesResumable(fileRef, blob);

      const url = await new Promise((resolve, reject) => {
        uploadTask.on("state_changed", null, reject, async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadUrl);
        });
      });

      setGovernmentIdUrl(url);
      Alert.alert("Success", "Government ID uploaded successfully");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not upload ID. Try again.");
    } finally {
      setUploadingId(false);
    }
  };

  const takeAndUploadLivePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert("Camera Access Required", "Please allow camera access in your device settings.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.[0]) return;

      const uri = result.assets[0].uri;
      setLivePhotoUri(uri);
      setUploadingLivePhoto(true);

      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Not logged in");

      const response = await fetch(uri);
      const blob = await response.blob();
      const fileRef = ref(storage, `vendorLivePhotos/${currentUser.uid}/selfie_${Date.now()}.jpg`);
      const uploadTask = uploadBytesResumable(fileRef, blob);

      const url = await new Promise((resolve, reject) => {
        uploadTask.on("state_changed", null, reject, async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadUrl);
        });
      });

      setLivePhotoUrl(url);
      Alert.alert("Success", "Live photo captured and uploaded");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", err.message || "Failed to capture/upload photo");
    } finally {
      setUploadingLivePhoto(false);
    }
  };

  // ===================== Submit =====================
  const handleSubmit = async () => {
    if (submitting) return;

    if (!fullName.trim()) return Alert.alert("Required", "Full name is required");
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) return Alert.alert("Invalid", "Valid email required");
    if (phoneNumber.length < 10) return Alert.alert("Invalid", "Phone number must be at least 10 digits");
    if (!bankName || !bankCode) return Alert.alert("Required", "Please select a valid bank");
    if (accountNumber.length !== 10) return Alert.alert("Invalid", "Account number must be exactly 10 digits");
    if (!accountHolderName.trim()) return Alert.alert("Required", "Account holder name required");
    if (!governmentIdUrl) return Alert.alert("Required", "Please upload Government ID");
    if (!livePhotoUrl) return Alert.alert("Required", "Please take a live photo / selfie");
    if (!agreedToTerms) return Alert.alert("Required", "You must agree to the terms");

    const currentUser = auth.currentUser;
    if (!currentUser) return Alert.alert("Error", "No user logged in");

    const applicationData = {
      uid: currentUser.uid,
      email: email.trim(),
      phoneNumber: phoneNumber.trim(),
      role,
      fullName: fullName.trim(),
      businessName: businessName.trim() || null,
      bankName,
      bankCode,
      accountNumber,
      accountHolderName: accountHolderName.trim(),
      governmentIdUrl,
      livePhotoUrl,
      submittedAt: new Date().toISOString(),
      status: "pending",
      reviewedAt: null,
      reviewedBy: null,
      lastEditedAt: new Date().toISOString(),
    };

    try {
      setSubmitting(true);
      await setDoc(doc(db, "vendorApplications", currentUser.uid), applicationData, { merge: true });
      setStatus("pending");
      setIsEditing(false);
      Alert.alert("Success", "Application submitted successfully. It is now pending review.");
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to submit application.");
    } finally {
      setSubmitting(false);
    }
  };

  const startEditing = () => {
    setIsEditing(true);
    setStatus("not_submitted");
  };

  const filteredBanks = BANKS.filter((bank) =>
    bank.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ===================== Render =====================
  if (status === "loading") {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ color: theme.textSecondary, marginTop: 16, fontSize: 16 }}>
          Loading application status...
        </Text>
      </View>
    );
  }

  if (status === "error") {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <Ionicons name="alert-circle-outline" size={80} color={theme.error} />
        <Text style={{ color: theme.text, fontSize: 20, fontWeight: "bold", marginTop: 24 }}>Something went wrong</Text>
        <Text style={{ color: theme.textSecondary, textAlign: "center", marginTop: 12 }}>{errorMsg}</Text>
        <TouchableOpacity onPress={() => setStatus("loading")} style={[styles.retryBtn, { backgroundColor: theme.primary }]}>
          <Text style={{ color: "#fff", fontWeight: "600" }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Form Mode
  if (status === "not_submitted" || isEditing) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, backgroundColor: theme.background }}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              if (isEditing) setIsEditing(false);
              navigation.goBack();
            }}
          >
            <Ionicons name="arrow-back" size={28} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.pageTitle, { color: theme.text }]}>
            {isEditing ? "Edit Application" : "Become a Host / Vendor"}
          </Text>
          <View style={{ width: 48 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 20 }}>
          {/* Rest of your form UI remains exactly the same */}
          <View style={styles.roleToggle}>
            <TouchableOpacity
              onPress={() => setRole("Host")}
              style={[styles.roleBtn, role === "Host" && styles.roleActive]}
            >
              <Text style={[styles.roleText, role === "Host" && { color: theme.primary }]}>Host</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setRole("Vendor")}
              style={[styles.roleBtn, role === "Vendor" && styles.roleActive]}
            >
              <Text style={[styles.roleText, role === "Vendor" && { color: theme.primary }]}>Vendor</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Personal & Contact Details</Text>
            <TextInput label="Full Name *" value={fullName} onChangeText={setFullName} mode="outlined" style={styles.input} theme={{ colors: { primary: theme.primary } }} />
            <TextInput label="Email *" value={email} onChangeText={setEmail} mode="outlined" keyboardType="email-address" autoCapitalize="none" style={styles.input} theme={{ colors: { primary: theme.primary } }} />
            <TextInput label="Phone Number *" value={phoneNumber} onChangeText={(text) => setPhoneNumber(text.replace(/[^0-9]/g, "").slice(0, 11))} mode="outlined" keyboardType="phone-pad" maxLength={11} style={styles.input} theme={{ colors: { primary: theme.primary } }} />
            <TextInput label="Business Name (optional)" value={businessName} onChangeText={setBusinessName} mode="outlined" style={styles.input} theme={{ colors: { primary: theme.primary } }} />

            <Text style={[styles.label, { color: theme.textSecondary, marginTop: 16 }]}>Government ID *</Text>
            <TouchableOpacity style={styles.uploadBtn} onPress={uploadGovernmentId} disabled={uploadingId}>
              {governmentIdUri ? (
                <Image source={{ uri: governmentIdUri }} style={{ width: "100%", height: 180, borderRadius: 12 }} resizeMode="cover" />
              ) : (
                <View style={{ alignItems: "center", padding: 30 }}>
                  <Ionicons name="cloud-upload-outline" size={48} color={theme.primary} />
                  <Text style={{ color: theme.textSecondary, marginTop: 12, textAlign: "center" }}>Tap to upload Government ID</Text>
                </View>
              )}
              {uploadingId && <ActivityIndicator size="large" color={theme.primary} style={{ position: "absolute" }} />}
            </TouchableOpacity>

            <Text style={[styles.label, { color: theme.textSecondary, marginTop: 32 }]}>Live Photo / Selfie *</Text>
            <Text style={{ color: "#e65100", fontSize: 13, marginBottom: 8, fontStyle: "italic" }}>Make sure the picture matches with the one on your ID</Text>
            <TouchableOpacity style={styles.uploadBtn} onPress={takeAndUploadLivePhoto} disabled={uploadingLivePhoto}>
              {livePhotoUri ? (
                <View style={{ position: "relative" }}>
                  <Image source={{ uri: livePhotoUri }} style={{ width: "100%", height: 180, borderRadius: 12 }} resizeMode="cover" />
                  {uploadingLivePhoto && <View style={styles.overlay}><ActivityIndicator size="large" color={theme.primary} /></View>}
                </View>
              ) : (
                <View style={{ alignItems: "center", padding: 30 }}>
                  <Ionicons name="camera-outline" size={48} color={theme.primary} />
                  <Text style={{ color: theme.textSecondary, marginTop: 12, textAlign: "center" }}>Tap to take live photo (camera)</Text>
                </View>
              )}
            </TouchableOpacity>

            {livePhotoUri && (
              <Button mode="outlined" onPress={takeAndUploadLivePhoto} style={{ marginTop: 12, alignSelf: "center" }} disabled={uploadingLivePhoto}>
                Retake Photo
              </Button>
            )}

            <Text style={[styles.label, { color: theme.textSecondary, marginTop: 32 }]}>Bank Name *</Text>
            <TouchableOpacity onPress={() => setBankModalVisible(true)}>
              <TextInput value={bankName} editable={false} mode="outlined" placeholder="Select your bank" right={<TextInput.Icon icon="chevron-down" color={theme.primary} />} theme={{ colors: { primary: theme.primary } }} />
            </TouchableOpacity>

            <TextInput label="Account Number *" value={accountNumber} onChangeText={(text) => setAccountNumber(text.replace(/[^0-9]/g, "").slice(0, 10))} mode="outlined" keyboardType="numeric" maxLength={10} style={styles.input} theme={{ colors: { primary: theme.primary } }} />
            <TextInput label="Account Holder Name *" value={accountHolderName} onChangeText={setAccountHolderName} mode="outlined" style={styles.input} theme={{ colors: { primary: theme.primary } }} />
          </View>

          <View style={[styles.card, { marginTop: 24, backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Rules & Agreement</Text>
            <ScrollView style={styles.termsBox} nestedScrollEnabled>
              <Text style={[styles.termsText, { color: theme.textSecondary }]}>
                • Payouts are processed within 24 hours after booking confirmation{'\n\n'}
                • Vendors are charged only a 2% transaction fee, no additional commission{'\n\n'}
                • By proceeding, you agree to the RoomLink Terms, Privacy Policy, and Community Guidelines{'\n\n'}
                • All submitted information must be accurate; false details may result in application rejection{'\n\n'}
                • Verification review time is typically 48–72 hours{'\n\n'}
              </Text>
            </ScrollView>
            <View style={styles.checkboxRow}>
              <Checkbox status={agreedToTerms ? "checked" : "unchecked"} onPress={() => setAgreedToTerms(!agreedToTerms)} color={theme.primary} />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>I agree to the rules and RoomLink's Terms of Service</Text>
            </View>
          </View>

          <Button
            mode="contained"
            onPress={handleSubmit}
            disabled={submitting || uploadingId || uploadingLivePhoto || !agreedToTerms}
            loading={submitting}
            style={styles.submitBtn}
            theme={{ colors: { primary: theme.primary } }}
          >
            {submitting ? "Submitting..." : isEditing ? "Update & Re-submit" : "Submit Application"}
          </Button>
        </ScrollView>

        <Modal visible={bankModalVisible} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalContainer, { backgroundColor: theme.card }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Select Bank</Text>
                <TouchableOpacity onPress={() => setBankModalVisible(false)}>
                  <Ionicons name="close" size={28} color={theme.text} />
                </TouchableOpacity>
              </View>
              <TextInput placeholder="Search bank..." value={searchQuery} onChangeText={setSearchQuery} style={[styles.searchInput, { borderColor: theme.border }]} placeholderTextColor={theme.textSecondary} />
              <FlatList
                data={filteredBanks}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.bankItem}
                    onPress={() => {
                      setBankName(item);
                      setBankCode(BANK_CODES[item] || "");
                      setBankModalVisible(false);
                      setSearchQuery("");
                    }}
                  >
                    <Text style={[styles.bankText, { color: theme.text }]}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    );
  }

  // Pending Screen
  if (status === "pending") {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <Ionicons name="hourglass-outline" size={80} color={theme.primary} />
        <Text style={[styles.successTitle, { color: theme.text }]}>Under Review</Text>
        <Text style={[styles.successText, { color: theme.textSecondary }]}>
          Your application is being reviewed.{'\n\n'}Expect feedback within 48-72 hours.
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: theme.primary, marginTop: 32, fontSize: 16 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Approved / Rejected Screen
  if (status === "approved" || status === "rejected") {
    const isApproved = status === "approved";

    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <Ionicons
          name={isApproved ? "checkmark-circle" : "close-circle"}
          size={90}
          color={isApproved ? theme.primary : theme.error}
        />
        <Text style={[styles.successTitle, { color: theme.text }]}>
          {isApproved ? "Approved!" : "Not Approved"}
        </Text>
        <Text style={[styles.successText, { color: theme.textSecondary, textAlign: "center" }]}>
          {isApproved
            ? "Your application has been approved!\nYou can now start hosting or vending."
            : "Your application was not approved.\nYou may edit and re-apply."}
        </Text>
        <Button
          mode="contained"
          onPress={startEditing}
          style={styles.submitBtn}
          theme={{ colors: { primary: theme.primary } }}
        >
          {isApproved ? "Edit Details" : "Edit & Re-apply"}
        </Button>
      </View>
    );
  }

  return (
    <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
      <Text style={{ color: theme.text, fontSize: 18 }}>Unknown application state</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 20 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16 },
  pageTitle: { fontSize: 24, fontWeight: "800" },
  card: { padding: 20, borderRadius: 16, marginBottom: 16, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 16 },
  label: { fontSize: 15, fontWeight: "600", marginBottom: 8, marginTop: 12 },
  input: { marginBottom: 12 },
  uploadBtn: { borderWidth: 1.5, borderColor: "#aaa", borderStyle: "dashed", borderRadius: 12, padding: 12, marginVertical: 8, minHeight: 180, justifyContent: "center" },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  termsBox: { maxHeight: 220, borderWidth: 1, borderColor: "#444", borderRadius: 12, padding: 12, marginBottom: 16 },
  termsText: { fontSize: 14, lineHeight: 22 },
  checkboxRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  checkboxLabel: { marginLeft: 12, fontSize: 14, flex: 1 },
  submitBtn: { marginTop: 32, marginBottom: 40, borderRadius: 12 },
  retryBtn: { marginTop: 32, paddingVertical: 12, paddingHorizontal: 32, borderRadius: 12 },
  roleToggle: { flexDirection: "row", backgroundColor: "#eee", borderRadius: 12, padding: 4, marginBottom: 24 },
  roleBtn: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 10 },
  roleActive: { backgroundColor: "#fff", elevation: 3 },
  roleText: { fontSize: 16, fontWeight: "600", color: "#666" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  modalContainer: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "85%", padding: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: "700" },
  searchInput: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12, fontSize: 16 },
  bankItem: { paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#444" },
  bankText: { fontSize: 16 },
});