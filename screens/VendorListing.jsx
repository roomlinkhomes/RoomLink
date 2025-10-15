import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Modal,
  ScrollView,
  useColorScheme,
  Platform,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useVendorListing } from "../context/ListingContext";

const presetTitles = [
  {
    group: "Home & Room Essentials",
    items: ["Bed", "Bed frame", "Wardrobes", "Chair/desk", "Curtains", "Bulb/Chandelier", "Rug/Carpet", "Fridge", "Gas cylinder", "Blender/Mortar&Pestle", "Paints"],
  },
  {
    group: "Maintenance & Repairs",
    items: ["Electricians", "Plumbers", "Carpenters", "House cleaners", "Laundry pickup", "Appliances repair", "Fumigation", "Painters"],
  },
  {
    group: "Moving & Logistics",
    items: ["Delivery van for packing", "Delivery guy"],
  },
  {
    group: "Consumables",
    items: ["Cooking gas refills", "Food stuffs", "Toiletries & cleaning supply"],
  },
  {
    group: "Lifestyle",
    items: ["TV", "Game/pads", "Gym equipment", "Outdoor chairs", "Phone", "Sound systems"],
  },
];

export default function VendorListing() {
  const { addVendorListing } = useVendorListing();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const textColor = isDark ? "#fff" : "#000";
  const bgColor = isDark ? "#121212" : "#fff";
  const cardBg = isDark ? "#1E1E1E" : "#f5f5f7";

  const [images, setImages] = useState([]);
  const [title, setTitle] = useState(null);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [titleModalVisible, setTitleModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

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
      const res = await fetch("https://api.cloudinary.com/v1_1/drserbss8/image/upload", { method: "POST", body: data });
      const json = await res.json();
      return json.secure_url || null;
    } catch {
      Alert.alert("Upload Error", "Image upload failed, try again.");
      return null;
    }
  };

  const pickImages = async () => {
    const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (lib.status !== "granted") return Alert.alert("Permission required", "We need gallery access to continue.");
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });
    if (!result.canceled) setImages((prev) => [...prev, ...result.assets.map((a) => a.uri)]);
  };

  const openCamera = async () => {
    const cam = await ImagePicker.requestCameraPermissionsAsync();
    if (cam.status !== "granted") return Alert.alert("Permission required", "We need camera access to continue.");
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 1 });
    if (!result.canceled) setImages((prev) => [...prev, result.assets[0].uri]);
  };

  const removeImage = (uri) => setImages((prev) => prev.filter((u) => u !== uri));

  const handlePriceChange = (text) => {
    const digits = text.replace(/\D/g, "");
    const formatted = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    setPrice(formatted);
  };

  const submitForm = async () => {
    if (!title || !description || !location || !price || !category)
      return Alert.alert("Error", "Please fill all fields and select a category.");
    const categoryObj = presetTitles.find((c) => c.group === category);
    if (!categoryObj || !categoryObj.items.includes(title))
      return Alert.alert("Error", "Selected title does not match category.");
    setUploading(true);
    try {
      const uploadedUrls = [];
      for (const img of images) {
        const url = await uploadImage(img);
        if (url) uploadedUrls.push(url);
      }
      if (!uploadedUrls.length) return Alert.alert("Error", "Please upload at least one image.");
      addVendorListing({ title, description, location, price: price.replace(/,/g, ""), images: uploadedUrls, category });
      Alert.alert("Success", "Your vendor listing has been created!");
      setTitle(null); setDescription(""); setLocation(""); setPrice(""); setImages([]); setCategory(null);
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to create listing");
    } finally { setUploading(false); }
  };

  const filteredTitles = category ? presetTitles.find((c) => c.group === category)?.items || [] : presetTitles.flatMap((c) => c.items);

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={{ padding: 20, backgroundColor: bgColor, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
      extraScrollHeight={Platform.OS === "ios" ? 100 : 120}
      enableOnAndroid
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 80} // <- this fixes last input being hidden
    >
      <View style={{ flex: 1 }}>
        {/* Gallery / Camera */}
        <TouchableOpacity style={[styles.galleryCard, { backgroundColor: cardBg }]} onPress={pickImages}>
          <Ionicons name="images-outline" size={36} color="#036DD6" />
          <Text style={[styles.galleryCardText, { color: textColor }]}>Select from Gallery</Text>
        </TouchableOpacity>

        <View style={styles.photoRow}>
          <TouchableOpacity style={[styles.photoBtn, { backgroundColor: cardBg }]} onPress={openCamera}>
            <Ionicons name="camera-outline" size={18} color="#036DD6" />
            <Text style={[styles.photoText, { color: textColor }]}>Photo</Text>
          </TouchableOpacity>
        </View>

        {images.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbScroll}>
            {images.map((uri, i) => (
              <View key={`${uri}-${i}`} style={styles.thumbWrap}>
                <Image source={{ uri }} style={styles.thumb} />
                <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(uri)}>
                  <Ionicons name="close-circle" size={22} color="red" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Category */}
        <Text style={[styles.label, { color: textColor }]}>Category</Text>
        <TouchableOpacity style={[styles.inputCard, { backgroundColor: cardBg }]} onPress={() => setCategoryModalVisible(true)}>
          <Text style={{ color: textColor }}>{category || "Select Category"}</Text>
        </TouchableOpacity>

        <Modal visible={categoryModalVisible} animationType="slide" transparent onRequestClose={() => setCategoryModalVisible(false)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={() => setCategoryModalVisible(false)}>
            <View style={[styles.bottomSheet, { backgroundColor: bgColor }]}>
              <ScrollView>
                {presetTitles.map((group) => (
                  <TouchableOpacity key={group.group} style={styles.sheetRow} onPress={() => { setCategory(group.group); setTitle(null); setCategoryModalVisible(false); }}>
                    <Text style={[styles.sheetText, { color: textColor }]}>{group.group}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Title */}
        <Text style={[styles.label, { color: textColor }]}>Select Item / Service</Text>
        <TouchableOpacity style={[styles.inputCard, { backgroundColor: cardBg }]} onPress={() => { if (!category) return Alert.alert("Select category first"); setTitleModalVisible(true); }}>
          <Text style={{ color: textColor }}>{title || "Select Item"}</Text>
        </TouchableOpacity>

        <Modal visible={titleModalVisible} animationType="slide" transparent onRequestClose={() => setTitleModalVisible(false)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={() => setTitleModalVisible(false)}>
            <View style={[styles.bottomSheet, { backgroundColor: bgColor }]}>
              <ScrollView>
                {filteredTitles.map((item) => (
                  <TouchableOpacity key={item} style={styles.sheetRow} onPress={() => { setTitle(item); setTitleModalVisible(false); }}>
                    <Text style={[styles.sheetText, { color: textColor }]}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Other Fields */}
        <Text style={[styles.label, { color: textColor }]}>Description</Text>
        <TextInput
          style={[styles.inputCard, styles.textArea, { backgroundColor: cardBg, color: textColor }]}
          placeholder="Describe the product or service..."
          placeholderTextColor={isDark ? "#aaa" : "#888"}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Text style={[styles.label, { color: textColor }]}>Location</Text>
        <TextInput
          style={[styles.inputCard, { backgroundColor: cardBg, color: textColor }]}
          placeholder="City or Area"
          placeholderTextColor={isDark ? "#aaa" : "#888"}
          value={location}
          onChangeText={setLocation}
        />

        <Text style={[styles.label, { color: textColor }]}>Price (₦)</Text>
        <TextInput
          style={[styles.inputCard, { backgroundColor: cardBg, color: textColor }]}
          placeholder="e.g. 250,000"
          placeholderTextColor={isDark ? "#aaa" : "#888"}
          value={price}
          onChangeText={handlePriceChange}
          keyboardType="numeric"
        />

        <TouchableOpacity style={[styles.submitBtn, { backgroundColor: "#036DD6" }]} onPress={submitForm} disabled={uploading}>
          <Text style={styles.submitText}>{uploading ? "Uploading..." : "Submit Listing"}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  galleryCard: { height: 150, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 10, elevation: 3 },
  galleryCardText: { marginTop: 6, fontSize: 16, fontWeight: "600" },
  photoRow: { alignItems: "flex-end", marginTop: 10, marginBottom: 10 },
  photoBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, elevation: 2 },
  photoText: { marginLeft: 6, fontWeight: "600" },
  thumbScroll: { marginBottom: 10 },
  thumbWrap: { position: "relative", marginRight: 10 },
  thumb: { width: 100, height: 100, borderRadius: 8 },
  removeBtn: { position: "absolute", top: -6, right: -6 },
  label: { fontWeight: "700", marginTop: 12, marginBottom: 6 },
  inputCard: { borderRadius: 8, padding: 12, marginBottom: 10, elevation: 2 },
  textArea: { height: 100, textAlignVertical: "top" },
  submitBtn: { paddingVertical: 14, borderRadius: 8, alignItems: "center", marginTop: 18 },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.3)" },
  bottomSheet: { paddingVertical: 10, borderTopLeftRadius: 15, borderTopRightRadius: 15 },
  sheetRow: { padding: 15 },
  sheetText: { fontSize: 16 },
});
