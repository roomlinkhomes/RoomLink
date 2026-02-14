// screens/IdentityVerification.jsx — LIGHTER & CLEANER DESIGN
import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { Ionicons } from "@expo/vector-icons";
import { UserContext } from "../context/UserContext";
import { useNavigation } from "@react-navigation/native";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";

const idTypes = [
  { label: "National ID (NIN)", value: "nin" },
  { label: "International Passport", value: "passport" },
  { label: "Driver's License", value: "drivers_license" },
  { label: "Voter's Card", value: "voter_card" },
];

const validateIdNumber = (type, value) => {
  switch (type) {
    case "nin": return /^\d{11}$/.test(value);
    case "passport": return /^[A-Z0-9]{9}$/.test(value.toUpperCase());
    case "drivers_license": return /^[A-Z0-9]{8,12}$/.test(value.toUpperCase());
    case "voter_card": return /^\d{10,12}$/.test(value);
    default: return false;
  }
};

export default function IdentityVerification() {
  const { user } = useContext(UserContext);
  const navigation = useNavigation();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  // Lighter theme
  const theme = {
    background: isDark ? "#0f0f0f" : "#f9f9f9",
    card: isDark ? "#1a1a1a" : "#ffffff",
    text: isDark ? "#f0f0f0" : "#1a1a1a",
    textSecondary: isDark ? "#a0a0a0" : "#666666",
    primary: "#017a6b",
    border: isDark ? "#333333" : "#e0e0e0",
    shadow: "#000000",
  };

  const [selectedIdType, setSelectedIdType] = useState(null);
  const [file, setFile] = useState(null);
  const [idNumber, setIdNumber] = useState("");
  const [uploading, setUploading] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [verified, setVerified] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.isVerified) {
          setVerificationStatus("verified");
          setVerified(true);
          setFile(null);
        } else if (data.verificationRequest?.status === "pending") {
          setVerificationStatus("pending");
        } else {
          setVerificationStatus(null);
        }
      }
    });
    return () => unsub();
  }, [user?.uid]);

  const pickDocument = async () => {
    if (verificationStatus === "verified") return;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets?.length > 0) {
        setFile(result.assets[0]);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to pick document");
    }
  };

  const startCountdown = (seconds) => {
    setCountdown(seconds);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSubmit = async () => {
    if (verificationStatus) return;

    if (!selectedIdType) return Alert.alert("Select ID", "Please choose an ID type");
    if (!file) return Alert.alert("Upload required", "Please upload your ID document");
    if (!idNumber.trim() || !validateIdNumber(selectedIdType, idNumber.trim())) {
      return Alert.alert("Invalid ID", "Please enter a valid ID number");
    }

    try {
      setUploading(true);

      await updateDoc(doc(db, "users", user.uid), {
        verificationRequest: {
          submittedAt: new Date().toISOString(),
          status: "pending",
          idType: selectedIdType,
          idNumber: idNumber.toUpperCase(),
          fileName: file.name,
        },
      });

      Alert.alert("Submitted", "Verification request sent. Processing...");

      const delay = 60 + Math.floor(Math.random() * 61);
      startCountdown(delay);

      setTimeout(async () => {
        await updateDoc(doc(db, "users", user.uid), {
          isVerified: true,
          verifiedDate: new Date().toISOString(),
          "verificationRequest.status": "approved",
        });
        setVerified(true);
        setUploading(false);
        setCountdown(null);
      }, delay * 1000);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Submission failed. Try again.");
      setUploading(false);
    }
  };

  const isImage = file?.mimeType?.startsWith("image/");
  const isDisabled = verificationStatus === "verified" || verificationStatus === "pending";

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Slim header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Verify Identity</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Unlock full access in a few steps
          </Text>
        </View>

        {/* Main card – lighter, smaller */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardText, { color: theme.textSecondary }]}>
            Choose ID type, enter number, and upload document
          </Text>

          {/* ID Type selector – compact */}
          <View style={styles.idOptions}>
            {idTypes.map((id) => (
              <TouchableOpacity
                key={id.value}
                style={[
                  styles.idOption,
                  selectedIdType === id.value && styles.idOptionSelected,
                  isDisabled && styles.disabledOption,
                ]}
                onPress={() => setSelectedIdType(id.value)}
                disabled={isDisabled}
              >
                <Text
                  style={[
                    styles.idText,
                    selectedIdType === id.value && { color: theme.primary },
                    isDisabled && { color: theme.textSecondary },
                  ]}
                >
                  {id.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ID Number – slimmer */}
          {selectedIdType && (
            <View style={styles.inputWrapper}>
              <Text style={[styles.label, { color: theme.text }]}>
                {idTypes.find(i => i.value === selectedIdType)?.label} Number
              </Text>
              <TextInput
                style={[styles.input, { borderColor: theme.border, color: theme.text }]}
                placeholder="Enter number"
                placeholderTextColor={theme.textSecondary}
                value={idNumber}
                onChangeText={(text) => setIdNumber(
                  ["passport", "drivers_license"].includes(selectedIdType)
                    ? text.toUpperCase()
                    : text
                )}
                keyboardType={["nin", "voter_card"].includes(selectedIdType) ? "number-pad" : "default"}
                editable={!isDisabled}
              />
            </View>
          )}

          {/* Upload area – cleaner */}
          <TouchableOpacity
            style={[
              styles.uploadArea,
              file && styles.uploadSuccess,
              isDisabled && styles.disabled,
            ]}
            onPress={pickDocument}
            disabled={isDisabled}
          >
            {file ? (
              <>
                <Ionicons name="document-attach" size={28} color="#fff" />
                <Text style={styles.uploadTextSuccess}>{file.name}</Text>
              </>
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={28} color={theme.primary} />
                <Text style={[styles.uploadText, { color: theme.primary }]}>Upload ID (image/PDF)</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Preview (smaller) */}
          {file && (
            <View style={styles.preview}>
              {isImage ? (
                <Image source={{ uri: file.uri }} style={styles.previewImage} />
              ) : (
                <Text style={styles.previewText}>{file.name}</Text>
              )}
            </View>
          )}

          {/* Status */}
          {verificationStatus === "pending" && (
            <View style={styles.statusPending}>
              <ActivityIndicator size="small" color={theme.primary} />
              <Text style={styles.statusText}>Verification Pending</Text>
            </View>
          )}

          {verified && (
            <View style={styles.statusSuccess}>
              <Ionicons name="checkmark-circle" size={28} color={theme.primary} />
              <Text style={[styles.statusText, { color: theme.primary }]}>Verified</Text>
            </View>
          )}

          {/* Submit – slimmer */}
          <TouchableOpacity
            style={[
              styles.submit,
              { backgroundColor: theme.primary },
              (uploading || isDisabled) && { opacity: 0.6 },
            ]}
            onPress={handleSubmit}
            disabled={uploading || isDisabled}
          >
            {uploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>
                {isDisabled ? "Already Submitted" : "Submit Verification"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  idOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  idOption: {
    flex: 1,
    minWidth: "45%",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  idOptionSelected: {
    borderColor: "#017a6b",
    backgroundColor: "rgba(1,122,107,0.08)",
  },
  disabledOption: {
    opacity: 0.5,
  },
  idText: {
    fontSize: 14,
    fontWeight: "600",
  },
  inputWrapper: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  uploadArea: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 16,
    gap: 10,
  },
  uploadSuccess: {
    backgroundColor: "#017a6b",
    borderColor: "#017a6b",
  },
  uploadText: {
    fontSize: 15,
    fontWeight: "600",
  },
  uploadTextSuccess: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.5,
  },
  preview: {
    alignItems: "center",
    marginBottom: 20,
  },
  previewImage: {
    width: "100%",
    height: 140,
    borderRadius: 12,
  },
  previewText: {
    fontSize: 14,
    color: "#666",
  },
  statusPending: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 16,
    gap: 8,
  },
  statusSuccess: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 16,
    gap: 8,
  },
  statusText: {
    fontSize: 15,
    fontWeight: "600",
  },
  submit: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});