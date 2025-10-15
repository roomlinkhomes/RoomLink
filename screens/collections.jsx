import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function Collection() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Collection Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  text: {
    fontSize: 18,
    fontWeight: "bold",
  },
});
	
