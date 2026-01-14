// VendorListing.jsx — RLMARKET REBRANDED (COMPLETE FILE)
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
  items: [
    "Bed", "Bed frame", "Wardrobes", "Chair/desk", "Curtains", 
    "Bulb/Chandelier", "Rug/Carpet", "Fridge", "Gas cylinder", 
    "Blender/Mortar&Pestle", "Paints",
    "Mattress", "Bed sheets", "Pillows", "Duvet/Comforter", 
    "Mosquito net", "Fan", "Air conditioner", "Standing fan",
    "Mirror", "Dressing table", "Sofa", "Center table", 
    "TV stand", "Wall clock", "Throw pillows", "Table lamp",
    "Ceiling fan", "Inverter", "Generator", "Washing machine",
    "Microwave", "Electric kettle", "Iron/Ironing board",
    "Dining table & chairs", "Shoe rack", "Hangers", "Perfums",
  ],
},
  {
  group: "Maintenance & Repairs",
  items: [
    "Electricians", 
    "Plumbers", 
    "Carpenters", 
    "House cleaners", 
    "Laundry pickup", 
    "Appliances repair", 
    "Fumigation", 
    "Painters",

    // Electrical & Wiring
    "Wiring/Rewiring", "Generator repair", "Inverter installation", 
    "Solar panel installation", "CCTV installation", "DSTV/GOTV setup",

    // Plumbing & Water
    "Borehole drilling", "Water tank installation", "Pumping machine repair", 
    "Leak fixing", "Bathroom/Kitchen plumbing",

    // Building & Carpentry
    "Tiling/Flooring", "POP ceiling", "Door installation", 
    "Window fixing", "Roofing repair", "Aluminum windows/doors",

    // Cleaning & Pest Control
    "Deep cleaning", "Post-construction cleaning", "Tank cleaning", 
    "Mosquito netting", "Rodent control",

    // Painting & Finishing
    "Interior painting", "Exterior painting", "Screeding", 
    "Wall design/Texture painting",

    // Appliance & Electronics Repair
    "Fridge/AC repair", "Washing machine repair", "TV repair", 
    "Phone repair", "Laptop repair", "Fan repair",

    // Other Common Repairs
    "Furniture repair", "Locksmith", "Welder", "Gate automation",
  ],
},
{
  group: "Moving & Logistics",
  items: [
    "Delivery van for packing", 
    "Delivery guy",

    // Moving Services
    "House moving (small load)", "House moving (full apartment)", 
    "Office relocation", "Furniture moving", "Packing & unpacking service",

    // Vehicle Rentals
    "Truck rental (with driver)", "Pickup van rental", 
    "Bus rental (mini)", "Hiace bus rental",

    // Delivery Services
    "Bike delivery (within city)", "Car delivery (inter-state)", 
    "Food/grocery delivery", "Parcel delivery", "Document delivery",

    // Heavy Duty & Logistics
    "Container haulage", "Heavy equipment transport", 
    "Warehouse storage (short-term)", "Loading & offloading labor",

    // Inter-state & Long Distance
    "Lagos to Abuja moving", "Lagos to Port Harcourt moving", 
    "Inter-state delivery", "Airport pickup/drop-off",
  ],
},  {
  group: "Consumables",
  items: [
    "Cooking gas refills", 
    "Food stuffs", 
    "Toiletries & cleaning supply",

    // Food & Groceries
    "Rice (bag)", "Beans", "Garri", "Yam", "Plantain", 
    "Palm oil", "Vegetable oil", "Groundnut oil", 
    "Spaghetti", "Indomie", "Semovita", "Pounded yam", 
    "Tomatoes", "Pepper", "Onions", "Seasonings/Maggi",

    // Drinks & Beverages
    "Bottled water (pack)", "Soft drinks", "Malt", "Energy drinks", 
    "Pure water (sachet)", "Fruit juice",

    // Toiletries & Personal Care
    "Toilet soap", "Bath soap", "Detergent", "Bleach", 
    "Body cream/Lotion", "Shampoo", "Toothpaste", "Sanitary pads",

    // Cleaning & Household
    "Dishwashing liquid", "Disinfectant", "Insecticide", 
    "Air freshener", "Sponge/Scrubber", "Broom", "Mop",

    // Baby & Health
    "Diapers", "Baby food", "Baby wipes", "Multivitamins",
  ],
},


  {
    group: "Phones",
    items: [
      // Samsung Flagships
      "Samsung Galaxy S10+",
      "Samsung Galaxy Note 10+",
      "Samsung Galaxy S20", "Samsung Galaxy S20+", "Samsung Galaxy S20 Ultra",
      "Samsung Galaxy Note 20", "Samsung Galaxy Note 20 Ultra",
      "Samsung Galaxy S21", "Samsung Galaxy S21+", "Samsung Galaxy S21 Ultra",
      "Samsung Galaxy S22", "Samsung Galaxy S22+", "Samsung Galaxy S22 Ultra",
      "Samsung Galaxy S23", "Samsung Galaxy S23+", "Samsung Galaxy S23 Ultra",
      "Samsung Galaxy S24", "Samsung Galaxy S24+", "Samsung Galaxy S24 Ultra",
      "Samsung Galaxy S25", "Samsung Galaxy S25+", "Samsung Galaxy S25 Ultra",

      // Samsung Folds & Flips
      "Samsung Galaxy Fold",
      "Samsung Galaxy Z Fold 2", "Samsung Galaxy Z Fold 3", "Samsung Galaxy Z Fold 4",
      "Samsung Galaxy Z Fold 5", "Samsung Galaxy Z Fold 6", "Samsung Galaxy Z Fold 7",
      "Samsung Galaxy Z Flip", "Samsung Galaxy Z Flip 3", "Samsung Galaxy Z Flip 4",
      "Samsung Galaxy Z Flip 5", "Samsung Galaxy Z Flip 6", "Samsung Galaxy Z Flip 7",

      // iPhone (XS era to latest 2025)
      "iPhone XS", "iPhone XS Max", "iPhone XR",
      "iPhone 11", "iPhone 11 Pro", "iPhone 11 Pro Max",
      "iPhone 12", "iPhone 12 Mini", "iPhone 12 Pro", "iPhone 12 Pro Max",
      "iPhone 13", "iPhone 13 Mini", "iPhone 13 Pro", "iPhone 13 Pro Max",
      "iPhone 14", "iPhone 14 Plus", "iPhone 14 Pro", "iPhone 14 Pro Max",
      "iPhone 15", "iPhone 15 Plus", "iPhone 15 Pro", "iPhone 15 Pro Max",
      "iPhone 16", "iPhone 16 Plus", "iPhone 16 Pro", "iPhone 16 Pro Max",
      "iPhone 17", "iPhone 17 Plus", "iPhone 17 Pro", "iPhone 17 Pro Max",
      "iPhone 17 Air",

      // Other Brands (Latest Flagships)
      "Tecno Phantom X", "Tecno Phantom X2", "Tecno Phantom V Fold",
      "Tecno Camon 30 Premier", "Tecno Camon 40 Series",

      "Oppo Find X8", "Oppo Find X8 Pro", "Oppo Reno 12 Series",

      "Vivo X100 Series", "Vivo X Fold 3",

      "Itel S24", "Itel P55 Series",

      "Xiaomi 14", "Xiaomi 14 Ultra", "Xiaomi 15",
      "Redmi Note 13 Pro+", "Redmi Note 14 Pro+",
      "Poco F6", "Poco X7 Pro",
    ],
  },


  {
  group: "Lifestyle",
  items: [
    "TV", 
    "Game/pads", 
    "Gym equipment", 
    "Outdoor chairs", 
    "Sound systems",

    // Entertainment & Tech
    "Home theater system", "Bluetooth speaker", "Headphones/Earbuds", 
    "Smart watch", "Fitness tracker", "Projector", "Gaming console", 
    "PlayStation", "Xbox", "Nintendo Switch", "Drone", "Camera", 
    "Ring light", "Tripod", "Wireless charger", "Power bank",

    // Fitness & Wellness
    "Yoga mat", "Dumbbells", "Treadmill", "Exercise bike", 
    "Massage gun", "Air purifier", "Humidifier", "Aromatherapy diffuser",

    // Outdoor & Leisure
    "Electric scooter", "Bicycle", "Camping tent", "Portable grill", "Cooler box",

    // Home Comfort & Style
    "Wall art/Frames", "Decorative lights", "Laptop stand",
  ],
},
];

