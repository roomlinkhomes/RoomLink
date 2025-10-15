// components/VerifiedBadge.jsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export default function VerifiedBadge({ size = 16 }) {
  return (
    <View style={styles.container}>
      <MaterialIcons name="verified" size={size} color="#036dd6" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginLeft: 4,
    alignItems: "center",
    justifyContent: "center",
  },
});
	
