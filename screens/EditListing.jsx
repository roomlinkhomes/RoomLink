// screens/EditListing.jsx
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
  Keyboard,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { ListingContext } from "../context/ListingContext";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useUser } from "../context/UserContext"; // 👈 import user context

export default function EditListing({ route, navigation }) {
  const { listing } = route.params;
  const { updateListing } = useContext(ListingContext);
  const { user } = useUser(); // 👈 get user
  const isPremium = user?.isPremium; // 👈 check premium status

  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const [title, setTitle] = useState(listing.title);
  const [price, setPrice] = useState(listing.price.toString());
  const [location, setLocation] = useState(listing.location || "");
  const [category, setCategory] = useState(listing.category || "");
  const [description, setDescription] = useState(listing.description || "");
  const [images, setImages] = useState(listing.images || []);

  // Pick a new image
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  // Remove an image
  const removeImage = (index) => {
    const updated = images.filter((_, i) => i !== index);
    setImages(updated);
  };

  const handleSave = () => {
    if (!title || !price || !location) {
      Alert.alert("Error", "Title, price and location are required");
      return;
    }

    const updated = {
      ...listing,
      title,
      price: Number(price),
      location,
      category,
      description,
      images,
    };

    updateListing(updated);
    Alert.alert("Success", "Listing updated successfully");
    navigation.goBack();
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
      <KeyboardAwareScrollView
        contentContainerStyle={styles.container}
        enableOnAndroid={true}
        extraScrollHeight={80}
      >
        <Text style={[styles.label, { color: isDarkMode ? "#fff" : "#000" }]}>
          Title
        </Text>
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
          returnKeyType="done"
          blurOnSubmit={true}
          onSubmitEditing={() => Keyboard.dismiss()}
          multiline={false}
        />

        <Text style={[styles.label, { color: isDarkMode ? "#fff" : "#000" }]}>
          Price
        </Text>
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
          returnKeyType="done"
          blurOnSubmit={true}
          onSubmitEditing={() => Keyboard.dismiss()}
          multiline={false}
        />

        <Text style={[styles.label, { color: isDarkMode ? "#fff" : "#000" }]}>
          Location
        </Text>
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
          returnKeyType="done"
          blurOnSubmit={true}
          onSubmitEditing={() => Keyboard.dismiss()}
          multiline={false}
        />

        <Text style={[styles.label, { color: isDarkMode ? "#fff" : "#000" }]}>
          Category
        </Text>
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
          returnKeyType="done"
          blurOnSubmit={true}
          onSubmitEditing={() => Keyboard.dismiss()}
          multiline={false}
        />

        <Text style={[styles.label, { color: isDarkMode ? "#fff" : "#000" }]}>
          Description
        </Text>
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
          returnKeyType="done"
          blurOnSubmit={true}
          onSubmitEditing={() => Keyboard.dismiss()}
        />

        <Text style={[styles.label, { color: isDarkMode ? "#fff" : "#000" }]}>
          Images
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {images.map((img, idx) => (
            <View key={idx} style={styles.imageContainer}>
              <Image source={{ uri: img }} style={styles.image} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeImage(idx)}
              >
                <Text style={{ color: "white", fontSize: 12 }}>X</Text>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity style={styles.addImage} onPress={pickImage}>
            <Text style={{ color: "#036dd6", fontWeight: "bold" }}>+ Add</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAwareScrollView>

      {/* Footer with fixed action button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={handlePremiumSave}>
          <Text style={styles.buttonText}>Save Changes</Text>
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
    paddingVertical: 8,
    paddingHorizontal: 120,
    borderRadius: 50,
    alignSelf: "center",
    minWidth: "60%",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
