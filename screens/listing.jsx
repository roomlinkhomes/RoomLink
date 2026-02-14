// screens/Listing.jsx
import React, { useRef, useEffect } from "react";
import {
  View,
  FlatList,
  Dimensions,
  StyleSheet,
  Text,
  TextInput as RNTextInput,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useListing } from "../context/ListingContext";
import { homeCategories } from "./Config/Categories";
import { useUser } from "../context/UserContext";
import { useListingTab } from "../context/ListingTabContext";
import HotelListingForm from "../component/HotelListingForm";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ────────────────────────────────────────────────
// Houses & Apartments Form (unchanged)
// ────────────────────────────────────────────────
const HousesForm = () => {
  const { addListing } = useListing();
  const { user } = useUser();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const [images, setImages] = React.useState([]);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [priceMonthly, setPriceMonthly] = React.useState("");
  const [priceYearly, setPriceYearly] = React.useState("");
  const [category, setCategory] = React.useState(null);
  const [uploading, setUploading] = React.useState(false);
  const [titleModalVisible, setTitleModalVisible] = React.useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = React.useState(false);

  const titleOptions = [
    "1 Bedroom Flat",
    "2 Bedroom Flat",
    "3 Bedroom Flat",
    "1 Room Apartment",
    "Self-Contain",
    "Studio",
    "1 plot",
    "2 plots",
    "3 plots",
    "4 plots",
    "5 plots",
    "6 plots",
    "7 plots",
    "10 plots",
    "Duplex",
    "Bungalow",
    "Estate",
    "Land",
    "Shops",
    "Room-mate needed",
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
      const res = await fetch("https://api.cloudinary.com/v1_1/drserbss8/image/upload", {
        method: "POST",
        body: data,
      });
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
    if (!user?.id) {
      Alert.alert("Error", "You must be logged in to create a listing.");
      return;
    }
    if (!title || !description || !location || !category) {
      Alert.alert("Error", "Please fill all required fields and select a category.");
      return;
    }
    if (!priceMonthly.trim() && !priceYearly.trim()) {
      Alert.alert("Price Required", "Please enter either a monthly or yearly price (or both).");
      return;
    }
    if (priceMonthly.trim()) {
      const monthlyNum = parseInt(priceMonthly.replace(/[^0-9]/g, ""), 10);
      if (isNaN(monthlyNum) || monthlyNum <= 0) {
        Alert.alert("Invalid Price", "Please enter a valid monthly price.");
        return;
      }
    }
    if (priceYearly.trim()) {
      const yearlyNum = parseInt(priceYearly.replace(/[^0-9]/g, ""), 10);
      if (isNaN(yearlyNum) || yearlyNum <= 0) {
        Alert.alert("Invalid Price", "Please enter a valid yearly price.");
        return;
      }
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
        priceMonthly: priceMonthly.trim() ? parseInt(priceMonthly.replace(/[^0-9]/g, ""), 10) : null,
        priceYearly: priceYearly.trim() ? parseInt(priceYearly.replace(/[^0-9]/g, ""), 10) : null,
        category,
        images: uploadedUrls,
        userId: user.id,
        listingType: "houses",
      });
      Alert.alert("Success!", `Your listing "${title}" has been created!`, [{ text: "Done" }]);
      setTitle("");
      setDescription("");
      setLocation("");
      setPriceMonthly("");
      setPriceYearly("");
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
        {
          backgroundColor: isDark ? "#2a2a2a" : "#f8f9fa",
          borderBottomColor: isDark ? "#444" : "#e9ecef",
        },
      ]}
      onPress={() => {
        setTitle(item);
        setTitleModalVisible(false);
      }}
    >
      <Text style={[styles.optionText, { color: isDark ? "#e0e0e0" : "#212529" }]}>{item}</Text>
    </TouchableOpacity>
  );

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.optionItem,
        {
          backgroundColor: isDark ? "#2a2a2a" : "#f8f9fa",
          borderBottomColor: isDark ? "#444" : "#e9ecef",
        },
      ]}
      onPress={() => {
        setCategory(item);
        setCategoryModalVisible(false);
      }}
    >
      <Text style={[styles.optionText, { color: isDark ? "#e0e0e0" : "#212529" }]}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={[styles.container, { backgroundColor: isDark ? "#121212" : "#fafafa" }]}
      enableOnAndroid={true}
      extraScrollHeight={20}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Gallery Card */}
      <TouchableOpacity
        style={[
          styles.galleryCard,
          {
            backgroundColor: isDark ? "#1e1e1e" : "#ffffff",
            borderColor: isDark ? "#333" : "#e0e6ed",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 4,
          },
        ]}
        onPress={pickImages}
        activeOpacity={0.9}
      >
        <View style={styles.galleryIconContainer}>
          <Ionicons name="images-outline" size={40} color="#017a6b" />
        </View>
        <Text style={[styles.galleryCardText, { color: isDark ? "#e0e0e0" : "#495057" }]}>
          Select from Gallery
        </Text>
        <Text style={[styles.galleryCardSubtext, { color: isDark ? "#a0a0a0" : "#868e96" }]}>
          Tap to add photos
        </Text>
      </TouchableOpacity>

      {/* Camera Button */}
      <View style={styles.photoRow}>
        <TouchableOpacity
          style={[
            styles.photoBtn,
            {
              backgroundColor: isDark ? "#2a2a2a" : "#ffffff",
              borderColor: "#017a6b",
              shadowColor: "#017a6b",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 3,
            },
          ]}
          onPress={openCamera}
          activeOpacity={0.85}
        >
          <Ionicons name="camera-outline" size={20} color="#017a6b" />
          <Text style={[styles.photoText, { color: "#017a6b" }]}>Take Photo</Text>
        </TouchableOpacity>
      </View>

      {/* Image Thumbnails */}
      {images.length > 0 && (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={images}
          keyExtractor={(uri, i) => `${uri}-${i}`}
          renderItem={({ item: uri }) => (
            <View style={styles.thumbWrap}>
              <Image source={{ uri }} style={styles.thumb} />
              <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(uri)}>
                <View style={styles.removeBtnBg}>
                  <Ionicons name="close" size={20} color="#fff" />
                </View>
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={styles.thumbScroll}
        />
      )}

      {/* Title */}
      <Text style={[styles.label, { color: isDark ? "#e0e0e0" : "#212529" }]}>Title</Text>
      <TouchableOpacity
        style={[
          styles.input,
          {
            backgroundColor: isDark ? "#2a2a2a" : "#ffffff",
            borderColor: isDark ? "#444" : "#e0e6ed",
            shadowColor: "#000",
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          },
        ]}
        onPress={() => setTitleModalVisible(true)}
      >
        <Text
          style={{
            color: title ? (isDark ? "#e0e0e0" : "#212529") : (isDark ? "#6c757d" : "#adb5bd"),
          }}
        >
          {title || "Select a title"}
        </Text>
      </TouchableOpacity>

      {/* Description */}
      <Text style={[styles.label, { color: isDark ? "#e0e0e0" : "#212529" }]}>Description</Text>
      <RNTextInput
        style={[
          styles.input,
          styles.textArea,
          {
            color: isDark ? "#e0e0e0" : "#212529",
            backgroundColor: isDark ? "#2a2a2a" : "#ffffff",
            borderColor: isDark ? "#444" : "#e0e6ed",
          },
        ]}
        placeholder="Describe the property in detail..."
        placeholderTextColor={isDark ? "#6c757d" : "#adb5bd"}
        value={description}
        onChangeText={setDescription}
        multiline
        textAlignVertical="top"
      />

      {/* Location */}
      <Text style={[styles.label, { color: isDark ? "#e0e0e0" : "#212529" }]}>Location</Text>
      <RNTextInput
        style={[
          styles.input,
          {
            color: isDark ? "#e0e0e0" : "#212529",
            backgroundColor: isDark ? "#2a2a2a" : "#ffffff",
            borderColor: isDark ? "#444" : "#e0e6ed",
          },
        ]}
        placeholder="City, Area or Neighborhood"
        placeholderTextColor={isDark ? "#6c757d" : "#adb5bd"}
        value={location}
        onChangeText={setLocation}
      />

      {/* Price Monthly */}
      <Text style={[styles.label, { color: isDark ? "#e0e0e0" : "#212529" }]}>Price Monthly (₦)</Text>
      <RNTextInput
        style={[
          styles.input,
          {
            color: isDark ? "#e0e0e0" : "#212529",
            backgroundColor: isDark ? "#2a2a2a" : "#ffffff",
            borderColor: isDark ? "#444" : "#e0e6ed",
          },
        ]}
        placeholder="e.g. 50,000"
        placeholderTextColor={isDark ? "#6c757d" : "#adb5bd"}
        value={priceMonthly}
        onChangeText={setPriceMonthly}
        keyboardType="numeric"
      />

      {/* Price Yearly */}
      <Text style={[styles.label, { color: isDark ? "#e0e0e0" : "#212529" }]}>Price Yearly (₦)</Text>
      <RNTextInput
        style={[
          styles.input,
          {
            color: isDark ? "#e0e0e0" : "#212529",
            backgroundColor: isDark ? "#2a2a2a" : "#ffffff",
            borderColor: isDark ? "#444" : "#e0e6ed",
          },
        ]}
        placeholder="e.g. 500,000"
        placeholderTextColor={isDark ? "#6c757d" : "#adb5bd"}
        value={priceYearly}
        onChangeText={setPriceYearly}
        keyboardType="numeric"
      />

      {/* Helper Text */}
      <Text style={[styles.helperText, { color: "#017a6b" }]}>
        ※ Fill at least one: Monthly or Yearly price
      </Text>

      {/* Category */}
      <Text style={[styles.label, { color: isDark ? "#e0e0e0" : "#212529" }]}>Category</Text>
      <TouchableOpacity
        style={[
          styles.input,
          {
            backgroundColor: isDark ? "#2a2a2a" : "#ffffff",
            borderColor: isDark ? "#444" : "#e0e6ed",
          },
        ]}
        onPress={() => setCategoryModalVisible(true)}
      >
        <Text
          style={{
            color: category ? (isDark ? "#e0e0e0" : "#212529") : (isDark ? "#6c757d" : "#adb5bd"),
          }}
        >
          {category ? category.name : "Select a category"}
        </Text>
      </TouchableOpacity>

      {/* Submit Button */}
      <TouchableOpacity
        style={[
          styles.submitBtn,
          {
            backgroundColor: "#017a6b",
            opacity: uploading ? 0.7 : 1,
          },
        ]}
        onPress={submitForm}
        disabled={uploading}
      >
        <Text style={styles.submitText}>
          {uploading ? "Uploading..." : "Create Listing"}
        </Text>
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
          <View style={[styles.bottomSheet, { backgroundColor: isDark ? "#1e1e1e" : "#ffffff" }]}>
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: isDark ? "#e0e0e0" : "#212529" }]}>
                Select Title
              </Text>
              <TouchableOpacity onPress={() => setTitleModalVisible(false)}>
                <Ionicons name="close-outline" size={24} color={isDark ? "#a0a0a0" : "#6c757d"} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={titleOptions}
              keyExtractor={(item) => item}
              renderItem={renderTitleItem}
              contentContainerStyle={styles.sheetList}
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
          <View style={[styles.bottomSheet, { backgroundColor: isDark ? "#1e1e1e" : "#ffffff" }]}>
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: isDark ? "#e0e0e0" : "#212529" }]}>
                Select Category
              </Text>
              <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
                <Ionicons name="close-outline" size={24} color={isDark ? "#a0a0a0" : "#6c757d"} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={homeCategories}
              keyExtractor={(item) => item.id}
              renderItem={renderCategoryItem}
              contentContainerStyle={styles.sheetList}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAwareScrollView>
  );
};

