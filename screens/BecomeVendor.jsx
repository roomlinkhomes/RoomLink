// screens/BecomeVendorScreen.jsx — FIXED: No blank screen, edit works, stable ID picker with DocumentPicker
import React, { useState, useEffect } from "react";
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

// Firebase imports
import { auth, db } from "../firebaseConfig";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

const BANKS = [
  "Access Bank", "GTBank", "Zenith Bank", "First Bank", "UBA",
  "FCMB", "Wema Bank", "Fidelity Bank", "Polaris Bank", "Kuda",
  "Opay", "Moniepoint", "PalmPay", "VFD Microfinance Bank",
  "Sterling Bank", "Union Bank", "Keystone Bank", "Stanbic IBTC",
  "Unity Bank", "Taj Bank", "Lotus Bank",
];

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
  const [role, setRole] = useState("Host");
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [governmentIdUri, setGovernmentIdUri] = useState(null);
  const [governmentIdUrl, setGovernmentIdUrl] = useState(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [bankModalVisible, setBankModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingId, setUploadingId] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const storage = getStorage();

  // Real-time listener with proper error handling & logging
  useEffect(() => {
    console.log("BecomeVendorScreen mounted");

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      console.log("Auth state changed - user:", user ? user.uid : "null");

      if (!user) {
        setStatus("error");
        setErrorMsg("Please sign in to access this screen.");
        console.log("No authenticated user → error state");
        return;
      }

      const appRef = doc(db, "vendorApplications", user.uid);
      console.log("Listening to Firestore doc:", `vendorApplications/${user.uid}`);

      const unsubscribeSnap = onSnapshot(appRef, (docSnap) => {
        console.log("Snapshot received - exists:", docSnap.exists());
        setErrorMsg(null);

        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log("Vendor data loaded:", data.status, data);
          setStatus(data.status || "pending");
          setRole(data.role || "Host");
          setFullName(data.fullName || "");
          setBusinessName(data.businessName || "");
          setEmail(data.email || user.email || "");
          setPhoneNumber(data.phoneNumber || "");
          setBankName(data.bankName || "");
          setAccountNumber(data.accountNumber || "");
          setAccountHolderName(data.accountHolderName || "");
          setGovernmentIdUrl(data.governmentIdUrl || null);
          setGovernmentIdUri(data.governmentIdUrl || null);
          setAgreedToTerms(true);
        } else {
          console.log("No vendor application doc found → not_submitted");
          setStatus("not_submitted");
          setEmail(user.email || "");
          setPhoneNumber("");
          setGovernmentIdUri(null);
          setGovernmentIdUrl(null);
          setAgreedToTerms(false);
        }
      }, (err) => {
        console.error("Firestore snapshot error:", err.code, err.message);
        setStatus("error");
        setErrorMsg(`Failed to load application status: ${err.message || "Unknown error"}`);
      });

      return () => {
        console.log("Unsubscribing Firestore listener");
        unsubscribeSnap();
      };
    });

    return () => {
      console.log("Unsubscribing auth listener");
      unsubscribeAuth();
    };
  }, [navigation]);

  // Stable Government ID upload using DocumentPicker
  const uploadGovernmentId = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "image/*",
        copyToCacheDirectory: true,
        multiple: false,
      });

      console.log("DocumentPicker result for ID:", result);

      if (!result.canceled && result.assets?.[0]) {
        const uri = result.assets[0].uri;
        setGovernmentIdUri(uri);
        setUploadingId(true);

        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error("No user logged in");

        const response = await fetch(uri);
        const blob = await response.blob();
        const fileRef = ref(storage, `vendorIds/${currentUser.uid}/id_${Date.now()}.jpeg`);
        const uploadTask = uploadBytesResumable(fileRef, blob);

        const url = await new Promise((resolve, reject) => {
          uploadTask.on("state_changed", null, reject, async () => {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadUrl);
          });
        });

        setGovernmentIdUrl(url);
        Alert.alert("Success", "Government ID uploaded successfully!");
      }
    } catch (err) {
      console.error("ID upload error:", err);
      Alert.alert("Error", err.message || "Failed to upload ID. Try again.");
    } finally {
      setUploadingId(false);
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;

    if (!fullName.trim()) return Alert.alert("Required", "Full name is required");
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) return Alert.alert("Invalid", "Valid email required");
    if (!phoneNumber || phoneNumber.length < 10) return Alert.alert("Invalid", "Phone ≥ 10 digits");
    if (!bankName) return Alert.alert("Required", "Select a bank");
    if (accountNumber.length !== 10) return Alert.alert("Invalid", "Account number must be 10 digits");
    if (!accountHolderName.trim()) return Alert.alert("Required", "Account holder name required");
    if (!governmentIdUrl) return Alert.alert("Required", "Upload Government ID");
    if (!agreedToTerms) return Alert.alert("Required", "Agree to terms");

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
      accountNumber,
      accountHolderName: accountHolderName.trim(),
      governmentIdUrl,
      submittedAt: new Date().toISOString(),
      status: "pending",
      reviewedAt: null,
      reviewedBy: null,
      lastEditedAt: new Date().toISOString(),
    };

    try {
      setSubmitting(true);
      const appRef = doc(db, "vendorApplications", currentUser.uid);
      await setDoc(appRef, applicationData, { merge: true });

      setStatus("pending");
      setIsEditing(false);

      Alert.alert("Success!", "Application submitted/updated. Pending review.");
    } catch (err) {
      console.error("Submit error:", err);
      Alert.alert("Error", "Failed to submit. Check connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Fixed: Edit button now forces form visibility
  const startEditing = () => {
    console.log("Edit button pressed → forcing form");
    setIsEditing(true);
    setStatus("not_submitted");
  };

  const filteredBanks = BANKS.filter((bank) =>
    bank.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Loading UI
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

  // Error UI
  if (status === "error") {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <Ionicons name="alert-circle" size={80} color={theme.error} />
        <Text style={{ color: theme.text, fontSize: 20, fontWeight: "bold", marginTop: 24 }}>
          Error Loading
        </Text>
        <Text style={{ color: theme.textSecondary, textAlign: "center", marginTop: 12, paddingHorizontal: 40 }}>
          {errorMsg || "Failed to load application data. Check your internet connection."}
        </Text>
        <TouchableOpacity
          onPress={() => setStatus("loading")}
          style={{ marginTop: 32, paddingVertical: 12, paddingHorizontal: 32, backgroundColor: theme.primary, borderRadius: 12 }}
        >
          <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginTop: 16 }}
        >
          <Text style={{ color: theme.primary, fontSize: 16 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Form UI (new or edit)
  if (status === "not_submitted" || isEditing) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, backgroundColor: theme.background }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => {
            if (isEditing) setIsEditing(false);
            navigation.goBack();
          }}>
            <Ionicons name="arrow-back" size={28} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.pageTitle, { color: theme.text }]}>
            {isEditing ? "Edit Application" : "Become a Host / Vendor"}
          </Text>
          <View style={{ width: 48 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 20 }}>
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
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {isEditing ? "Update Details" : "Personal & Contact Details"}
            </Text>

            <TextInput
              label="Full Name *"
              value={fullName}
              onChangeText={setFullName}
              mode="outlined"
              style={styles.input}
              theme={{ colors: { primary: theme.primary } }}
            />

            <TextInput
              label="Email *"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              theme={{ colors: { primary: theme.primary } }}
            />

            <TextInput
              label="Phone Number *"
              value={phoneNumber}
              onChangeText={(text) => setPhoneNumber(text.replace(/[^0-9]/g, "").slice(0, 11))}
              mode="outlined"
              keyboardType="phone-pad"
              maxLength={11}
              style={styles.input}
              theme={{ colors: { primary: theme.primary } }}
            />

            <TextInput
              label="Business Name (optional)"
              value={businessName}
              onChangeText={setBusinessName}
              mode="outlined"
              style={styles.input}
              theme={{ colors: { primary: theme.primary } }}
            />

            <Text style={[styles.label, { color: theme.textSecondary }]}>Government ID *</Text>
            <TouchableOpacity style={styles.uploadBtn} onPress={uploadGovernmentId} disabled={uploadingId}>
              {governmentIdUri ? (
                <View style={{ position: 'relative' }}>
                  <Image
                    source={{ uri: governmentIdUri }}
                    style={{ width: "100%", height: 180, borderRadius: 12 }}
                    resizeMode="cover"
                  />
                  {uploadingId && (
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                      <ActivityIndicator size="large" color={theme.primary} />
                    </View>
                  )}
                </View>
              ) : (
                <View style={{ alignItems: "center", padding: 20 }}>
                  <Ionicons name="cloud-upload-outline" size={40} color={theme.primary} />
                  <Text style={[styles.uploadText, { color: theme.textSecondary, marginTop: 12 }]}>
                    Tap to {governmentIdUrl ? "replace" : "upload"} Government ID
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <Text style={[styles.label, { color: theme.textSecondary }]}>Bank Name *</Text>
            <TouchableOpacity onPress={() => setBankModalVisible(true)}>
              <TextInput
                value={bankName}
                editable={false}
                mode="outlined"
                placeholder="Select your bank"
                right={<TextInput.Icon icon="chevron-down" color={theme.primary} />}
                theme={{ colors: { primary: theme.primary } }}
              />
            </TouchableOpacity>

            <TextInput
              label="Account Number *"
              value={accountNumber}
              onChangeText={(text) => setAccountNumber(text.replace(/[^0-9]/g, "").slice(0, 10))}
              mode="outlined"
              keyboardType="numeric"
              maxLength={10}
              style={styles.input}
              theme={{ colors: { primary: theme.primary } }}
            />

            <TextInput
              label="Account Holder Name *"
              value={accountHolderName}
              onChangeText={setAccountHolderName}
              mode="outlined"
              style={styles.input}
              theme={{ colors: { primary: theme.primary } }}
            />
          </View>

          <View style={[styles.card, { marginTop: 20, backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Rules & Agreement</Text>
            <ScrollView style={styles.termsBox} nestedScrollEnabled>
              <Text style={[styles.termsText, { color: theme.textSecondary }]}>
                • Payouts processed 24h after booking confirmation (hosts) or delivery (vendors){'\n\n'}
                • RoomLink commission: 10-15% + Paystack fees{'\n\n'}
                • You agree to RoomLink Terms, Privacy Policy & Community Guidelines{'\n\n'}
                • Bank details used to create Paystack sub-account for payouts{'\n\n'}
                • Review time: 48-72 hours. Fraud = rejection/ban{'\n\n'}
                • You're responsible for accurate listings & local law compliance
              </Text>
            </ScrollView>

            <View style={styles.checkboxRow}>
              <Checkbox
                status={agreedToTerms ? "checked" : "unchecked"}
                onPress={() => setAgreedToTerms(!agreedToTerms)}
                color={theme.primary}
              />
              <Text style={[styles.checkboxLabel, { color: theme.text }]}>
                I agree to the rules and RoomLink's Terms of Service
              </Text>
            </View>
          </View>

          <Button
            mode="contained"
            onPress={handleSubmit}
            disabled={submitting || uploadingId || !agreedToTerms}
            loading={submitting}
            style={styles.submitBtn}
            theme={{ colors: { primary: theme.primary } }}
          >
            {submitting ? "Submitting..." : (isEditing ? "Update & Re-submit" : "Submit Application")}
          </Button>
        </ScrollView>

        {/* Bank Modal */}
        <Modal visible={bankModalVisible} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalContainer, { backgroundColor: theme.card }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Select Bank</Text>
                <TouchableOpacity onPress={() => setBankModalVisible(false)}>
                  <Ionicons name="close" size={28} color={theme.text} />
                </TouchableOpacity>
              </View>

              <TextInput
                placeholder="Search bank..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={[styles.searchInput, { borderColor: theme.border }]}
                placeholderTextColor={theme.textSecondary}
              />

              <FlatList
                data={filteredBanks}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.bankItem}
                    onPress={() => {
                      setBankName(item);
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

  // Approved / Rejected
  if (status === "approved" || status === "rejected") {
    const isApproved = status === "approved";
    return (
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.background }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={28} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.pageTitle, { color: theme.text }]}>
            {isApproved ? "You're Approved!" : "Application Rejected"}
          </Text>
          <View style={{ width: 48 }} />
        </View>

        <View style={styles.successContainer}>
          <Ionicons
            name={isApproved ? "checkmark-circle" : "close-circle"}
            size={90}
            color={isApproved ? theme.primary : theme.error}
          />
          <Text style={[styles.successTitle, { color: theme.text }]}>
            {isApproved ? "Congratulations!" : "Not Approved"}
          </Text>
          <Text style={[styles.successText, { color: theme.textSecondary }]}>
            {isApproved
              ? `Your application to become a ${role.toLowerCase()} has been approved!\n\nYou can now create listings and earn.`
              : `Your application to become a ${role.toLowerCase()} was not approved.\n\nYou can edit and re-submit.`}
          </Text>

          <Button
            mode="contained"
            onPress={startEditing}
            style={styles.submitBtn}
            theme={{ colors: { primary: theme.primary } }}
          >
            {isApproved ? "Edit Profile/Details" : "Edit & Re-apply"}
          </Button>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // Pending
  if (status === "pending") {
    return (
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.background }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={28} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.pageTitle, { color: theme.text }]}>Pending Review</Text>
          <View style={{ width: 48 }} />
        </View>
        <View style={styles.successContainer}>
          <Ionicons name="hourglass" size={80} color={theme.primary} />
          <Text style={[styles.successTitle, { color: theme.text }]}>Under Review</Text>
          <Text style={[styles.successText, { color: theme.textSecondary }]}>
            Your application is being reviewed.{'\n\n'}
            Expect feedback within 48-72 hours.
          </Text>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // Final fallback UI (should never hit, but visible if it does)
  return (
    <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
      <Ionicons name="alert-circle" size={80} color={theme.error} />
      <Text style={{ color: theme.text, fontSize: 20, fontWeight: "bold", marginTop: 24 }}>
        Unknown Application State
      </Text>
      <Text style={{ color: theme.textSecondary, textAlign: "center", marginTop: 12, paddingHorizontal: 40 }}>
        Something went wrong loading your status. Please try again or contact support.
      </Text>
      <TouchableOpacity
        onPress={() => setStatus("loading")}
        style={{ marginTop: 32, paddingVertical: 12, paddingHorizontal: 32, backgroundColor: theme.primary, borderRadius: 12 }}
      >
        <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>Retry</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={{ marginTop: 16 }}
      >
        <Text style={{ color: theme.primary, fontSize: 16 }}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
  },
  pageTitle: { fontSize: 24, fontWeight: "800" },
  roleToggle: {
    flexDirection: "row",
    backgroundColor: "#eee",
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  roleBtn: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 10 },
  roleActive: { backgroundColor: "#fff", elevation: 3 },
  roleText: { fontSize: 16, fontWeight: "600", color: "#666" },
  card: {
    padding: 20,
    borderRadius: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 16 },
  label: { fontSize: 15, fontWeight: "600", marginBottom: 8, marginTop: 12 },
  input: { marginBottom: 12 },
  uploadBtn: {
    borderWidth: 1.5,
    borderColor: "#aaa",
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 180,
  },
  uploadText: { fontSize: 15 },
  termsBox: {
    maxHeight: 220,
    borderWidth: 1,
    borderColor: "#444",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  termsText: { fontSize: 14, lineHeight: 22 },
  checkboxRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  checkboxLabel: { marginLeft: 12, fontSize: 14, flex: 1, lineHeight: 20 },
  submitBtn: { marginTop: 32, marginBottom: 40, borderRadius: 12 },
  successContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 },
  successTitle: { fontSize: 26, fontWeight: "bold", marginTop: 24, marginBottom: 12 },
  successText: { fontSize: 16, textAlign: "center", lineHeight: 24 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  modalContainer: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "85%", padding: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: "700" },
  searchInput: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12, fontSize: 16 },
  bankItem: { paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#444" },
  bankText: { fontSize: 16 },
});