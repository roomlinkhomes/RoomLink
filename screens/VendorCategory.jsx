import React from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";

export default function VendorCategory({ navigation }) {
  const categories = [
    "House Hold Materials",
    "Electronics",
    "Car Dealership",
    "Painter",
    "Electrician",
    "Fashion Designer",
    "Others",
  ];

  const handleSelectCategory = (category) => {
    console.log("Selected Category:", category);
    // ✅ Navigate into the Tab.Navigator -> Vendor screen
    navigation.navigate("HomeTabs", { screen: "Vendor", params: { category } });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>What do you offer?</Text>

      {categories.map((category) => (
        <TouchableOpacity
          key={category}
          style={styles.categoryButton}
          onPress={() => handleSelectCategory(category)}
        >
          <Text style={styles.categoryText}>{category}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5", // ✅ real color instead of "ash"
  },
  title: {
    fontSize: 22,
    fontWeight: "600", // ✅ valid weight instead of "small"
    textAlign: "center",
    marginBottom: 20,
  },
  categoryButton: {
    backgroundColor: "#036dd6",
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: "center",
  },
  categoryText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
	
