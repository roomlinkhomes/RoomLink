import React, { useState } from "react";
import { View, StyleSheet, Text, TouchableOpacity, Alert } from "react-native";
import { TextInput, Button } from "react-native-paper";

export default function ForgotPassword({ navigation }) {
  const [usePhone, setUsePhone] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState("");

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleReset = () => {
    if (!identifier) {
      setError("Please enter your email or phone number.");
      return;
    }

    if (!usePhone && !validateEmail(identifier)) {
      setError("Please enter a valid email address.");
      return;
    }

    setError("");
    console.log("Password reset requested for:", identifier);
    Alert.alert("Reset Requested", `Instructions sent to ${identifier}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter your email address to change you password</Text>

      {/* Email or Phone */}
      <TextInput
        label={usePhone ? "Phone Number" : "Email Address"}
        value={identifier}
        onChangeText={setIdentifier}
        mode="outlined"
        style={styles.input}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* Reset Password Button */}
      <Button
        mode="contained"
        onPress={handleReset}
        style={styles.resetButton}
        labelStyle={{ color: "white" }}
      >
        Reset Password
      </Button>

      {/* Switch between email / phone */}
      <TouchableOpacity onPress={() => setUsePhone(!usePhone)}>
        <Text style={styles.switchText}>
          {usePhone ? "Use Email instead" : "Use Phone instead"}
        </Text>
      </TouchableOpacity>

      {/* Link back to login */}
      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.link}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "up",
    backgroundColor: "gray",
  },
  title: {
    fontSize: 15,
    fontWeight: "small",
    textAlign: "left",
    marginBottom: 20,
  },
  input: {
    marginBottom: 5,
  },
  resetButton: {
    backgroundColor: "#036dd6",
    paddingVertical: 5,
    marginTop: 10,
  },
  switchText: {
    marginTop: 15,
    color: "black",
    textAlign: "center",
  },
  link: {
    marginTop: 10,
    color: "#036dd6",
    textAlign: "center",
  },
  error: {
    color: "red",
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 4,
  },
});
	
