import React, { useState, useContext } from "react";
import {
  View,
  StyleSheet,
  Text,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { TextInput } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";

export default function ChangePassword({ navigation }) {
  const { changePassword } = useContext(AuthContext);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Password strength rules
  const hasMinLength = newPassword.length >= 6;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

  let strengthScore = 0;
  if (hasMinLength) strengthScore++;
  if (hasUppercase) strengthScore++;
  if (hasSpecial) strengthScore++;

  let indicatorColor = "red";
  if (strengthScore === 2) indicatorColor = "orange";
  if (strengthScore === 3) indicatorColor = "green";

  // Light theme (as per your original design)
  const theme = {
    background: "#fafafa",
    card: "#ffffff",
    text: "#1a1a1a",
    textSecondary: "#666",
    primary: "#017a6b",
    border: "#e0e6ed",
  };

  const handleSubmit = async () => {
    // 1. New password must match confirmation
    if (newPassword !== confirmPassword) {
      Alert.alert("Mismatch", "New passwords do not match.");
      return;
    }

    // 2. New password cannot be the same as current password
    if (newPassword === oldPassword && oldPassword !== "") {
      Alert.alert(
        "Invalid Choice",
        "Your new password cannot be the same as your current password.\nPlease choose a different one."
      );
      return;
    }

    // 3. Enforce minimum strength
    if (strengthScore < 3) {
      Alert.alert(
        "Password Too Weak",
        "New password must be at least 6 characters long and include:\n• One uppercase letter\n• One special character (!@#$%^&* etc.)"
      );
      return;
    }

    setLoading(true);

    try {
      await changePassword(oldPassword, newPassword);
      Alert.alert("Success", "Your password has been updated successfully.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert(
        "Change Failed",
        err.message || "Unable to update password. Please check your current password and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Minimal header – just helpful subtitle */}
          <View style={styles.header}>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Update your password securely
            </Text>
          </View>

          {/* Form card */}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {/* Current Password */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.primary} />
                <Text style={[styles.label, { color: theme.text }]}>Current Password</Text>
              </View>
              <TextInput
                value={oldPassword}
                onChangeText={setOldPassword}
                secureTextEntry={!showOld}
                mode="outlined"
                placeholder="Enter current password"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { color: theme.text }]}
                outlineColor={theme.border}
                activeOutlineColor={theme.primary}
                right={
                  <TextInput.Icon
                    icon={showOld ? "eye-off" : "eye"}
                    onPress={() => setShowOld(!showOld)}
                    color={theme.primary}
                  />
                }
              />
            </View>

            {/* New Password */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.primary} />
                <Text style={[styles.label, { color: theme.text }]}>New Password</Text>
              </View>
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNew}
                mode="outlined"
                placeholder="Enter new password"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { color: theme.text }]}
                outlineColor={theme.border}
                activeOutlineColor={theme.primary}
                right={
                  <TextInput.Icon
                    icon={showNew ? "eye-off" : "eye"}
                    onPress={() => setShowNew(!showNew)}
                    color={theme.primary}
                  />
                }
              />

              {newPassword.length > 0 && (
                <View
                  style={[
                    styles.strengthBar,
                    { backgroundColor: indicatorColor, width: `${strengthScore * 33.33}%` },
                  ]}
                />
              )}
            </View>

            {/* Confirm New Password */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.primary} />
                <Text style={[styles.label, { color: theme.text }]}>Confirm New Password</Text>
              </View>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirm}
                mode="outlined"
                placeholder="Confirm new password"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { color: theme.text }]}
                outlineColor={theme.border}
                activeOutlineColor={theme.primary}
                right={
                  <TextInput.Icon
                    icon={showConfirm ? "eye-off" : "eye"}
                    onPress={() => setShowConfirm(!showConfirm)}
                    color={theme.primary}
                  />
                }
              />
            </View>

            {/* Action Button */}
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: theme.primary }]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.buttonText}>Updating...</Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>Update Password</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Small security note at bottom */}
          <View style={styles.footerNote}>
            <Ionicons name="shield-checkmark-outline" size={16} color={theme.primary} />
            <Text style={[styles.noteText, { color: theme.textSecondary }]}>
              Your connection is encrypted
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 80,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
  card: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 8,
  },
  input: {
    fontSize: 16,
  },
  strengthBar: {
    height: 4,
    borderRadius: 2,
    marginTop: 8,
    marginHorizontal: 2,
  },
  submitButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  footerNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
    gap: 6,
  },
  noteText: {
    fontSize: 13,
    fontWeight: "500",
  },
});