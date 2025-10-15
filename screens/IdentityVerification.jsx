// IdentityVerification.jsx
import React, { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { UserContext } from "../context/UserContext";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const idTypes = [
  { label: "National ID (NIN)", value: "nin" },
  { label: "International Passport", value: "passport" },
  { label: "Driver's License", value: "drivers_license" },
  { label: "Voter's Card", value: "voter_card" },
];

export default function IdentityVerification() {
  const { user } = useContext(UserContext);
  const navigation = useNavigation();

  const [selectedIdType, setSelectedIdType] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const pickDocument = async () => {
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

  const handleSubmit = () => {
    if (!selectedIdType) {
      Alert.alert("Select ID", "Please select an ID type for verification.");
      return;
    }

    if (!file) {
      Alert.alert("Upload ID", "Please upload a document.");
      return;
    }

    // Frontend-only success message
    Alert.alert(
      "Success",
      `You selected ${file.name} as your ${selectedIdType} ID.`
    );
  };

  const isImage = file?.mimeType?.startsWith("image/");

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.subText}>
        Select your ID type and upload a clear image or PDF.
      </Text>

      {idTypes.map((id) => (
        <TouchableOpacity
          key={id.value}
          style={[
            styles.idOption,
            selectedIdType === id.value && styles.idOptionSelected,
          ]}
          onPress={() => setSelectedIdType(id.value)}
        >
          <Text
            style={[
              styles.idText,
              selectedIdType === id.value && { fontWeight: "700", color: "#1A237E" },
            ]}
          >
            {id.label}
          </Text>
          {selectedIdType === id.value && (
            <Ionicons
              name="checkmark-circle"
              size={20}
              color="#1A237E"
              style={{ marginLeft: 10 }}
            />
          )}
        </TouchableOpacity>
      ))}

      {/* Upload Button with visual feedback */}
      <TouchableOpacity
        style={[
          styles.uploadButton,
          file && { backgroundColor: "#4CAF50", borderColor: "#388E3C" },
        ]}
        onPress={pickDocument}
      >
        <Ionicons
          name={file ? "checkmark-circle" : "cloud-upload-outline"}
          size={24}
          color={file ? "white" : "#1A237E"}
          style={{ marginRight: 10 }}
        />
        <Text
          style={[
            styles.uploadButtonText,
            file && { color: "white", fontWeight: "700" },
          ]}
        >
          {file ? `Uploaded: ${file.name}` : "Upload ID Document"}
        </Text>
      </TouchableOpacity>

      {/* Show preview if image or PDF */}
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
              <Ionicons name="document-text" size={28} color="#1A237E" />
              <Text style={{ marginLeft: 8, color: "#1A237E" }}>
                {file.name}
              </Text>
            </View>
          )}
        </View>
      )}

      <TouchableOpacity
        style={[styles.submitButton, uploading && { opacity: 0.6 }]}
        onPress={handleSubmit}
        disabled={uploading}
      >
        <Text style={styles.submitButtonText}>
          {uploading ? "Submitting..." : "Submit for Verification"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: "#fff",
    flexGrow: 1,
  },
  subText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 20,
    textAlign: "center",
  },
  idOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    marginBottom: 12,
  },
  idOptionSelected: {
    borderColor: "#1A237E",
    backgroundColor: "#e3e9ff",
  },
  idText: { fontSize: 16, flexShrink: 1 },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f0f0",
    padding: 15,
    borderRadius: 10,
    marginVertical: 15,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  uploadButtonText: { fontSize: 16, color: "#333" },
  previewBox: {
    marginTop: 10,
    alignItems: "center",
  },
  previewImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  pdfPreview: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#1A237E",
    borderRadius: 8,
    backgroundColor: "#f3f5ff",
  },
  submitButton: {
    backgroundColor: "#1A237E",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  submitButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
