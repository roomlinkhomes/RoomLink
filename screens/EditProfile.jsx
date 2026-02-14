// screens/EditProfile.jsx — FIXED: Avatar uploads to /profile_photos/{uid}/... to match your rules
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "../context/UserContext";
import { db } from "../firebaseConfig";
import { collection, query, where, getDocs, writeBatch } from "firebase/firestore";

// Firebase Storage imports
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function EditProfile({ navigation }) {
  const { user, updateUser } = useUser();
  const isDark = useColorScheme() === "dark";

  const [modalVisible, setModalVisible] = useState(false);
  const [currentField, setCurrentField] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Capture original names once when screen loads — baseline for "changed" check
  const [originalNames, setOriginalNames] = useState({
    firstName: "",
    lastName: "",
  });

  const [profile, setProfile] = useState({
    avatar: user?.avatar || null,
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    bio: user?.bio || "",
    location: user?.location || "",
    born: user?.born || "",
    hubby: user?.hubby || "",
    fantasy: user?.fantasy || "",
    pet: user?.pet || "",
    studiedAt: user?.studiedAt || "",
    education: user?.education || "",
    work: user?.work || "",
    deliveryMethod: user?.deliveryMethod || "",
    nameChangedAt: user?.nameChangedAt || null,
  });

  // Sync with latest user data + capture original names on first load
  useEffect(() => {
    if (user) {
      setProfile((prev) => ({
        ...prev,
        ...user,
        avatar: user.avatar || prev.avatar,
      }));

      if (originalNames.firstName === "" && originalNames.lastName === "") {
        setOriginalNames({
          firstName: user.firstName || "",
          lastName: user.lastName || "",
        });
      }
    }
  }, [user]);

  const pickAvatar = async () => {
    try {
      // Request permission (good practice)
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission denied", "We need access to your photos to upload an avatar.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.[0]?.uri) return;

      const localUri = result.assets[0].uri;

      // Optimistic UI: show local image immediately
      setProfile((prev) => ({ ...prev, avatar: localUri }));
      setUploadingAvatar(true);

      // Prepare file name (unique per user + timestamp)
      const timestamp = Date.now();
      const fileName = `avatar-${user?.uid || "anon"}-${timestamp}.jpg`;

      // Get Firebase Storage
      const storage = getStorage();
      // FIXED: Changed path to match your existing rules (/profile_photos/{userId}/...)
      const storageRef = ref(storage, `profile_photos/${user?.uid || "users"}/${fileName}`);

      // Fetch local file → convert to Blob (required for RN/Expo)
      const response = await fetch(localUri);
      const blob = await response.blob();

      // Upload to Storage
      await uploadBytes(storageRef, blob);

      // Get permanent public download URL
      const downloadURL = await getDownloadURL(storageRef);

      // Save URL to user profile & sync to listings
      await updateUser({ avatar: downloadURL });
      await syncListingsAvatar(downloadURL);

      // Final state update with permanent URL
      setProfile((prev) => ({ ...prev, avatar: downloadURL }));

      Alert.alert("Success", "Profile picture updated!");
    } catch (err) {
      console.error("Avatar upload error:", err);
      Alert.alert("Upload failed", "Could not upload profile picture. Please try again.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const openEditModal = (field, value) => {
    setCurrentField(field);
    setInputValue(value || "");
    setModalVisible(true);
  };

  const saveField = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed && currentField !== "bio") return;

    setSaving(true);

    const updates = { [currentField]: trimmed || "" };

    const isNameField = currentField === "firstName" || currentField === "lastName";

    const nameActuallyChanged =
      (currentField === "firstName" && trimmed !== originalNames.firstName) ||
      (currentField === "lastName" && trimmed !== originalNames.lastName);

    if (isNameField && nameActuallyChanged) {
      if (user?.nameChangedAt) {
        const lastChange = new Date(user.nameChangedAt);
        const sixMonthsLater = new Date(lastChange);
        sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

        if (new Date() < sixMonthsLater) {
          const monthsLeft = Math.ceil(
            (sixMonthsLater - new Date()) / (1000 * 60 * 60 * 24 * 30)
          );
          Alert.alert(
            "Name Change Locked",
            `You can only change your name once every 6 months.\nWait ${monthsLeft} more month(s).`
          );
          setSaving(false);
          setModalVisible(false);
          return;
        }
      }

      updates.nameChangedAt = new Date().toISOString();
    }

    try {
      setProfile((prev) => ({ ...prev, ...updates }));
      await updateUser(updates);

      if (nameActuallyChanged) {
        setOriginalNames({
          firstName: currentField === "firstName" ? trimmed : originalNames.firstName,
          lastName: currentField === "lastName" ? trimmed : originalNames.lastName,
        });
      }

      if (currentField === "firstName" || currentField === "lastName") {
        await syncListingsName();
      }
    } catch (err) {
      Alert.alert("Error", "Failed to save. Try again.");
    } finally {
      setSaving(false);
      setModalVisible(false);
      setInputValue("");
    }
  };

  const syncListingsName = async () => {
    if (!user?.uid) return;
    try {
      const q = query(collection(db, "listings"), where("uid", "==", user.uid));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return;

      const fullName = `${profile.firstName || user.firstName} ${profile.lastName || user.lastName}`.trim();
      const batch = writeBatch(db);
      snapshot.forEach((doc) => batch.update(doc.ref, { userName: fullName }));
      await batch.commit();
    } catch (e) {
      console.warn("syncListingsName error:", e);
    }
  };

  const syncListingsAvatar = async (url) => {
    if (!user?.uid) return;
    try {
      const q = query(collection(db, "listings"), where("uid", "==", user.uid));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return;

      const batch = writeBatch(db);
      snapshot.forEach((doc) => batch.update(doc.ref, { userAvatar: url }));
      await batch.commit();
    } catch (e) {
      console.warn("syncListingsAvatar error:", e);
    }
  };

  const fields = [
    { key: "firstName", label: "First Name", icon: "person-outline" },
    { key: "lastName", label: "Last Name", icon: "person-outline" },
    { key: "bio", label: "Bio", icon: "pencil-outline", placeholder: "Tell us about yourself" },
    { key: "location", label: "Location", icon: "location-outline", placeholder: "Where do you live?" },
    { key: "born", label: "Born", icon: "calendar-outline", placeholder: "Date of birth" },
    { key: "hubby", label: "Hubby", icon: "heart-outline", placeholder: "Relationship status" },
    { key: "fantasy", label: "Fantasy", icon: "sparkles-outline", placeholder: "Your dream?" },
    { key: "pet", label: "Pet", icon: "paw-outline", placeholder: "Do you have pets?" },
    { key: "studiedAt", label: "Studied at", icon: "school-outline", placeholder: "Your school/university" },
    { key: "education", label: "Education", icon: "book-outline", placeholder: "Degree or field" },
    { key: "work", label: "Work", icon: "briefcase-outline", placeholder: "What do you do?" },
    { key: "deliveryMethod", label: "Delivery Method", icon: "bicycle-outline", placeholder: "How do you deliver?" },
  ];

  const getDisplayText = (key) =>
    profile[key] || fields.find((f) => f.key === key)?.placeholder || "Tap to add";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#121212" : "#fafafa" }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          {/* HEADER */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "flex-start",
              paddingHorizontal: 20,
              paddingTop: 50,
              paddingBottom: 32,
            }}
          >
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 10 }} activeOpacity={0.6}>
              <Ionicons name="arrow-back" size={28} color="#000000" />
            </TouchableOpacity>

            <View style={{ flex: 1, alignItems: "center", marginRight: 48 }}>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "800",
                  color: isDark ? "#e0e0e0" : "#1a1a1a",
                }}
              >
                Edit Profile
              </Text>
              <Text style={{ fontSize: 14, color: isDark ? "#b0b0b0" : "#666", marginTop: 4 }}>
                @{user?.username || "user"}
              </Text>
            </View>
          </View>

          {/* AVATAR */}
          <View style={{ alignItems: "center", marginTop: 10 }}>
            <TouchableOpacity onPress={pickAvatar} disabled={uploadingAvatar}>
              {profile.avatar ? (
                <Image
                  source={{ uri: profile.avatar }}
                  style={{ width: 130, height: 130, borderRadius: 65, borderWidth: 5, borderColor: "#00ff9d" }}
                />
              ) : (
                <View
                  style={{
                    width: 130,
                    height: 130,
                    borderRadius: 65,
                    backgroundColor: "#017a6b",
                    justifyContent: "center",
                    alignItems: "center",
                    borderWidth: 5,
                    borderColor: "#00ff9d",
                  }}
                >
                  <Text style={{ fontSize: 56, fontWeight: "900", color: "#fff" }}>
                    {profile.firstName?.[0]?.toUpperCase() || "R"}
                  </Text>
                </View>
              )}

              {uploadingAvatar && (
                <ActivityIndicator
                  size="large"
                  color="#00ff9d"
                  style={{ position: "absolute", top: 40, left: 40 }}
                />
              )}

              <View
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  backgroundColor: "#00ff9d",
                  padding: 14,
                  borderRadius: 40,
                  borderWidth: 5,
                  borderColor: "#fff",
                }}
              >
                <Ionicons name="camera" size={26} color="#000" />
              </View>
            </TouchableOpacity>
          </View>

          {/* FIELDS */}
          <View style={{ paddingHorizontal: 20, marginTop: 40 }}>
            {fields.map((field) => (
              <TouchableOpacity
                key={field.key}
                onPress={() => openEditModal(field.key, profile[field.key])}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 18,
                  borderBottomWidth: 1,
                  borderBottomColor: isDark ? "#333" : "#eee",
                }}
              >
                <Ionicons name={field.icon} size={28} color="#000000" style={{ width: 50 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: isDark ? "#aaa" : "#666", fontSize: 15, fontWeight: "500" }}>
                    {field.label}
                  </Text>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "600",
                      color: profile[field.key]
                        ? isDark
                          ? "#fff"
                          : "#000"
                        : isDark
                        ? "#666"
                        : "#999",
                      marginTop: 4,
                    }}
                  >
                    {getDisplayText(field.key)}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={isDark ? "#666" : "#aaa"} />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* MODAL */}
        <Modal visible={modalVisible} transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.9)", justifyContent: "flex-end" }}>
            <View
              style={{
                backgroundColor: isDark ? "#111" : "#fff",
                padding: 24,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
              }}
            >
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "800",
                  color: isDark ? "#fff" : "#000",
                  marginBottom: 20,
                }}
              >
                Edit {fields.find((f) => f.key === currentField)?.label}
              </Text>

              <TextInput
                value={inputValue}
                onChangeText={setInputValue}
                placeholder="Enter text..."
                placeholderTextColor="#888"
                autoFocus
                style={{
                  backgroundColor: isDark ? "#222" : "#f5f5f5",
                  padding: 16,
                  borderRadius: 14,
                  fontSize: 18,
                  color: isDark ? "#fff" : "#000",
                }}
              />

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "flex-end",
                  marginTop: 24,
                  gap: 16,
                  alignItems: "center",
                }}
              >
                <TouchableOpacity onPress={() => setModalVisible(false)} disabled={saving}>
                  <Text style={{ fontSize: 18, color: "#888" }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={saveField} disabled={saving}>
                  {saving ? (
                    <ActivityIndicator size="small" color="#00ff9d" />
                  ) : (
                    <Text style={{ fontSize: 18, color: "#017a6b", fontWeight: "900" }}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}