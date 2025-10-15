// EditProfile.jsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
} from "react-native";
import { TextInput, Button } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "../context/UserContext";

export default function EditProfile({ navigation }) {
  const { user, updateUser } = useUser();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // --- States ---
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [avatar, setAvatar] = useState(user?.avatar || null);
  const [bio, setBio] = useState(user?.bio || "");
  const [location, setLocation] = useState(user?.location || "");
  const [born, setBorn] = useState(user?.born || "");
  const [hubby, setHubby] = useState(user?.hubby || "");
  const [fantasy, setFantasy] = useState(user?.fantasy || "");
  const [pet, setPet] = useState(user?.pet || "");
  const [studiedAt, setStudiedAt] = useState(user?.studiedAt || "");
  const [education, setEducation] = useState(user?.education || "");
  const [work, setWork] = useState(user?.work || "");
  const [deliveryMethod, setDeliveryMethod] = useState(user?.deliveryMethod || "");
  const [lastNameChangeDate, setLastNameChangeDate] = useState(user?.nameChangedAt || null);

  useEffect(() => {
    if (!firstName) setFirstName(user?.firstName || "");
    if (!lastName) setLastName(user?.lastName || "");
    if (!avatar) setAvatar(user?.avatar || null);
    if (!bio) setBio(user?.bio || "");
    if (!location) setLocation(user?.location || "");
    if (!born) setBorn(user?.born || "");
    if (!hubby) setHubby(user?.hubby || "");
    if (!fantasy) setFantasy(user?.fantasy || "");
    if (!pet) setPet(user?.pet || "");
    if (!studiedAt) setStudiedAt(user?.studiedAt || "");
    if (!education) setEducation(user?.education || "");
    if (!work) setWork(user?.work || "");
    if (!deliveryMethod) setDeliveryMethod(user?.deliveryMethod || "");
    if (!lastNameChangeDate) setLastNameChangeDate(user?.nameChangedAt || null);
  }, [user]);

  // --- Image Picker ---
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets?.length > 0) setAvatar(result.assets[0].uri);
  };

  // --- Save Changes ---
  const handleSave = () => {
    const now = new Date();
    if (!firstName || !lastName) {
      Alert.alert("Error", "Please fill in required fields");
      return;
    }

    // Check 6-month name change restriction
    if (lastNameChangeDate) {
      const lastChange = new Date(lastNameChangeDate);
      const sixMonthsLater = new Date(lastChange.setMonth(lastChange.getMonth() + 6));
      if (now < sixMonthsLater && (firstName !== user.firstName || lastName !== user.lastName)) {
        Alert.alert(
          "Name Change Restricted",
          "You can only change your first and last name once every 6 months."
        );
        return;
      }
    }

    const updated = {
      avatar,
      firstName,
      lastName,
      bio,
      location,
      born,
      hubby,
      fantasy,
      pet,
      studiedAt,
      education,
      work,
      deliveryMethod,
      nameChangedAt: firstName !== user.firstName || lastName !== user.lastName ? now.toISOString() : lastNameChangeDate,
    };

    updateUser(updated);
    Alert.alert("Success", "Profile updated successfully!");
  };

  const renderInput = (label, value, setValue, iconName, multiline = false, maxChars = null) => {
    const handleChange = (text) => {
      if (maxChars && text.length > maxChars) return;
      setValue(text);
    };

    return (
      <View style={{ flexDirection: "column", marginBottom: 15 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Ionicons name={iconName} size={22} color={isDark ? "#aaa" : "#555"} style={{ marginRight: 8 }} />
          <TextInput
            label={label}
            value={value}
            onChangeText={handleChange}
            mode="outlined"
            outlineColor="#036DD6"
            activeOutlineColor="#036DD6"
            textColor={isDark ? "#fff" : "#000"}
            multiline={multiline}
            style={[{ flex: 1, backgroundColor: isDark ? "#1f1f1f" : "#fff" }, multiline && { height: 100 }]}
          />
        </View>
        {label.includes("Bio") && (
          <Text style={{ alignSelf: "flex-end", color: isDark ? "#aaa" : "#555", fontSize: 12 }}>
            {value.length}/50
          </Text>
        )}
      </View>
    );
  };

  const avatarLetter = firstName ? firstName[0].toUpperCase() : "A";

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: isDark ? "#121212" : "#fff" }}
        contentContainerStyle={{ paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar */}
        <TouchableOpacity style={{ alignItems: "center", marginVertical: 20 }} onPress={pickImage}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={{ width: 100, height: 100, borderRadius: 50 }} />
          ) : (
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: "#036DD6",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 36, fontWeight: "bold" }}>{avatarLetter}</Text>
            </View>
          )}
          <Text style={{ color: "#036DD6", marginTop: 8 }}>Change Profile</Text>
        </TouchableOpacity>

        {/* Inputs */}
        <View style={{ paddingHorizontal: 20 }}>
          {renderInput("First Name", firstName, setFirstName, "person-outline")}
          {renderInput("Last Name", lastName, setLastName, "person-outline")}
          {renderInput("Bio (max 50 chars)", bio, setBio, "text-outline", true, 50)}
          {renderInput("Location", location, setLocation, "location-outline")}
          {renderInput("Born", born, setBorn, "calendar-outline")}
          {renderInput("Hubby", hubby, setHubby, "heart-outline")}
          {renderInput("Fantasy", fantasy, setFantasy, "flower-outline")}
          {renderInput("Pet", pet, setPet, "paw-outline")}
          {renderInput("Studied at", studiedAt, setStudiedAt, "school-outline")}
          {renderInput("Education", education, setEducation, "book-outline")}
          {renderInput("Work", work, setWork, "briefcase-outline")}
          {renderInput("How I deliver customer", deliveryMethod, setDeliveryMethod, "bicycle-outline")}

          {/* Save Button */}
<Button
  mode="contained"
  onPress={handleSave}
  style={{
    backgroundColor: "#036DD6",
    marginTop: 15,
    borderRadius: 50, // 👈 pill shape
  }}
  contentStyle={{
    paddingVertical: 3,
    borderRadius: 50, // 👈 ensure content also matches pill shape
  }}
  labelStyle={{
    fontWeight: "bold",
    fontSize: 16,
    color: "#fff",
  }}
>
  Save Changes
</Button>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
