// screens/BecomeVendorScreen.jsx — FIXED: Edit button now works (shows form on edit)
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
import * as ImagePicker from "expo-image-picker";

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
  };

  const [status, setStatus] = useState("loading");
  const [role, setRole] = useState("Host");
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [governmentIdUri, setGovernmentIdUri] = useState(null); // Local URI for preview
  const [governmentIdUrl, setGovernmentIdUrl] = useState(null); // Remote URL
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [bankModalVisible, setBankModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingId, setUploadingId] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // Track edit mode

  const storage = getStorage();

  // Request permissions
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "We need access to your photos for ID upload.");
      }
    })();
  }, []);

  // Real-time listener for application status
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        Alert.alert("Login Required", "Please sign in to continue.");
        navigation.goBack();
        return;
      }

      const appRef = doc(db, "vendorApplications", user.uid);
      const unsubscribeSnap = onSnapshot(appRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
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
          setGovernmentIdUri(data.governmentIdUrl || null); // preview with URL
          setAgreedToTerms(true); // assume agreed if data exists
        } else {
          setStatus("not_submitted");
          setEmail(user.email || "");
          setPhoneNumber("");
          setGovernmentIdUri(null);
          setGovernmentIdUrl(null);
          setAgreedToTerms(false);
        }
      }, (err) => {
        console.error("Snapshot error:", err);
        setStatus("not_submitted");
      });

      return () => unsubscribeSnap();
    });

    return () => unsubscribeAuth();
  }, [navigation]);

  const uploadGovernmentId = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        setGovernmentIdUri(uri);
        setUploadingId(true);

        const currentUser = auth.currentUser;
        if (!currentUser) {
          Alert.alert("Session Error", "Please login again.");
          setUploadingId(false);
          return;
        }

        try {
          const response = await fetch(uri);
          const blob = await response.blob();
          const fileRef = ref(storage, `vendorIds/${currentUser.uid}/id.jpeg`);
          const uploadTask = uploadBytesResumable(fileRef, blob);

          await new Promise((resolve, reject) => {
            uploadTask.on(
              "state_changed",
              null,
              reject,
              async () => {
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                setGovernmentIdUrl(url);
                resolve(url);
              }
            );
          });

          Alert.alert("Success", "Government ID uploaded successfully.");
        } catch (uploadErr) {
          console.error("Storage upload failed:", uploadErr);
          Alert.alert("Upload Failed", "Could not upload ID. Try again.");
          setGovernmentIdUri(null);
        } finally {
          setUploadingId(false);
        }
      }
    } catch (err) {
      console.error("Image picker error:", err);
      Alert.alert("Error", "Failed to open picker.");
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;

    // Validation
    if (!fullName.trim()) return Alert.alert("Required", "Full name is required");
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) return Alert.alert("Invalid", "Valid email required");
    if (!phoneNumber || phoneNumber.length < 10) return Alert.alert("Invalid", "Phone ≥ 10 digits");
    if (!bankName) return Alert.alert("Required", "Select a bank");
    if (accountNumber.length !== 10) return Alert.alert("Invalid", "Account number must be 10 digits");
    if (!accountHolderName.trim()) return Alert.alert("Required", "Account holder name required");
    if (!governmentIdUrl) return Alert.alert("Required", "Upload Government ID");
    if (!agreedToTerms) return Alert.alert("Required", "Agree to terms");

    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert("Session Error", "Please login again.");
      return;
    }

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

      Alert.alert(
        "Success!",
        "Application updated/submitted.\n\nIt is now pending review again."
      );
    } catch (err) {
      console.error("Submission error:", err);
      Alert.alert("Error", err.message || "Failed to submit. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const startEditing = () => {
    setIsEditing(true);
    setStatus("not_submitted"); // ← This is the key fix: force show the form
  };

  const filteredBanks = BANKS.filter((bank) =>
    bank.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (status === "loading") {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  // Show form when status is "not_submitted" OR when editing
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
            color={isApproved ? theme.primary : "red"}
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

  // Fallback (shouldn't reach here)
  return null;
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