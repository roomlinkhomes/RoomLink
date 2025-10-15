import React, { useState, useContext } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { TextInput, Button } from "react-native-paper";
import { AuthContext } from "../context/AuthContext";

export default function ChangePassword({ navigation }) {
  const { changePassword } = useContext(AuthContext);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ✅ password rules
  const hasMinLength = newPassword.length >= 6;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

  // ✅ calculate strength score
  let strengthScore = 0;
  if (hasMinLength) strengthScore++;
  if (hasUppercase) strengthScore++;
  if (hasSpecial) strengthScore++;

  // ✅ map score to color
  let indicatorColor = "red";
  if (strengthScore === 2) indicatorColor = "orange";
  if (strengthScore === 3) indicatorColor = "green";

  const handleSubmit = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match.");
      return;
    }

    if (strengthScore < 3) {
      Alert.alert(
        "Weak Password",
        "Password must be at least 6 characters, include one uppercase letter and one special character."
      );
      return;
    }

    setLoading(true);
    try {
      await changePassword(oldPassword, newPassword);
      Alert.alert("Success", "Password changed successfully.");
      navigation.goBack();
    } catch (err) {
      Alert.alert("Error", err.toString());
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Old Password - visible */}
      <TextInput
        label="Old Password"
        value={oldPassword}
        onChangeText={setOldPassword}
        secureTextEntry={false}
        style={styles.input}
        mode="outlined"
        left={<TextInput.Icon icon="lock" />}
      />

      {/* New Password */}
      <TextInput
        label="New Password"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry={!showNew}
        style={styles.input}
        mode="outlined"
        left={<TextInput.Icon icon="lock" />}
        right={
          <TextInput.Icon
            icon={showNew ? "eye-off" : "eye"}
            onPress={() => setShowNew(!showNew)}
          />
        }
      />

      {/* ✅ show progressive indicator only when typing */}
      {newPassword.length > 0 && (
        <View
          style={[
            styles.indicator,
            { backgroundColor: indicatorColor, width: `${strengthScore * 33.3}%` },
          ]}
        />
      )}

      {/* Confirm Password */}
      <TextInput
        label="Confirm New Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry={!showConfirm}
        style={styles.input}
        mode="outlined"
        left={<TextInput.Icon icon="lock" />}
        right={
          <TextInput.Icon
            icon={showConfirm ? "eye-off" : "eye"}
            onPress={() => setShowConfirm(!showConfirm)}
          />
        }
      />

      {/* Submit Button */}
      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={loading}
        disabled={loading}
        style={styles.button}
        labelStyle={styles.buttonLabel}
      >
        Change
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
  },
  input: {
    marginBottom: 15,
    backgroundColor: "#f0f0f0",
    borderRadius: 30, // iOS pill style
  },
  indicator: {
    height: 6,
    borderRadius: 3,
    marginBottom: 15,
    marginHorizontal: 5,
    alignSelf: "flex-start", // keeps it left-aligned like a progress bar
  },
  button: {
    backgroundColor: "#036dd6",
    marginTop: 15,
    alignSelf: "center",
    borderRadius: 25,
    width: 350,
    height: 40,
    justifyContent: "center",
  },
  buttonLabel: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
});