export default function VendorListing() {
  const { addVendorListing } = useVendorListing();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  
  // 🆕 RLMARKET COLORS
  const textColor = isDark ? "#e0e0e0" : "#212529";
  const bgColor = isDark ? "#121212" : "#fafafa";
  const cardBg = isDark ? "#1e1e1e" : "#ffffff";
  const borderColor = isDark ? "#333" : "#e0e6ed";

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
      contentContainerStyle={[styles.container, { backgroundColor: bgColor }]}
      keyboardShouldPersistTaps="handled"
      extraScrollHeight={Platform.OS === "ios" ? 100 : 120}
      enableOnAndroid
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 80}
      showsVerticalScrollIndicator={false}
    >
      {/* 🆕 RLMARKET GALLERY CARD */}
      <TouchableOpacity 
        style={[
          styles.galleryCard, 
          { 
            backgroundColor: cardBg,
            borderColor: borderColor,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 4,
          }
        ]} 
        onPress={pickImages}
        activeOpacity={0.9}
      >
        <View style={styles.galleryIconContainer}>
          <Ionicons name="images-outline" size={40} color="#017a6b" />
        </View>
        <Text style={[styles.galleryCardText, { color: textColor }]}>Select from Gallery</Text>
        <Text style={styles.galleryCardSubtext}>Tap to add photos</Text>
      </TouchableOpacity>

      {/* 🆕 RLMARKET CAMERA BUTTON */}
      <View style={styles.photoRow}>
        <TouchableOpacity
          style={[
            styles.photoBtn, 
            { 
              backgroundColor: cardBg,
              borderColor: "#017a6b",
              shadowColor: "#017a6b",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 3,
            }
          ]}
          onPress={openCamera}
          activeOpacity={0.85}
        >
          <Ionicons name="camera-outline" size={20} color="#017a6b" />
          <Text style={styles.photoText}>Take Photo</Text>
        </TouchableOpacity>
      </View>

      {/* 🆕 FIXED THUMBNAILS */}
      {images.length > 0 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.thumbScroll}
          contentContainerStyle={{ paddingVertical: 8 }}
        >
          {images.map((uri, i) => (
            <View key={`${uri}-${i}`} style={styles.thumbWrap}>
              <Image source={{ uri }} style={styles.thumb} />
              <TouchableOpacity 
                style={styles.removeBtn} 
                onPress={() => removeImage(uri)}
                activeOpacity={0.7}
              >
                <View style={styles.removeBtnBg}>
                  <Ionicons name="close" size={20} color="#fff" />
                </View>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* 🆕 RLMARKET FORM FIELDS */}
      <Text style={[styles.label, { color: textColor }]}>Category</Text>
      <TouchableOpacity 
        style={[
          styles.inputCard, 
          { 
            backgroundColor: cardBg,
            borderColor: borderColor,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }
        ]} 
        onPress={() => setCategoryModalVisible(true)}
        activeOpacity={0.95}
      >
        <Text style={[styles.inputText, { color: category ? textColor : (isDark ? "#6c757d" : "#adb5bd") }]}>
          {category || "Select Category"}
        </Text>
      </TouchableOpacity>

      <Text style={[styles.label, { color: textColor }]}>Select Item / Service</Text>
      <TouchableOpacity 
        style={[
          styles.inputCard, 
          { 
            backgroundColor: cardBg,
            borderColor: borderColor,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }
        ]} 
        onPress={() => { 
          if (!category) return Alert.alert("Select category first"); 
          setTitleModalVisible(true); 
        }}
        activeOpacity={0.95}
      >
        <Text style={[styles.inputText, { color: title ? textColor : (isDark ? "#6c757d" : "#adb5bd") }]}>
          {title || "Select Item"}
        </Text>
      </TouchableOpacity>

      <Text style={[styles.label, { color: textColor }]}>Description</Text>
      <TextInput
        style={[
          styles.inputCard, 
          styles.textArea, 
          { 
            backgroundColor: cardBg,
            borderColor: borderColor,
            color: textColor,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }
        ]}
        placeholder="Describe the product or service..."
        placeholderTextColor={isDark ? "#6c757d" : "#adb5bd"}
        value={description}
        onChangeText={setDescription}
        multiline
        textAlignVertical="top"
      />

      <Text style={[styles.label, { color: textColor }]}>Location</Text>
      <TextInput
        style={[
          styles.inputCard, 
          { 
            backgroundColor: cardBg,
            borderColor: borderColor,
            color: textColor,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }
        ]}
        placeholder="City or Area"
        placeholderTextColor={isDark ? "#6c757d" : "#adb5bd"}
        value={location}
        onChangeText={setLocation}
      />

      <Text style={[styles.label, { color: textColor }]}>Price (₦)</Text>
      <TextInput
        style={[
          styles.inputCard, 
          { 
            backgroundColor: cardBg,
            borderColor: borderColor,
            color: textColor,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }
        ]}
        placeholder="e.g. 250,000"
        placeholderTextColor={isDark ? "#6c757d" : "#adb5bd"}
        value={price}
        onChangeText={handlePriceChange}
        keyboardType="numeric"
      />

      {/* 🆕 RLMARKET SUBMIT BUTTON */}
      <TouchableOpacity 
        style={[
          styles.submitBtn, 
          { 
            backgroundColor: "#017a6b",
            shadowColor: "#017a6b",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 8,
            opacity: uploading ? 0.7 : 1
          }
        ]} 
        onPress={submitForm} 
        disabled={uploading}
        activeOpacity={0.9}
      >
        <Text style={styles.submitText}>
          {uploading ? "Uploading..." : "Create Vendor Listing"}
        </Text>
      </TouchableOpacity>

      {/* 🆕 RLMARKET CATEGORY MODAL */}
      <Modal visible={categoryModalVisible} animationType="slide" transparent onRequestClose={() => setCategoryModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={() => setCategoryModalVisible(false)}>
          <View style={[styles.bottomSheet, { backgroundColor: cardBg }]}>
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: textColor }]}>Select Category</Text>
              <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
                <Ionicons name="close-outline" size={24} color={isDark ? "#a0a0a0" : "#6c757d"} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {presetTitles.map((group) => (
                <TouchableOpacity 
                  key={group.group} 
                  style={[
                    styles.sheetRow, 
                    { 
                      backgroundColor: category === group.group ? "rgba(1,122,107,0.1)" : "transparent",
                      borderColor: category === group.group ? "#017a6b" : borderColor
                    }
                  ]}
                  onPress={() => { 
                    setCategory(group.group); 
                    setTitle(null); 
                    setCategoryModalVisible(false); 
                  }}
                >
                  <Text style={[styles.sheetText, { color: textColor }]}>{group.group}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 🆕 RLMARKET TITLE MODAL */}
      <Modal visible={titleModalVisible} animationType="slide" transparent onRequestClose={() => setTitleModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={() => setTitleModalVisible(false)}>
          <View style={[styles.bottomSheet, { backgroundColor: cardBg }]}>
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: textColor }]}>
                Select Item / Service
              </Text>
              <TouchableOpacity onPress={() => setTitleModalVisible(false)}>
                <Ionicons name="close-outline" size={24} color={isDark ? "#a0a0a0" : "#6c757d"} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {filteredTitles.map((item) => (
                <TouchableOpacity 
                  key={item} 
                  style={[
                    styles.sheetRow, 
                    { 
                      backgroundColor: title === item ? "rgba(1,122,107,0.1)" : "transparent",
                      borderColor: title === item ? "#017a6b" : borderColor
                    }
                  ]}
                  onPress={() => { 
                    setTitle(item); 
                    setTitleModalVisible(false); 
                  }}
                >
                  <Text style={[styles.sheetText, { color: textColor }]}>{item}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flexGrow: 1, 
    padding: 20, 
    paddingBottom: 40 
  },

  // 🆕 RLMARKET GALLERY CARD
  galleryCard: { 
    height: 160,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center", 
    justifyContent: "center", 
    marginBottom: 20,
    padding: 24
  },
  galleryIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: "rgba(1,122,107,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12
  },
  galleryCardText: { 
    fontSize: 18, 
    fontWeight: "700",
    marginBottom: 4
  },
  galleryCardSubtext: {
    fontSize: 14,
    color: "#868e96",
    fontWeight: "500"
  },

  photoRow: { 
    alignItems: "flex-end", 
    marginVertical: 16 
  },
  photoBtn: { 
    flexDirection: "row", 
    alignItems: "center", 
    borderWidth: 2, 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    borderRadius: 12,
    minWidth: 120,
    justifyContent: "center"
  },
  photoText: { 
    marginLeft: 8, 
    fontWeight: "700", 
    fontSize: 15,
    color: "#017a6b"
  },

  // 🆕 FIXED THUMBNAILS
  thumbScroll: { 
    marginBottom: 24 
  },
  thumbWrap: { 
    position: "relative", 
    marginRight: 12 
  },
  thumb: { 
    width: 100, 
    height: 100, 
    borderRadius: 16,
    borderWidth: 3,
    borderColor: "#e0e6ed"
  },
  removeBtn: { 
    position: "absolute",
    top: -12,
    right: -12,
    zIndex: 10,
  },
  removeBtnBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ff4757",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },

  label: { 
    fontWeight: "800", 
    fontSize: 16,
    marginTop: 24, 
    marginBottom: 8 
  },
  inputCard: { 
    borderWidth: 1, 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 16,
    fontSize: 16
  },
  inputText: {
    fontSize: 16,
    fontWeight: "500"
  },
  textArea: { 
    height: 100, 
    textAlignVertical: "top" 
  },

  // 🆕 RLMARKET SUBMIT BUTTON
  submitBtn: { 
    marginTop: 32, 
    paddingVertical: 16, 
    borderRadius: 16, 
    alignItems: "center",
    marginBottom: 20
  },
  submitText: { 
    color: "#fff", 
    fontWeight: "800", 
    fontSize: 18 
  },

  // 🆕 RLMARKET MODALS
  modalOverlay: { 
    flex: 1, 
    justifyContent: "flex-end", 
    backgroundColor: "rgba(0,0,0,0.4)" 
  },
  bottomSheet: { 
    padding: 0,
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    maxHeight: "70%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef"
  },
  sheetTitle: { 
    fontSize: 20, 
    fontWeight: "800" 
  },
  sheetRow: { 
    paddingVertical: 16, 
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderColor: "#e9ecef"
  },
  sheetText: { 
    fontSize: 16, 
    fontWeight: "600" 
  },
});