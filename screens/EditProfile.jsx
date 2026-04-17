// screens/EditProfile.jsx — FIXED: Sharp Bottom Modal + Real Full-Screen Photo Viewer
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
  Pressable,
  Dimensions,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "../context/UserContext";
import { db } from "../firebaseConfig";
import { collection, query, where, getDocs, writeBatch } from "firebase/firestore";

// Firebase Storage & Auth
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth } from "firebase/auth";

const { width, height } = Dimensions.get("window");

export default function EditProfile({ navigation }) {
  const { user, updateUser } = useUser();
  const isDark = useColorScheme() === "dark";
  const auth = getAuth();

  const [modalVisible, setModalVisible] = useState(false);           // Edit field modal
  const [avatarModalVisible, setAvatarModalVisible] = useState(false); // Avatar options modal
  const [viewPhotoVisible, setViewPhotoVisible] = useState(false);    // Full screen viewer

  const [currentField, setCurrentField] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

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

  // Pre-request permissions
  useEffect(() => {
    (async () => {
      await ImagePicker.requestMediaLibraryPermissionsAsync();
      await ImagePicker.requestCameraPermissionsAsync();
    })();
  }, []);

  useEffect(() => {
    if (user) {
      setProfile({ ...user });
    }
  }, [user]);

  // ==================== AVATAR ACTIONS ====================
  const openAvatarModal = () => setAvatarModalVisible(true);

  const launchCamera = async () => {
    setAvatarModalVisible(false);
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    await uploadImage(result.assets[0].uri);
  };

  const launchGallery = async () => {
    setAvatarModalVisible(false);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    await uploadImage(result.assets[0].uri);
  };

  const viewPhoto = () => {
    setAvatarModalVisible(false);
    if (profile.avatar) setViewPhotoVisible(true);
  };

  const uploadImage = async (localUri) => {
    setUploadingAvatar(true);
    const currentUser = auth.currentUser;
    if (!currentUser?.uid) return;

    try {
      const timestamp = Date.now();
      const fileName = `avatar-${currentUser.uid}-${timestamp}.jpg`;

      const storage = getStorage();
      const storageRef = ref(storage, `profile_photos/users/${currentUser.uid}/${fileName}`);

      const response = await fetch(localUri);
      const blob = await response.blob();

      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      await updateUser({ avatar: downloadURL });
      await syncListingsAvatar(downloadURL);

      setProfile((prev) => ({ ...prev, avatar: downloadURL }));
      Alert.alert("✅ Success", "Profile picture updated!");
    } catch (err) {
      console.error(err);
      Alert.alert("Upload Failed", "Please try again.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  // ==================== Name Lock & Field Editing ====================
  const canChangeName = () => {
    if (!profile.nameChangedAt) return true;
    const lastChange = new Date(profile.nameChangedAt);
    const sixMonthsLater = new Date(lastChange);
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
    return new Date() >= sixMonthsLater;
  };

  const getMonthsRemaining = () => {
    if (!profile.nameChangedAt) return 0;
    const lastChange = new Date(profile.nameChangedAt);
    const sixMonthsLater = new Date(lastChange);
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
    const diffTime = sixMonthsLater - new Date();
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
    return Math.max(0, diffMonths);
  };

  const openEditModal = (field, value) => {
    setCurrentField(field);
    setInputValue(value || "");
    setModalVisible(true);
  };

  const saveField = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed && currentField !== "bio") return;

    const isNameField = currentField === "firstName" || currentField === "lastName";

    if (isNameField && !canChangeName()) {
      const monthsLeft = getMonthsRemaining();
      Alert.alert(
        "Name Change Locked",
        `You can only change your name once every 6 months.\nPlease wait ${monthsLeft} more month(s).`
      );
      setModalVisible(false);
      return;
    }

    setSaving(true);
    const updates = { [currentField]: trimmed || "" };
    if (isNameField) updates.nameChangedAt = new Date().toISOString();

    try {
      setProfile((prev) => ({ ...prev, ...updates }));
      await updateUser(updates);
      if (isNameField) await syncListingsName();

      Alert.alert("Success", `${currentField} updated successfully!`);
    } catch (err) {
      Alert.alert("Error", "Failed to save changes.");
    } finally {
      setSaving(false);
      setModalVisible(false);
      setInputValue("");
    }
  };

  const syncListingsName = async () => { /* your existing function */ };
  const syncListingsAvatar = async (url) => { /* your existing function */ };

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
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingTop: 50,
            paddingBottom: 32,
          }}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 10 }}>
              <Ionicons name="arrow-back" size={28} color={isDark ? "#e0e0e0" : "#000"} />
            </TouchableOpacity>

            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ fontSize: 24, fontWeight: "800", color: isDark ? "#e0e0e0" : "#1a1a1a" }}>
                Edit Profile
              </Text>
              <Text style={{ fontSize: 14, color: isDark ? "#b0b0b0" : "#666", marginTop: 4 }}>
                @{user?.username || "user"}
              </Text>
            </View>
            <View style={{ width: 48 }} />
          </View>

          {/* AVATAR */}
          <View style={{ alignItems: "center", marginTop: 10 }}>
            <TouchableOpacity onPress={openAvatarModal} disabled={uploadingAvatar}>
              {profile.avatar ? (
                <Image
                  source={{ uri: profile.avatar }}
                  style={{ width: 130, height: 130, borderRadius: 65, borderWidth: 5, borderColor: "#00ff9d" }}
                />
              ) : (
                <View style={{
                  width: 130, height: 130, borderRadius: 65,
                  backgroundColor: "#017a6b",
                  justifyContent: "center",
                  alignItems: "center",
                  borderWidth: 5,
                  borderColor: "#00ff9d",
                }}>
                  <Text style={{ fontSize: 56, fontWeight: "900", color: "#fff" }}>
                    {profile.firstName?.[0]?.toUpperCase() || "R"}
                  </Text>
                </View>
              )}

              {uploadingAvatar && (
                <ActivityIndicator size="large" color="#00ff9d" style={{ position: "absolute", top: 40, left: 40 }} />
              )}

              <View style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                backgroundColor: "#00ff9d",
                padding: 14,
                borderRadius: 40,
                borderWidth: 5,
                borderColor: "#fff",
              }}>
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
                <Ionicons name={field.icon} size={28} color={isDark ? "#e0e0e0" : "#000"} style={{ width: 50 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: isDark ? "#aaa" : "#666", fontSize: 15, fontWeight: "500" }}>
                    {field.label}
                  </Text>
                  <Text style={{
                    fontSize: 18,
                    fontWeight: "600",
                    color: profile[field.key] ? (isDark ? "#fff" : "#000") : (isDark ? "#666" : "#999"),
                    marginTop: 4,
                  }}>
                    {getDisplayText(field.key)}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={isDark ? "#666" : "#aaa"} />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* AVATAR OPTIONS MODAL */}
        <Modal visible={avatarModalVisible} transparent animationType="slide">
          <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end" }} onPress={() => setAvatarModalVisible(false)}>
            <View style={{
              backgroundColor: isDark ? "#1c1c1e" : "#ffffff",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
              paddingBottom: 40,
            }}>
              <Text style={{ fontSize: 22, fontWeight: "700", textAlign: "center", marginBottom: 25, color: isDark ? "#fff" : "#000" }}>
                Profile Photo
              </Text>

              {profile.avatar && (
                <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", paddingVertical: 16 }} onPress={viewPhoto}>
                  <Ionicons name="eye-outline" size={26} color="#00ff9d" />
                  <Text style={{ marginLeft: 16, fontSize: 18, fontWeight: "600", color: isDark ? "#fff" : "#000" }}>View Photo</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", paddingVertical: 16 }} onPress={launchCamera}>
                <Ionicons name="camera-outline" size={26} color="#00ff9d" />
                <Text style={{ marginLeft: 16, fontSize: 18, fontWeight: "600", color: isDark ? "#fff" : "#000" }}>Take New Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", paddingVertical: 16 }} onPress={launchGallery}>
                <Ionicons name="images-outline" size={26} color="#00ff9d" />
                <Text style={{ marginLeft: 16, fontSize: 18, fontWeight: "600", color: isDark ? "#fff" : "#000" }}>Choose from Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setAvatarModalVisible(false)} style={{ marginTop: 15 }}>
                <Text style={{ textAlign: "center", fontSize: 18, color: "#ff3b5c", fontWeight: "700" }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>

        {/* FULL SCREEN PHOTO VIEWER */}
        <Modal visible={viewPhotoVisible} transparent animationType="fade">
          <View style={{ flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" }}>
            <Pressable 
              style={{ position: "absolute", top: 60, right: 20, zIndex: 20 }} 
              onPress={() => setViewPhotoVisible(false)}
            >
              <Ionicons name="close-circle" size={40} color="#fff" />
            </Pressable>

            {profile.avatar && (
              <Image
                source={{ uri: profile.avatar }}
                style={{ width: width, height: height * 0.85, resizeMode: "contain" }}
              />
            )}
          </View>
        </Modal>

        {/* EDIT FIELD MODAL */}
        <Modal visible={modalVisible} transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.9)", justifyContent: "flex-end" }}>
            <View style={{
              backgroundColor: isDark ? "#111" : "#fff",
              padding: 24,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
            }}>
              <Text style={{
                fontSize: 22,
                fontWeight: "800",
                color: isDark ? "#fff" : "#000",
                marginBottom: 20,
              }}>
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

              <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 24, gap: 16 }}>
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