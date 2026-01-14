// component/HotelListingForm.jsx — FIXED: Correct style array syntax + all previous improvements
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput as RNTextInput,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  FlatList,
  useColorScheme,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useListing } from "../context/ListingContext";
import { homeCategories } from "../screens/Config/Categories";
import { useUser } from "../context/UserContext";

const HotelListingForm = ({ navigation }) => {
  const { addListing } = useListing();
  const { user } = useUser();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const [images, setImages] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [pricePerNight, setPricePerNight] = useState("");
  const [category, setCategory] = useState(null);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [selectedHouseRules, setSelectedHouseRules] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [titleModalVisible, setTitleModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  const titleOptions = [
    "1 Bedroom short-let",
    "2 Bedroom short-let",
    "3 Bedroom short-let",
    "Hotel Room",
    "Suite",
    "Penthouse short-let",
    "Resort Villa",
    "Guest House",
    "Studio short-let",
    "Executive Suite",
    "Deluxe Room",
    "Family Room",
  ];

const amenitiesOptions = [
  // Core Essentials (most popular)
  { label: "WiFi", value: "wifi", icon: "wifi" },
  { label: "Air Conditioning", value: "ac", icon: "snow-outline" },
  { label: "Swimming Pool", value: "pool", icon: "water-outline" }, // ← explicitly kept + prominent
  { label: "Kitchen", value: "kitchen", icon: "restaurant-outline" },
  { label: "Gym / Fitness Center", value: "gym", icon: "fitness-outline" },
  { label: "Free Parking", value: "parking", icon: "car-outline" },
  { label: "Smart TV", value: "tv", icon: "tv-outline" },
  { label: "Hot Water", value: "hotwater", icon: "flame-outline" },
  { label: "24/7 Security", value: "security", icon: "shield-outline" },
  { label: "24/7 Power Supply", value: "power", icon: "flash-outline" },

  // Outdoor & Views
  { label: "Balcony / Terrace", value: "balcony", icon: "leaf-outline" },
  { label: "Garden / Courtyard", value: "garden", icon: "flower-outline" },
  { label: "Rooftop Access", value: "rooftop", icon: "sunny-outline" },
  { label: "Ocean View", value: "oceanview", icon: "water-outline" },
  { label: "City View", value: "cityview", icon: "business-outline" },

  // Laundry & Cleaning
  { label: "Washing Machine", value: "washingmachine", icon: "shirt-outline" },
  { label: "Dryer", value: "dryer", icon: "sunny-outline" },
  { label: "Iron & Ironing Board", value: "iron", icon: "sparkles-outline" },

  // Personal Care & Comfort
  { label: "Hair Dryer", value: "hairdryer", icon: "brush-outline" },
  { label: "Towels & Linens", value: "towels", icon: "bed-outline" },
  { label: "Shampoo & Body Wash", value: "toiletries", icon: "water-outline" },

  // Safety & Accessibility
  { label: "Smoke Detector", value: "smokedetector", icon: "alert-circle-outline" },
  { label: "First Aid Kit", value: "firstaid", icon: "medkit-outline" },
  { label: "Fire Extinguisher", value: "fireextinguisher", icon: "flame-outline" },
  { label: "Elevator / Lift", value: "elevator", icon: "arrow-up-circle-outline" },
  { label: "Wheelchair Accessible", value: "wheelchair", icon: "accessibility-outline" },

  // Tech & Convenience
  { label: "Workspace / Desk", value: "workspace", icon: "laptop-outline" },
  { label: "Smart Lock", value: "smartlock", icon: "lock-closed-outline" },
  { label: "Self Check-in", value: "selfcheckin", icon: "key-outline" },
  { label: "High-Speed Internet", value: "highspeedwifi", icon: "wifi-outline" },
  { label: "Streaming Services", value: "streaming", icon: "play-circle-outline" },

  // Family & Extra Comfort
  { label: "Crib / Baby Cot", value: "crib", icon: "bed-outline" },
  { label: "High Chair", value: "highchair", icon: "restaurant-outline" },
  { label: "Extra Pillows & Blankets", value: "extrabedding", icon: "bed-outline" },
  { label: "Room Service", value: "roomservice", icon: "restaurant-outline" },

  // Luxury / Premium (optional for high-end listings)
  { label: "Private Pool", value: "privatepool", icon: "water-outline" },
  { label: "Jacuzzi / Hot Tub", value: "jacuzzi", icon: "water-outline" },
  { label: "Sauna", value: "sauna", icon: "thermometer-outline" },
  { label: "Concierge Service", value: "concierge", icon: "call-outline" },
];


const houseRulesOptions = [
  // Your original rules
  { label: "No Smoking", value: "nosmoking", icon: "close-circle-outline" },
  { label: "No Parties / Events", value: "noparties", icon: "beer-outline" },
  { label: "No Pets", value: "nopets", icon: "paw-outline" },
  { label: "Quiet Hours 10pm-7am", value: "quiethours", icon: "volume-mute-outline" },
  { label: "Check-in after 3pm", value: "checkinafter3pm", icon: "time-outline" },
  { label: "Check-out before 11am", value: "checkoutbefore11am", icon: "time-outline" },
  { label: "No Shoes Inside", value: "noshoes", icon: "footsteps-outline" },
  { label: "No Visitors / Overnight Guests", value: "novisitors", icon: "people-outline" },

  // Very common additional rules (highly recommended)
  { label: "No Additional Guests Beyond Booking", value: "noextraguests", icon: "person-add-outline" },
  { label: "Maximum Occupancy: 2-6 Guests", value: "maxoccupancy", icon: "people-outline" },
  { label: "No Loud Music After 10pm", value: "noloudmusic", icon: "musical-notes-outline" },
  { label: "Keep Noise to a Minimum", value: "nonoise", icon: "volume-mute-outline" },
  { label: "No Cooking with Strong Odors", value: "nostrongodors", icon: "restaurant-outline" },
  { label: "No Illegal Activities", value: "noillegal", icon: "warning-outline" },
  { label: "Respect Neighbors", value: "respectneighbors", icon: "hand-left-outline" },

  // Family & Safety focused
  { label: "Children Must Be Supervised", value: "childsupervision", icon: "alert-circle-outline" },
  { label: "No Running in the House", value: "norunning", icon: "walk-outline" },
  { label: "Lock Doors When Leaving", value: "lockdoors", icon: "lock-closed-outline" },

  // Cleaning & Damage
  { label: "Leave Property Clean", value: "leaveclean", icon: "sparkles-outline" },
  { label: "No Damage to Property", value: "nodamage", icon: "warning-outline" },
  { label: "Report Any Issues Immediately", value: "reportissues", icon: "chatbox-ellipses-outline" },

  // Other popular modern rules
  { label: "No Drones Inside/On Property", value: "nodrones", icon: "airplane-outline" },
  { label: "No Open Flames / Candles", value: "noopenflames", icon: "flame-outline" },
  { label: "No Vaping Inside", value: "novaping", icon: "cloudy-outline" },
  { label: "Return Keys / Fobs on Departure", value: "returnkeys", icon: "key-outline" },
  { label: "No Unauthorized Parties", value: "nounauthorizedparties", icon: "people-outline" },
];


  const toggleAmenity = (value) => {
    setSelectedAmenities((prev) =>
      prev.includes(value) ? prev.filter((a) => a !== value) : [...prev, value]
    );
  };

  const toggleHouseRule = (value) => {
    setSelectedHouseRules((prev) =>
      prev.includes(value) ? prev.filter((a) => a !== value) : [...prev, value]
    );
  };

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
    if (!pricePerNight.trim()) {
      Alert.alert("Price Required", "Please enter price per night.");
      return;
    }
    const priceNum = parseInt(pricePerNight.replace(/[^0-9]/g, ""), 10);
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert("Invalid Price", "Please enter a valid price per night.");
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
        pricePerNight: priceNum,
        category,
        images: uploadedUrls,
        userId: user.id,
        listingType: "hotels",
        amenities: selectedAmenities,
        houseRules: selectedHouseRules,
      });

      Alert.alert(
        "Success!",
        `Your hotel/short-let listing "${title}" has been created!`,
        [
          { text: "View in Feed", onPress: () => navigation?.navigate("Home") },
          { text: "Done", style: "cancel" },
        ]
      );

      setTitle("");
      setDescription("");
      setLocation("");
      setPricePerNight("");
      setCategory(null);
      setImages([]);
      setSelectedAmenities([]);
      setSelectedHouseRules([]);
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
        <Text style={{ color: title ? (isDark ? "#e0e0e0" : "#212529") : (isDark ? "#6c757d" : "#adb5bd") }}>
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

      {/* Price Per Night */}
      <Text style={[styles.label, { color: isDark ? "#e0e0e0" : "#212529" }]}>Price Per Night (₦)</Text>
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
        value={pricePerNight}
        onChangeText={setPricePerNight}
        keyboardType="numeric"
      />

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
        <Text style={{ color: category ? (isDark ? "#e0e0e0" : "#212529") : (isDark ? "#6c757d" : "#adb5bd") }}>
          {category ? category.name : "Select a category"}
        </Text>
      </TouchableOpacity>

      {/* Amenities */}
      <Text style={[styles.label, { color: isDark ? "#e0e0e0" : "#212529" }]}>
        Amenities <Text style={{ fontWeight: "400", fontSize: 14 }}>(Optional)</Text>
      </Text>
      <View style={styles.amenitiesContainer}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {amenitiesOptions.map((item) => (
            <TouchableOpacity
              key={item.value}
              onPress={() => toggleAmenity(item.value)}
              style={[
                styles.amenityChip,
                {
                  backgroundColor: selectedAmenities.includes(item.value)
                    ? "#017a6b"
                    : isDark
                    ? "#2a2a2a"
                    : "#f0f0f0",
                },
              ]}
              activeOpacity={0.8}
            >
              <Ionicons
                name={item.icon}
                size={18}
                color={selectedAmenities.includes(item.value) ? "#000" : "#017a6b"}
              />
              <Text
                style={{
                  color: selectedAmenities.includes(item.value) ? "#000" : isDark ? "#e0e0e0" : "#000",
                  marginLeft: 8,
                  fontWeight: "600",
                  fontSize: 14,
                }}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* House Rules */}
      <Text style={[styles.label, { color: isDark ? "#e0e0e0" : "#212529" }]}>
        House Rules <Text style={{ fontWeight: "400", fontSize: 14 }}>(Optional)</Text>
      </Text>
      <View style={styles.amenitiesContainer}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {houseRulesOptions.map((rule) => (
            <TouchableOpacity
              key={rule.value}
              onPress={() => toggleHouseRule(rule.value)}
              style={[
                styles.amenityChip,
                {
                  backgroundColor: selectedHouseRules.includes(rule.value)
                    ? "#017a6b"
                    : isDark
                    ? "#2a2a2a"
                    : "#f0f0f0",
                },
              ]}
              activeOpacity={0.8}
            >
              <Ionicons
                name={rule.icon}
                size={18}
                color={selectedHouseRules.includes(rule.value) ? "#000" : "#017a6b"}
              />
              <Text
                style={{
                  color: selectedHouseRules.includes(rule.value) ? "#000" : isDark ? "#e0e0e0" : "#000",
                  marginLeft: 8,
                  fontWeight: "600",
                  fontSize: 14,
                }}
              >
                {rule.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

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
          {uploading ? "Uploading..." : "Create Hotel Listing"}
        </Text>
      </TouchableOpacity>

      {/* Title Modal */}
      <Modal visible={titleModalVisible} transparent animationType="slide" onRequestClose={() => setTitleModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={() => setTitleModalVisible(false)}>
          <View style={[styles.bottomSheet, { backgroundColor: isDark ? "#1e1e1e" : "#ffffff" }]}>
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: isDark ? "#e0e0e0" : "#212529" }]}>Select Title</Text>
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
      <Modal visible={categoryModalVisible} transparent animationType="slide" onRequestClose={() => setCategoryModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={() => setCategoryModalVisible(false)}>
          <View style={[styles.bottomSheet, { backgroundColor: isDark ? "#1e1e1e" : "#ffffff" }]}>
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: isDark ? "#e0e0e0" : "#212529" }]}>Select Category</Text>
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
  submitBtn: { marginTop: 32, paddingVertical: 16, borderRadius: 16, alignItems: "center", marginBottom: 20 },
  submitText: { color: "#fff", fontWeight: "800", fontSize: 18 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  bottomSheet: { padding: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "70%", shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "#e9ecef" },
  sheetTitle: { fontSize: 20, fontWeight: "800" },
  sheetList: { padding: 20, paddingBottom: 40 },
  optionItem: { paddingVertical: 16, paddingHorizontal: 20, borderRadius: 12, marginBottom: 8 },
  optionText: { fontSize: 16, fontWeight: "600" },
  amenitiesContainer: {
    marginTop: 16,
    marginBottom: 32,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  amenityChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 30,
  },
});

export default HotelListingForm;