// ────────────────────────────────────────────────
// Main Listing Screen — Fixed version
// ────────────────────────────────────────────────
export default function Listing({ navigation }) {
  const { activeTab, setActiveTab } = useListingTab();
  const flatListRef = useRef(null);
  const isProgrammaticScroll = useRef(false);

  const pages = [
    { key: "houses", component: HousesForm },
    { key: "hotels", component: () => <HotelListingForm navigation={navigation} /> },
  ];

  // Only update tab when scroll has fully settled (prevents bounce loop)
  const handleMomentumScrollEnd = (event) => {
    if (isProgrammaticScroll.current) return;

    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    const newTab = index === 0 ? "houses" : "hotels";

    if (newTab !== activeTab) {
      setActiveTab(newTab);
    }
  };

  // When tab changes via header → scroll to correct page
  useEffect(() => {
    const targetIndex = activeTab === "houses" ? 0 : 1;
    const targetOffset = targetIndex * SCREEN_WIDTH;

    isProgrammaticScroll.current = true;

    flatListRef.current?.scrollToOffset({
      offset: targetOffset,
      animated: true,
    });

    // Reset flag after animation should have finished
    const timeout = setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 600); // 600 ms is usually safe on most devices

    return () => clearTimeout(timeout);
  }, [activeTab]);

  const renderPage = ({ item }) => {
    const Component = item.component;
    return (
      <View style={{ width: SCREEN_WIDTH }}>
        <Component />
      </View>
    );
  };

  return (
    <FlatList
      ref={flatListRef}
      data={pages}
      renderItem={renderPage}
      keyExtractor={(item) => item.key}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      onMomentumScrollEnd={handleMomentumScrollEnd}
      scrollEventThrottle={16}
      bounces={false}
      decelerationRate="fast"
      snapToInterval={SCREEN_WIDTH}
      snapToAlignment="center"
      disableIntervalMomentum={true}
      // Important: always allow scrolling
      scrollEnabled={true}
    />
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, paddingBottom: 40 },
  galleryCard: { height: 160, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center", marginBottom: 20, padding: 24 },
  galleryIconContainer: { width: 72, height: 72, borderRadius: 20, backgroundColor: "rgba(1,122,107,0.1)", justifyContent: "center", alignItems: "center", marginBottom: 12 },
  galleryCardText: { fontSize: 18, fontWeight: "700", marginBottom: 4 },
  galleryCardSubtext: { fontSize: 14, fontWeight: "500" },
  photoRow: { alignItems: "flex-end", marginVertical: 16 },
  photoBtn: { flexDirection: "row", alignItems: "center", borderWidth: 2, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, minWidth: 120, justifyContent: "center" },
  photoText: { marginLeft: 8, fontWeight: "700", fontSize: 15 },
  thumbScroll: { marginBottom: 24, paddingVertical: 8 },
  thumbWrap: { position: "relative", marginRight: 12 },
  thumb: { width: 100, height: 100, borderRadius: 16, borderWidth: 3, borderColor: "#e0e6ed" },
  removeBtn: { position: "absolute", top: -12, right: -12, zIndex: 10 },
  removeBtnBg: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#ff4757", justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 },
  label: { fontWeight: "800", fontSize: 16, marginTop: 24, marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 16, fontSize: 16 },
  textArea: { height: 100, textAlignVertical: "top" },
  helperText: { fontSize: 14, fontWeight: "600", textAlign: "center", marginTop: -8, marginBottom: 16 },
  submitBtn: { marginTop: 32, paddingVertical: 16, borderRadius: 16, alignItems: "center", marginBottom: 20 },
  submitText: { color: "#fff", fontWeight: "800", fontSize: 18 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  bottomSheet: { padding: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "70%", shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "#e9ecef" },
  sheetTitle: { fontSize: 20, fontWeight: "800" },
  sheetList: { padding: 20, paddingBottom: 40 },
  optionItem: { paddingVertical: 16, paddingHorizontal: 20, borderRadius: 12, marginBottom: 8 },
  optionText: { fontSize: 16, fontWeight: "600" },
});