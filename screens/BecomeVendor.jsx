import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from "react-native";

export default function BecomeVendor({ navigation }) {
  const [form, setForm] = useState({
    fullName: "",
    business: "",
    occupation: "",
    accountNumber: "",
    bankName: "",
  });

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const handleSubmit = () => {
    // Here you’d normally send form data to backend
    console.log("Vendor Form Submitted:", form);
    alert("Your vendor application has been submitted!");
    navigation.goBack(); // go back to profile
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Become a Vendor</Text>
      <Text style={styles.subtitle}>
        Fill in the details below to register as a vendor on RoomLink
      </Text>

      {/* Full Name */}
      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={form.fullName}
        onChangeText={(val) => handleChange("fullName", val)}
      />

      {/* Business Name */}
      <TextInput
        style={styles.input}
        placeholder="Business Name"
        value={form.business}
        onChangeText={(val) => handleChange("business", val)}
      />

      {/* Occupation */}
      <TextInput
        style={styles.input}
        placeholder="Occupation"
        value={form.occupation}
        onChangeText={(val) => handleChange("occupation", val)}
      />

      {/* Account Number */}
      <TextInput
        style={styles.input}
        placeholder="Account Number"
        keyboardType="numeric"
        value={form.accountNumber}
        onChangeText={(val) => handleChange("accountNumber", val)}
      />

      {/* Bank Name */}
      <TextInput
        style={styles.input}
        placeholder="Bank Name"
        value={form.bankName}
        onChangeText={(val) => handleChange("bankName", val)}
      />

      {/* Submit Button */}
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Submit Application</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#555",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    marginBottom: 16,
    backgroundColor: "#f9f9f9",
  },
  button: {
    backgroundColor: "#111",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
