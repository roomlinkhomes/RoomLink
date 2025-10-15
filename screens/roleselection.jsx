import React from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";

export default function RoleSelection({ navigation }) {
  const roles = ["Vendor", "Landlord", "Real Estate", "Student"];

  const handleSelectRole = (role) => {
    if (role === "Vendor") {
      navigation.navigate("VendorCategory");
    } else {
      navigation.navigate("HomeTabs"); // ✅ main home
    }
  };

  return (
    <View style={styles.container}>
      {/* Skip Button */}
      <TouchableOpacity
        style={styles.skipButton}
        onPress={() => navigation.navigate("HomeTabs")}
      >
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Role Options */}
      {roles.map((role) => (
        <TouchableOpacity
          key={role}
          style={styles.roleButton}
          onPress={() => handleSelectRole(role)}
        >
          <Text style={styles.roleText}>{role}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "flex-start", // ✅ fixed
    backgroundColor: "white",
  },
  skipButton: {
    position: "absolute",
    top: 20,
    right: 20,
  },
  skipText: {
    color: "#036dd6",
    fontWeight: "bold",
  },
  title: {
    fontSize: 22,
    fontWeight: "normal", // ✅ fixed
    textAlign: "center",
    marginBottom: 40,
  },
  roleButton: {
    backgroundColor: "#036dd6",
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: "center",
  },
  roleText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
	
