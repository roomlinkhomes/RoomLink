// screens/IdentityVerification.jsx — RLMARKET REBRANDED
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
    case "nin":
      return /^\d{11}$/.test(value);
    case "passport":
      return /^[A-Z0-9]{9}$/.test(value.toUpperCase());
    case "drivers_license":
      return /^[A-Z0-9]{8,12}$/.test(value.toUpperCase());
    case "voter_card":
      return /^\d{10,12}$/.test(value);
    default:
      return false;
  }
};

export default function IdentityVerification() {
  const { user } = useContext(UserContext);
  const navigation = useNavigation();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  // RLMARKET Theme (exact same as Login/Signup/Listing)
  const theme = {
    background: isDark ? "#121212" : "#fafafa",
    card: isDark ? "#1e1e1e" : "#ffffff",
    text: isDark ? "#e0e0e0" : "#212529",
    textSecondary: isDark ? "#b0b0b0" : "#666",
    primary: isDark ? "#00ff7f" : "#017a6b",
    border: isDark ? "#333" : "#e0e6ed",
    shadow: "#000",
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

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const picked = result.assets[0];
        setFile(picked);
        Alert.alert("File Selected", `${picked.name} is ready to upload`);
      }
    } catch (err) {
      console.log("DocumentPicker Error: ", err);
      Alert.alert("Error", "Failed to pick the document.");
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

    if (!selectedIdType) {
      Alert.alert("Select ID", "Please select an ID type for verification.");
      return;
    }
    if (!file) {
      Alert.alert("Upload ID", "Please upload a document.");
      return;
    }
    if (!idNumber.trim() || !validateIdNumber(selectedIdType, idNumber.trim())) {
      Alert.alert(
        "Invalid ID Number",
        `Please enter a valid ${
          idTypes.find((id) => id.value === selectedIdType).label
        } number in the correct format.`
      );
      return;
    }

    try {
      setUploading(true);
      setVerified(false);

      await updateDoc(doc(db, "users", user.uid), {
        verificationRequest: {
          submittedAt: new Date().toISOString(),
          status: "pending",
          idType: selectedIdType,
          idNumber: idNumber.toUpperCase(),
          fileName: file.name,
        },
      });

      Alert.alert(
        "Verification Submitted",
        "Your verification request has been submitted. Please wait..."
      );

      const delaySeconds = 60 + Math.floor(Math.random() * 61);
      startCountdown(delaySeconds);

      setTimeout(async () => {
        await updateDoc(doc(db, "users", user.uid), {
          isVerified: true,
          verifiedDate: new Date().toISOString(),
          "verificationRequest.status": "approved",
        });
        setVerified(true);
        setUploading(false);
        setCountdown(null);
      }, delaySeconds * 1000);
    } catch (err) {
      console.error("Verification Error:", err);
      Alert.alert("Error", "Failed to submit verification. Try again.");
      setUploading(false);
      setCountdown(null);
    }
  };

  const isImage = file?.mimeType?.startsWith("image/");
  const isDisabled = verificationStatus === "verified" || verificationStatus === "pending";

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : null}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
        {/* RLMARKET Header */}
        <View style={styles.header}>
          <View style={[
            styles.rlBadge,
            { 
              backgroundColor: isDark ? 'rgba(0, 255, 127, 0.1)' : 'rgba(1, 122, 107, 0.08)',
              borderColor: theme.primary
            }
          ]}>
            <Text style={[styles.rlText, { color: theme.primary }]}>RL</Text>
          </View>
          <View style={styles.headerContent}>
            <Text style={[styles.title, { color: theme.text }]}>
              Identity Verification
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Verify your identity to unlock full features
            </Text>
          </View>
        </View>

        {/* RLMARKET Card */}
        <View style={[
          styles.card,
          { 
            backgroundColor: theme.card,
            borderColor: theme.border,
            shadowColor: theme.shadow
          }
        ]}>
          <Text style={[styles.subText, { color: theme.textSecondary }]}>
            Select your ID type, enter your ID number, and upload a clear image or PDF.
          </Text>

          {/* ID Type Options */}
          {idTypes.map((id) => (
            <TouchableOpacity
              key={id.value}
              style={[
                styles.idOption,
                selectedIdType === id.value && styles.idOptionSelected,
                isDisabled && styles.disabledOption
              ]}
              onPress={() => setSelectedIdType(id.value)}
              disabled={isDisabled}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.idText,
                  selectedIdType === id.value && styles.idTextSelected,
                  isDisabled && { color: theme.textSecondary }
                ]}
              >
                {id.label}
              </Text>
              {selectedIdType === id.value && (
                <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
              )}
            </TouchableOpacity>
          ))}

          {/* ID Number Input */}
          {selectedIdType && (
            <View style={styles.inputContainer}>
              <View style={styles.inputHeader}>
                <Ionicons name="card-outline" size={20} color={theme.primary} />
                <Text style={[styles.inputLabel, { color: theme.text }]}>
                  {idTypes.find(i => i.value === selectedIdType).label} Number
                </Text>
              </View>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                    color: theme.text 
                  }
                ]}
                placeholder="Enter your ID number"
                placeholderTextColor={theme.textSecondary}
                value={idNumber}
                onChangeText={(text) =>
                  setIdNumber(
                    selectedIdType === "passport" || selectedIdType === "drivers_license"
                      ? text.toUpperCase()
                      : text
                  )
                }
                keyboardType={
                  selectedIdType === "nin" || selectedIdType === "voter_card"
                    ? "number-pad"
                    : "default"
                }
                editable={!isDisabled}
              />
            </View>
          )}

          {/* Upload Button */}
          <TouchableOpacity
            style={[
              styles.uploadButton,
              file && styles.uploadButtonSuccess,
              isDisabled && styles.disabledButton
            ]}
            onPress={pickDocument}
            disabled={isDisabled}
            activeOpacity={0.9}
          >
            <Ionicons
              name={file ? "checkmark-circle" : "cloud-upload-outline"}
              size={28}
              color={file ? "#fff" : theme.primary}
            />
            <Text style={[
              styles.uploadButtonText,
              file && { color: "#fff" }
            ]}>
              {file ? `Uploaded: ${file.name}` : "Upload ID Document"}
            </Text>
          </TouchableOpacity>

          {/* File Preview */}
          {file && (
            <View style={styles.previewBox}>
              {isImage ? (
                <Image
                  source={{ uri: file.uri }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.pdfPreview}>
                  <Ionicons name="document-text" size={32} color={theme.primary} />
                  <Text style={[styles.pdfText, { color: theme.text }]}>
                    {file.name}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Status Messages */}
          {verificationStatus === "pending" && (
            <View style={styles.pendingBox}>
              <ActivityIndicator size="small" color={theme.primary} />
              <Text style={[styles.pendingText, { color: theme.text }]}>
                Verification Pending ⏳
              </Text>
            </View>
          )}

          {verified && (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={36} color={theme.primary} />
              <Text style={[styles.successText, { color: theme.primary }]}>
                Verification Successful!
              </Text>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              { 
                backgroundColor: theme.primary,
                opacity: uploading || isDisabled ? 0.7 : 1
              }
            ]}
            onPress={handleSubmit}
            disabled={uploading || isDisabled}
            activeOpacity={0.9}
          >
            {uploading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.submitButtonText}>Submitting...</Text>
              </View>
            ) : (
              <Text style={styles.submitButtonText}>
                {verificationStatus === "verified"
                  ? "Already Verified"
                  : verificationStatus === "pending"
                  ? "Verification Pending"
                  : "Submit for Verification"}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Security Badge */}
        <View style={[
          styles.securityBadge,
          { 
            backgroundColor: 'rgba(1, 122, 107, 0.05)',
            borderColor: 'rgba(1, 122, 107, 0.1)'
          }
        ]}>
          <Ionicons name="shield-checkmark-outline" size={20} color={theme.primary} />
          <Text style={[styles.securityText, { color: theme.textSecondary }]}>
            Your data is secured with encryption
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 40,
  },

  // RLMARKET Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  rlBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    marginRight: 16,
  },
  rlText: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -1.5,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.5,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 6,
    lineHeight: 22,
  },

  // RLMARKET Card
  card: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
  },
  subText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 24,
  },

  // ID Options
  idOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 16,
    backgroundColor: "transparent",
  },
  idOptionSelected: {
    backgroundColor: "rgba(1,122,107,0.1)",
    borderColor: "#017a6b",
  },
  disabledOption: {
    opacity: 0.6,
  },
  idText: {
    fontSize: 16,
    fontWeight: "600",
  },
  idTextSelected: {
    fontWeight: "800",
    color: "#017a6b",
  },

  // Input Container
  inputContainer: {
    marginBottom: 20,
  },
  inputHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 10,
    letterSpacing: 0.3,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  // Upload Button
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    marginVertical: 20,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
  },
  uploadButtonSuccess: {
    backgroundColor: "#017a6b",
  },
  disabledButton: {
    opacity: 0.6,
  },
  uploadButtonText: {
    fontSize: 17,
    fontWeight: "700",
    marginLeft: 12,
  },

  // Preview
  previewBox: {
    marginTop: 16,
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    backgroundColor: "rgba(1,122,107,0.05)",
    borderWidth: 1,
    borderColor: "rgba(1,122,107,0.2)",
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
  pdfPreview: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  pdfText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: "600",
  },

  // Status Messages
  pendingBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    marginVertical: 20,
  },
  pendingText: {
    marginLeft: 12,
    fontSize: 17,
    fontWeight: "700",
  },
  successBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    marginVertical: 20,
  },
  successText: {
    marginLeft: 12,
    fontSize: 17,
    fontWeight: "800",
  },

  // Submit Button
  submitButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 24,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  // Security Badge
  securityBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  securityText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 12,
    lineHeight: 18,
  },
});