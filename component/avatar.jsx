
// components/Avatar.jsx
import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";

const letterColors = {
  A: "#F44336", B: "#E91E63", C: "#9C27B0", D: "#673AB7", E: "#3F51B5",
  F: "#2196F3", G: "#03A9F4", H: "#00BCD4", I: "#009688", J: "#4CAF50",
  K: "#8BC34A", L: "#CDDC39", M: "#FFEB3B", N: "#FFC107", O: "#FF9800",
  P: "#FF5722", Q: "#795548", R: "#9E9E9E", S: "#607D8B", T: "#F44336",
  U: "#E91E63", V: "#9C27B0", W: "#673AB7", X: "#3F51B5", Y: "#2196F3", Z: "#03A9F4",
};

export default function Avatar({
  name = "User",
  avatarUrl,
  uri,
  source,
  listingImages = [],
  size = 80,
  rounded = true,
  style,
}) {
  const firstLetter = name[0]?.toUpperCase?.() || "U";
  const bgColor = letterColors[firstLetter] || "#888";

  // Auto-pick in priority order
  const imageSource =
    source ||
    (uri ? { uri } : null) ||
    (avatarUrl ? { uri: avatarUrl } : null) ||
    (listingImages.length > 0 ? { uri: listingImages[0] } : null);

  if (imageSource) {
    return (
      <Image
        source={imageSource}
        style={[
          { width: size, height: size, borderRadius: rounded ? size / 2 : 10 },
          style,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.placeholder,
        {
          backgroundColor: bgColor,
          width: size,
          height: size,
          borderRadius: rounded ? size / 2 : 10,
        },
        style,
      ]}
    >
      <Text style={[styles.letter, { fontSize: size / 2 }]}>{firstLetter}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: { justifyContent: "center", alignItems: "center" },
  letter: { color: "white", fontWeight: "bold" },
});
	
