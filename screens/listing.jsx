import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput as RNTextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Modal,
  FlatList,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useListing } from "../context/ListingContext";
import { homeCategories } from "./Config/Categories";
import useNotificationService from "../services/NotificationService";

export default function Listing() {
  const { addListing } = useListing();
  const { showNotification } = useNotificationService();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const [images, setImages] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [titleModalVisible, setTitleModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  const titleOptions = [
    "1 Bedroom Flat",
    "2 Bedroom Flat",
    "3 Bedroom Flat",
    "1 Room Apartment",
    "Duplex",
    "Bungalow",
    "Self-Contain",
    "Land",
    "Studio 🎙",
    "Estate",
    "Shop",
  ];

  useEffect(() => {
    (async () => {
      await ImagePicker.requestCameraPermissionsAsync();
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    })();
  }, []);

  const uploadImage = async (uri) => {
    const data = new FormData();
    data.append("file", { uri, type: "image/jpeg", name: "upload.jpg" });
    data.append("upload_preset", "roomlink_preset");
    data.append("cloud_name", "drserbss8");

    try {
      const res = await fetch(
        "https://api.cloudinary.com/v1_1/drserbss8/image/upload",
        { method: "POST", body: data }
      );
      const json = await res.json();
      return json.secure_url || null;
    } catch (err) {
      Alert.alert("Upload Error", "Image upload failed, try again.");
      return null;
    }
  };

  const pickImages = async () => {
    const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (lib.status !== "granted") {
      Alert.alert("Permission required", "We need gallery access to continue.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImages((prev) => [...prev, ...result.assets.map((a) => a.uri)]);
    }
  };

  const openCamera = async () => {
    const cam = await ImagePicker.requestCameraPermissionsAsync();
    if (cam.status !== "granted") {
      Alert.alert("Permission required", "We need camera access to continue.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      setImages((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const removeImage = (uri) => setImages((prev) => prev.filter((u) => u !== uri));

  const submitForm = async () => {
    if (!title || !description || !location || !price || !category) {
      Alert.alert("Error", "Please fill all fields and select a category.");
      return;
    }

    setUploading(true);
    try {
      const uploadedUrls = [];
      for (const img of images) {
        const url = await uploadImage(img);
        if (url) uploadedUrls.push(url);
      }

      if (uploadedUrls.length === 0) {
        Alert.alert("Error", "Please upload at least one image.");
        setUploading(false);
        return;
      }

      await addListing({
        title,
        description,
        location,
        price,
        category,
        images: uploadedUrls,
      });

      showNotification(
        "Listing Created",
        `Your listing "${title}" has been successfully posted!`
      );

      Alert.alert("Success", "Your listing has been created!");

      setTitle("");
      setDescription("");
      setLocation("");
      setPrice("");
      setCategory(null);
      setImages([]);
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to create listing");
    } finally {
      setUploading(false);
    }
  };

  const renderTitleItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.optionItem,
        { borderBottomColor: isDark ? "#444" : "#eee" },
      ]}
      onPress={() => {
        setTitle(item);
        setTitleModalVisible(false);
      }}
    >
      <Text style={[styles.optionText, { color: isDark ? "#fff" : "#000" }]}>{item}</Text>
    </TouchableOpacity>
  );

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.optionItem,
        { borderBottomColor: isDark ? "#444" : "#eee" },
      ]}
      onPress={() => {
        setCategory(item);
        setCategoryModalVisible(false);
      }}
    >
      <Text style={[styles.optionText, { color: isDark ? "#fff" : "#000" }]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: isDark ? "#000" : "#fff" },
      ]}
      enableOnAndroid={true}
      extraScrollHeight={20}
      keyboardShouldPersistTaps="handled"
    >
      {/* Gallery */}
      <TouchableOpacity
        style={[
          styles.galleryCard,
          {
            backgroundColor: isDark ? "#1c1c1c" : "#f5f5f7",
            borderColor: isDark ? "#444" : "#ccc",
          },
        ]}
        onPress={pickImages}
      >
        <Ionicons
          name="images-outline"
          size={36}
          color={isDark ? "#fff" : "#036DD6"}
        />
        <Text
          style={[
            styles.galleryCardText,
            { color: isDark ? "#fff" : "#000" },
          ]}
        >
          Select from Gallery
        </Text>
      </TouchableOpacity>

      {/* Camera */}
      <View style={styles.photoRow}>
        <TouchableOpacity
          style={[
            styles.photoBtn,
            {
              backgroundColor: isDark ? "#1c1c1c" : "#fff",
              borderColor: isDark ? "#444" : "#000",
            },
          ]}
          onPress={openCamera}
        >
          <Ionicons
            name="camera-outline"
            size={18}
            color={isDark ? "#fff" : "#036DD6"}
          />
          <Text
            style={[
              styles.photoText,
              { color: isDark ? "#fff" : "#000" },
            ]}
          >
            Photo
          </Text>
        </TouchableOpacity>
      </View>

      {/* Thumbnails */}
      {images.length > 0 && (
        <KeyboardAwareScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.thumbScroll}
        >
          {images.map((uri, i) => (
            <View key={`${uri}-${i}`} style={styles.thumbWrap}>
              <Image source={{ uri }} style={styles.thumb} />
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => removeImage(uri)}
              >
                <Ionicons name="close-circle" size={22} color="red" />
              </TouchableOpacity>
            </View>
          ))}
        </KeyboardAwareScrollView>
      )}

      {/* Title */}
      <Text style={[styles.label, { color: isDark ? "#fff" : "#000" }]}>
        Title
      </Text>
      <TouchableOpacity
        style={[
          styles.input,
          { backgroundColor: isDark ? "#1c1c1c" : "#fff", borderColor: isDark ? "#444" : "#000" },
        ]}
        onPress={() => setTitleModalVisible(true)}
      >
        <Text style={{ color: title ? (isDark ? "#fff" : "#000") : "#999" }}>
          {title || "Select Title"}
        </Text>
      </TouchableOpacity>

      {/* Description */}
      <Text style={[styles.label, { color: isDark ? "#fff" : "#000" }]}>
        Description
      </Text>
      <RNTextInput
        style={[
          styles.input,
          styles.textArea,
          {
            color: isDark ? "#fff" : "#000",
            backgroundColor: isDark ? "#1c1c1c" : "#fff",
            borderColor: isDark ? "#444" : "#000",
          },
        ]}
        placeholder="Describe the property..."
        placeholderTextColor={isDark ? "#aaa" : "#999"}
        value={description}
        onChangeText={setDescription}
        multiline
      />

      {/* Location */}
      <Text style={[styles.label, { color: isDark ? "#fff" : "#000" }]}>
        Location
      </Text>
      <RNTextInput
        style={[
          styles.input,
          { color: isDark ? "#fff" : "#000", backgroundColor: isDark ? "#1c1c1c" : "#fff", borderColor: isDark ? "#444" : "#000" },
        ]}
        placeholder="City or Area"
        placeholderTextColor={isDark ? "#aaa" : "#999"}
        value={location}
        onChangeText={setLocation}
      />

      {/* Price */}
      <Text style={[styles.label, { color: isDark ? "#fff" : "#000" }]}>
        Price (₦)
      </Text>
      <RNTextInput
        style={[
          styles.input,
          { color: isDark ? "#fff" : "#000", backgroundColor: isDark ? "#1c1c1c" : "#fff", borderColor: isDark ? "#444" : "#000" },
        ]}
        placeholder="e.g. 250,000"
        placeholderTextColor={isDark ? "#aaa" : "#999"}
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
      />

      {/* Category */}
      <Text style={[styles.label, { color: isDark ? "#fff" : "#000" }]}>
        Category
      </Text>
      <TouchableOpacity
        style={[
          styles.input,
          { backgroundColor: isDark ? "#1c1c1c" : "#fff", borderColor: isDark ? "#444" : "#000" },
        ]}
        onPress={() => setCategoryModalVisible(true)}
      >
        <Text style={{ color: category ? (isDark ? "#fff" : "#000") : "#999" }}>
          {category ? category.name : "Select Category"}
        </Text>
      </TouchableOpacity>

      {/* Submit */}
      <TouchableOpacity
        style={[
          styles.submitBtn,
          { backgroundColor: "#036DD6", opacity: uploading ? 0.7 : 1 },
        ]}
        onPress={submitForm}
        disabled={uploading}
      >
        <Text style={styles.submitText}>{uploading ? "Uploading..." : "Submit Listing"}</Text>
      </TouchableOpacity>

      {/* Title Modal */}
      <Modal
        visible={titleModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTitleModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setTitleModalVisible(false)}
        >
          <View
            style={[
              styles.bottomSheet,
              { backgroundColor: isDark ? "#1c1c1c" : "#fff" },
            ]}
          >
            <Text style={[styles.sheetTitle, { color: isDark ? "#fff" : "#000" }]}>
              Select Title
            </Text>
            <FlatList
              data={titleOptions}
              keyExtractor={(item) => item}
              renderItem={renderTitleItem}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Category Modal */}
      <Modal
        visible={categoryModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setCategoryModalVisible(false)}
        >
          <View
            style={[
              styles.bottomSheet,
              { backgroundColor: isDark ? "#1c1c1c" : "#fff" },
            ]}
          >
            <Text style={[styles.sheetTitle, { color: isDark ? "#fff" : "#000" }]}>
              Select Category
            </Text>
            <FlatList
              data={homeCategories}
              keyExtractor={(item) => item.id}
              renderItem={renderCategoryItem}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20 },
  galleryCard: {
    height: 150,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  galleryCardText: { marginTop: 6, fontSize: 16, fontWeight: "600" },
  photoRow: { alignItems: "flex-end", marginVertical: 10 },
  photoBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  photoText: { marginLeft: 6, fontWeight: "600" },
  thumbScroll: { marginBottom: 10 },
  thumbWrap: { position: "relative", marginRight: 10 },
  thumb: { width: 100, height: 100, borderRadius: 8 },
  removeBtn: { position: "absolute", top: -6, right: -6 },
  label: { fontWeight: "700", marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 6, padding: 10, marginBottom: 10 },
  textArea: { height: 80, textAlignVertical: "top" },
  submitBtn: { marginTop: 20, paddingVertical: 14, borderRadius: 8, alignItems: "center" },
  submitText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "flex-end" },
  bottomSheet: {
    padding: 20,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    maxHeight: "50%",
  },
  sheetTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  optionItem: { paddingVertical: 12, borderBottomWidth: 1 },
  optionText: { fontSize: 16 },
});

