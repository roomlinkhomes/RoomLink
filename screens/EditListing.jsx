// screens/EditListing.jsx — FINAL: Full backend save to Firestore + premium check + syntax fixed
import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  useColorScheme,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { ListingContext } from "../context/ListingContext";
import { useUser } from "../context/UserContext";
import { db } from "../firebaseConfig";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

export default function EditListing({ route, navigation }) {
  const { listing } = route.params;
  const { updateListing } = useContext(ListingContext);
  const { user } = useUser();
  const isPremium = user?.isPremium || false;
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const [title, setTitle] = useState(listing.title || "");
  const [price, setPrice] = useState(listing.price?.toString() || "");
  const [location, setLocation] = useState(listing.location || "");
  const [category, setCategory] = useState(listing.category || "");
  const [description, setDescription] = useState(listing.description || "");
  const [images, setImages] = useState(listing.images || []);
  const [uploading, setUploading] = useState(false);

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
      Alert.alert("Upload Error", "Image upload failed.");
      return null;
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setUploading(true);
      const url = await uploadImage(result.assets[0].uri);
      setUploading(false);
      if (url) {
        setImages([...images, url]);
      }
    }
  };

  const removeImage = (index) => {
    const updated = images.filter((_, i) => i !== index);
    setImages(updated);
  };

  const handleSave = async () => {
    if (!title || !price || !location) {
      Alert.alert("Error", "Title, price and location are required");
      return;
    }

    const priceNum = Number(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert("Error", "Enter a valid price");
      return;
    }

    setUploading(true);
    try {
      // Update Firestore
      await updateDoc(doc(db, "listings", listing.id), {
        title,
        price: priceNum,
        location,
        category,
        description,
        images,
        updatedAt: serverTimestamp(),
      });

      // Update local context
      updateListing({
        id: listing.id,
        title,
        price: priceNum,
        location,
        category,
        description,
        images,
      });

      Alert.alert("Success", "Listing updated successfully!");
      navigation.goBack();
    } catch (err) {
      console.error("Update error:", err);
      Alert.alert("Error", "Failed to update listing. Try again.");
    } finally {
      setUploading(false);
    }
  };

  const handlePremiumSave = () => {
    if (!isPremium) {
      Alert.alert(
        "Premium Feature",
        "Editing listings is available for premium users only.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Go Premium",
            onPress: () => navigation.navigate("GetVerified"),
          },
        ]
      );
      return;
    }
    handleSave();
  };

  return (
    <View style={{ flex: 1, backgroundColor: isDarkMode ? "#000" : "#fff" }}>
      <KeyboardAwareScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.label, { color: isDarkMode ? "#fff" : "#000" }]}>Title</Text>
        <TextInput
          style={[
            styles.input,
            {
              color: isDarkMode ? "#fff" : "#000",
              borderColor: isDarkMode ? "#444" : "#ccc",
              backgroundColor: isDarkMode ? "#111" : "#f9f9f9",
            },
          ]}
          placeholder="Enter title"
          placeholderTextColor={isDarkMode ? "#888" : "#666"}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={[styles.label, { color: isDarkMode ? "#fff" : "#000" }]}>Price</Text>
        <TextInput
          style={[
            styles.input,
            {
              color: isDarkMode ? "#fff" : "#000",
              borderColor: isDarkMode ? "#444" : "#ccc",
              backgroundColor: isDarkMode ? "#111" : "#f9f9f9",
            },
          ]}
          placeholder="Enter price"
          placeholderTextColor={isDarkMode ? "#888" : "#666"}
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
        />

        <Text style={[styles.label, { color: isDarkMode ? "#fff" : "#000" }]}>Location</Text>
        <TextInput
          style={[
            styles.input,
            {
              color: isDarkMode ? "#fff" : "#000",
              borderColor: isDarkMode ? "#444" : "#ccc",
              backgroundColor: isDarkMode ? "#111" : "#f9f9f9",
            },
          ]}
          placeholder="Enter location"
          placeholderTextColor={isDarkMode ? "#888" : "#666"}
          value={location}
          onChangeText={setLocation}
        />

        <Text style={[styles.label, { color: isDarkMode ? "#fff" : "#000" }]}>Category</Text>
        <TextInput
          style={[
            styles.input,
            {
              color: isDarkMode ? "#fff" : "#000",
              borderColor: isDarkMode ? "#444" : "#ccc",
              backgroundColor: isDarkMode ? "#111" : "#f9f9f9",
            },
          ]}
          placeholder="Enter category"
          placeholderTextColor={isDarkMode ? "#888" : "#666"}
          value={category}
          onChangeText={setCategory}
        />

        <Text style={[styles.label, { color: isDarkMode ? "#fff" : "#000" }]}>Description</Text>
        <TextInput
          style={[
            styles.input,
            {
              height: 100,
              color: isDarkMode ? "#fff" : "#000",
              borderColor: isDarkMode ? "#444" : "#ccc",
              backgroundColor: isDarkMode ? "#111" : "#f9f9f9",
            },
          ]}
          placeholder="Enter description"
          placeholderTextColor={isDarkMode ? "#888" : "#666"}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Text style={[styles.label, { color: isDarkMode ? "#fff" : "#000" }]}>Images</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {images.map((img, idx) => (
            <View key={idx} style={styles.imageContainer}>
              <Image source={{ uri: img }} style={styles.image} />
              <TouchableOpacity style={styles.removeButton} onPress={() => removeImage(idx)}>
                <Text style={{ color: "white", fontSize: 12 }}>X</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.addImage} onPress={pickImage} disabled={uploading}>
            <Text style={{ color: "#036dd6", fontWeight: "bold" }}>
              {uploading ? "Uploading..." : "+ Add"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAwareScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={handlePremiumSave} disabled={uploading}>
          <Text style={styles.buttonText}>
            {uploading ? "Saving..." : "Save Changes"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flexGrow: 1,
  },
  label: {
    fontWeight: "bold",
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginTop: 5,
    fontSize: 16,
  },
  imageContainer: {
    marginRight: 10,
    position: "relative",
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeButton: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 12,
    padding: 3,
  },
  addImage: {
    width: 100,
    height: 100,
    borderWidth: 1,
    borderColor: "#036dd6",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderColor: "#222",
    backgroundColor: "transparent",
  },
  button: {
    backgroundColor: "#036dd6",
    paddingVertical: 15,
    borderRadius: 50,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});