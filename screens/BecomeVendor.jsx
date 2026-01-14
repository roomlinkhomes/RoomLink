// screens/BecomeVendorScreen.jsx — FIXED: Government ID Upload + Real-time UI Updates
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useColorScheme } from "react-native";
import { TextInput, Button, Checkbox } from "react-native-paper";
import * as ImagePicker from "expo-image-picker"; // ← Added import

// Firebase imports
import { auth, db } from "../firebaseConfig";
import { doc, setDoc, onSnapshot } from "firebase/firestore";

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
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [governmentIdUri, setGovernmentIdUri] = useState(null); // ← New state for ID image
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [bankModalVisible, setBankModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Request permissions once
  useEffect(() => {
    (async () => {
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    })();
  }, []);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        Alert.alert("Authentication Required", "Please log in to continue.");
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
          setBankName(data.bankName || "");
          setAccountNumber(data.accountNumber || "");
          setAccountHolderName(data.accountHolderName || "");
          setGovernmentIdUri(data.governmentIdUrl || null); // ← Load saved ID if any

          // Show alert ONLY when status changes to approved/rejected
          // (we use previous status to detect change)
        } else {
          setStatus("not_submitted");
          setGovernmentIdUri(null);
        }
      }, (err) => {
        console.error("Snapshot error:", err);
        setStatus("not_submitted");
      });

      return () => unsubscribeSnap();
    });

    return () => unsubscribeAuth();
  }, [navigation]);

  // Government ID Upload Function
  const uploadGovernmentId = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setGovernmentIdUri(result.assets[0].uri);
        Alert.alert("ID Uploaded", "Government ID selected successfully.");
      }
    } catch (err) {
      Alert.alert("Upload Failed", "Could not select ID image.");
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    if (!fullName.trim()) return Alert.alert("Required", "Full name is required");
    if (!bankName) return Alert.alert("Required", "Please select a bank");
    if (accountNumber.length !== 10) return Alert.alert("Invalid", "Account number must be 10 digits");
    if (!accountHolderName.trim()) return Alert.alert("Required", "Account holder name is required");
    if (!governmentIdUri) return Alert.alert("Required", "Please upload your Government ID");
    if (!agreedToTerms) return Alert.alert("Required", "You must agree to the terms");

    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert("Session Error", "Please login again.");
      return;
    }

    const applicationData = {
      uid: currentUser.uid,
      email: currentUser.email || "",
      role,
      fullName: fullName.trim(),
      businessName: businessName.trim() || null,
      bankName,
      accountNumber,
      accountHolderName: accountHolderName.trim(),
      governmentIdUrl: governmentIdUri, // ← Save local URI (for now)
      submittedAt: new Date().toISOString(),
      status: "pending",
      reviewedAt: null,
      reviewedBy: null,
    };

    try {
      setSubmitting(true);
      const appRef = doc(db, "vendorApplications", currentUser.uid);
      await setDoc(appRef, applicationData, { merge: true });
      setStatus("pending");
      Alert.alert("Success!", "Application submitted. Review in 48 hours.");
    } catch (err) {
      console.error("Submission error:", err);
      Alert.alert("Error", err.message || "Failed to submit. Try again.");
    } finally {
      setSubmitting(false);
    }
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

  if (status === "approved") {
    return (
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.background }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={28} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.pageTitle, { color: theme.text }]}>You're Approved!</Text>
          <View style={{ width: 48 }} />
        </View>
        <View style={styles.successContainer}>
          <Ionicons name="checkmark-circle" size={90} color={theme.primary} />
          <Text style={[styles.successTitle, { color: theme.text }]}>Congratulations!</Text>
          <Text style={[styles.successText, { color: theme.textSecondary }]}>
            Your application to become a {role.toLowerCase()} has been approved!{"\n\n"}
            You can now create listings and start earning.
          </Text>
          <Button
            mode="contained"
            onPress={() => navigation.navigate("CreateListing")}
            style={styles.submitBtn}
            theme={{ colors: { primary: theme.primary } }}
          >
            Create Your First Listing
          </Button>
        </View>
      </KeyboardAvoidingView>
    );
  }

  if (status === "rejected") {
    return (
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.background }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={28} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.pageTitle, { color: theme.text }]}>Application Rejected</Text>
          <View style={{ width: 48 }} />
        </View>
        <View style={styles.successContainer}>
          <Ionicons name="close-circle" size={90} color="red" />
          <Text style={[styles.successTitle, { color: theme.text }]}>Not Approved</Text>
          <Text style={[styles.successText, { color: theme.textSecondary }]}>
            Your application to become a {role.toLowerCase()} was not approved.{'\n\n'}
            Please review the requirements and try again.
          </Text>
          <Button
            mode="contained"
            onPress={() => setStatus("not_submitted")}
            style={styles.submitBtn}
            theme={{ colors: { primary: theme.primary } }}
          >
            Apply Again
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
            Your application to become a {role.toLowerCase()} is being reviewed.{'\n\n'}
            Expect feedback within 48-72 hours.
          </Text>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // Form View
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: theme.background }}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.pageTitle, { color: theme.text }]}>Become a Host / Vendor</Text>
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
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Personal & Bank Details</Text>

          <TextInput
            label="Full Name *"
            value={fullName}
            onChangeText={setFullName}
            mode="outlined"
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
          <TouchableOpacity style={styles.uploadBtn} onPress={uploadGovernmentId}>
            {governmentIdUri ? (
              <Image source={{ uri: governmentIdUri }} style={{ width: "100%", height: 180, borderRadius: 12 }} />
            ) : (
              <View style={{ alignItems: "center" }}>
                <Ionicons name="cloud-upload-outline" size={32} color={theme.primary} />
                <Text style={[styles.uploadText, { color: theme.textSecondary, marginTop: 8 }]}>
                  Tap to upload Government ID
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
          disabled={submitting || !agreedToTerms || !fullName.trim() || !bankName || accountNumber.length !== 10 || !accountHolderName.trim() || !governmentIdUri}
          style={styles.submitBtn}
          theme={{ colors: { primary: theme.primary } }}
        >
          {submitting ? <ActivityIndicator color="#fff" /> : "Submit Application"}
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

const styles = StyleSheet.create({
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16 },
  pageTitle: { fontSize: 24, fontWeight: "800" },
  roleToggle: { flexDirection: "row", backgroundColor: "#eee", borderRadius: 12, padding: 4, marginBottom: 24 },
  roleBtn: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 10 },
  roleActive: { backgroundColor: "#fff", elevation: 3 },
  roleText: { fontSize: 16, fontWeight: "600", color: "#666" },
  card: { padding: 20, borderRadius: 16, elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 16 },
  label: { fontSize: 15, fontWeight: "600", marginBottom: 8, marginTop: 12 },
  input: { marginBottom: 12 },
  uploadBtn: { borderWidth: 1.5, borderColor: "#aaa", borderStyle: "dashed", borderRadius: 12, padding: 12, marginVertical: 8, alignItems: "center", justifyContent: "center", minHeight: 180 },
  uploadText: { fontSize: 15 },
  termsBox: { maxHeight: 220, borderWidth: 1, borderColor: "#444", borderRadius: 12, padding: 12, marginBottom: 16 },
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