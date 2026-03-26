// screens/ChangeEmail.jsx
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

// Native Firebase Auth
import auth from '@react-native-firebase/auth';
import { EmailAuthProvider } from '@react-native-firebase/auth';

export default function ChangeEmail({ navigation }) {
  const { user } = useContext(AuthContext); // Only for presence check + email comparison

  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const theme = {
    background: "#fafafa",
    card: "#ffffff",
    text: "#1a1a1a",
    textSecondary: "#666",
    primary: "#017a6b",
    border: "#e0e6ed",
  };

  const isValidEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSubmit = async () => {
    if (newEmail !== confirmEmail) {
      Alert.alert("Mismatch", "New email addresses do not match.");
      return;
    }

    if (!isValidEmail(newEmail)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    if (newEmail.trim().toLowerCase() === user?.email?.toLowerCase()) {
      Alert.alert("No Change", "This is already your current email.");
      return;
    }

    if (!currentPassword) {
      Alert.alert("Required", "Please enter your current password to verify.");
      return;
    }

    if (!user) {
      Alert.alert("Error", "No authenticated user found. Please log in again.");
      return;
    }

    setLoading(true);

    try {
      // Get the LIVE Firebase User instance (has all methods: reauthenticateWithCredential, updateEmail, etc.)
      const currentUser = auth().currentUser;

      if (!currentUser) {
        throw new Error("No current authenticated user found. Please sign in again.");
      }

      // Use currentUser.email (matches context user.email if everything is in sync)
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);

      // 1. Re-authenticate (required for email change)
      await currentUser.reauthenticateWithCredential(credential);
      console.log("Re-authentication successful");

      // 2. Update email
      await currentUser.updateEmail(newEmail);
      console.log("Email updated to:", newEmail);

      // 3. Send verification email to new address
      await currentUser.sendEmailVerification();
      console.log("Verification email sent");

      Alert.alert(
        "Success",
        "Your email has been updated!\n\nA verification email has been sent to the new address. Please verify it soon.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );

      // Optional: reload user to get updated emailVerified, etc.
      // await currentUser.reload();
      // If your context doesn't auto-update via onAuthStateChanged, call updateUser({ email: newEmail, emailVerified: false }) here

    } catch (err) {
      console.error("Change email error:", err);

      let message = "Failed to update email. Please try again.";
      if (err.code) {
        switch (err.code) {
          case "auth/wrong-password":
            message = "Incorrect current password.";
            break;
          case "auth/requires-recent-login":
            message = "Your session is too old. Please log out and log back in.";
            break;
          case "auth/email-already-in-use":
            message = "This email is already in use by another account.";
            break;
          case "auth/invalid-email":
            message = "Invalid email format.";
            break;
          case "auth/user-not-found":
          case "auth/user-disabled":
            message = "Account issue. Contact support.";
            break;
          default:
            message = err.message || err.code || "Unknown error";
        }
      } else {
        message = err.message || "Unknown error";
      }

      Alert.alert("Error", message);
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
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Update your email address securely
            </Text>
          </View>

          {/* Form */}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {/* Current Password */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.primary} />
                <Text style={[styles.label, { color: theme.text }]}>Current Password</Text>
              </View>
              <TextInput
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={!showPassword}
                mode="outlined"
                placeholder="Enter your current password"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { color: theme.text }]}
                outlineColor={theme.border}
                activeOutlineColor={theme.primary}
                right={
                  <TextInput.Icon
                    icon={showPassword ? "eye-off" : "eye"}
                    onPress={() => setShowPassword(!showPassword)}
                    color={theme.primary}
                  />
                }
              />
            </View>

            {/* New Email */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="mail-outline" size={20} color={theme.primary} />
                <Text style={[styles.label, { color: theme.text }]}>New Email</Text>
              </View>
              <TextInput
                value={newEmail}
                onChangeText={setNewEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                mode="outlined"
                placeholder="Enter new email address"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { color: theme.text }]}
                outlineColor={theme.border}
                activeOutlineColor={theme.primary}
              />
            </View>

            {/* Confirm Email */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Ionicons name="mail-outline" size={20} color={theme.primary} />
                <Text style={[styles.label, { color: theme.text }]}>Confirm New Email</Text>
              </View>
              <TextInput
                value={confirmEmail}
                onChangeText={setConfirmEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                mode="outlined"
                placeholder="Confirm new email address"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { color: theme.text }]}
                outlineColor={theme.border}
                activeOutlineColor={theme.primary}
              />
            </View>

            {/* Submit */}
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
                <Text style={styles.buttonText}>Update Email</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Security note */}
          <View style={styles.footerNote}>
            <Ionicons name="shield-checkmark-outline" size={16} color={theme.primary} />
            <Text style={[styles.noteText, { color: theme.textSecondary }]}>
              This action requires password verification
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
  submitButton: {
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
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