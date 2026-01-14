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

  // 🆕 RLMARKET Theme (Rebranded to light mode)
  const theme = {
    background: "#fafafa",
    card: "#ffffff",
    text: "#1a1a1a",
    textSecondary: "#666",
    primary: "#017a6b",
    border: "#e0e6ed",
  };

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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* MOVABLE CONTENT */}
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
          {/* 🆕 RLMARKET Header */}
          <View style={styles.header}>
            <View
              style={[
                styles.rlBadge,
                {
                  backgroundColor: "rgba(1, 122, 107, 0.08)",
                  borderColor: theme.primary,
                },
              ]}
            >
              <Text style={[styles.rlText, { color: theme.primary }]}>RL</Text>
            </View>

            <View style={styles.headerContent}>
              <Text style={[styles.welcomeTitle, { color: theme.text }]}>
                Change Password
              </Text>
              <Text style={[styles.welcomeSubtitle, { color: theme.textSecondary }]}>
                Securely update your account credentials
              </Text>
            </View>
          </View>

          {/* 🆕 Change Password Card */}
          <View
            style={[
              styles.loginCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
                shadowColor: "#000",
              },
            ]}
          >
            {/* Old Password Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputHeader}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={theme.primary}
                />
                <Text style={[styles.inputLabel, { color: theme.text }]}>
                  Current Password
                </Text>
              </View>
              <TextInput
                value={oldPassword}
                onChangeText={setOldPassword}
                secureTextEntry={!showOld}
                mode="outlined"
                placeholder="Enter your current password"
                placeholderTextColor={theme.textSecondary}
                style={[styles.textInput, { color: theme.text }]}
                outlineColor={theme.border}
                activeOutlineColor={theme.primary}
                contentStyle={{ color: theme.text }}
                theme={{
                  colors: {
                    onSurfaceVariant: theme.border,
                    primary: theme.primary,
                  },
                }}
                right={
                  <TextInput.Icon
                    icon={showOld ? "eye-off" : "eye"}
                    onPress={() => setShowOld(!showOld)}
                    color={theme.primary}
                  />
                }
              />
            </View>

            {/* New Password Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputHeader}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={theme.primary}
                />
                <Text style={[styles.inputLabel, { color: theme.text }]}>
                  New Password
                </Text>
              </View>
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNew}
                mode="outlined"
                placeholder="Enter your new password"
                placeholderTextColor={theme.textSecondary}
                style={[styles.textInput, { color: theme.text }]}
                outlineColor={theme.border}
                activeOutlineColor={theme.primary}
                contentStyle={{ color: theme.text }}
                theme={{
                  colors: {
                    onSurfaceVariant: theme.border,
                    primary: theme.primary,
                  },
                }}
                right={
                  <TextInput.Icon
                    icon={showNew ? "eye-off" : "eye"}
                    onPress={() => setShowNew(!showNew)}
                    color={theme.primary}
                  />
                }
              />
            </View>

            {/* ✅ show progressive indicator only when typing */}
            {newPassword.length > 0 && (
              <View
                style={[
                  styles.indicator,
                  { backgroundColor: indicatorColor, width: `${strengthScore * 33.3}%` },
                ]}
              />
            )}

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputHeader}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={theme.primary}
                />
                <Text style={[styles.inputLabel, { color: theme.text }]}>
                  Confirm New Password
                </Text>
              </View>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirm}
                mode="outlined"
                placeholder="Confirm your new password"
                placeholderTextColor={theme.textSecondary}
                style={[styles.textInput, { color: theme.text }]}
                outlineColor={theme.border}
                activeOutlineColor={theme.primary}
                contentStyle={{ color: theme.text }}
                theme={{
                  colors: {
                    onSurfaceVariant: theme.border,
                    primary: theme.primary,
                  },
                }}
                right={
                  <TextInput.Icon
                    icon={showConfirm ? "eye-off" : "eye"}
                    onPress={() => setShowConfirm(!showConfirm)}
                    color={theme.primary}
                  />
                }
              />
            </View>

            {/* 🆕 Change Button */}
            <TouchableOpacity
              style={[styles.loginButton, { backgroundColor: theme.primary }]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text style={[styles.loginButtonText, { color: "#ffffff" }]}>Changing...</Text>
                </View>
              ) : (
                <>
                  <Ionicons name="refresh-outline" size={20} color="#ffffff" />
                  <Text style={[styles.loginButtonText, { color: "#ffffff" }]}>Change Password</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* 🆕 Security Badge */}
          <View
            style={[
              styles.securityBadge,
              {
                backgroundColor: "rgba(1, 122, 107, 0.05)",
                borderColor: "rgba(1, 122, 107, 0.1)",
              },
            ]}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color={theme.primary}
            />
            <Text style={[styles.securityText, { color: theme.textSecondary }]}>
              Your data is secured with encryption
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ---------------- STYLES (ADAPTED FROM LOGIN) ---------------- */

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContainer: { flexGrow: 1, padding: 24, paddingTop: 20, paddingBottom: 140 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 32 },
  rlBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    marginRight: 16,
  },
  rlText: { fontSize: 24, fontWeight: "900", letterSpacing: -1.5 },
  headerContent: { flex: 1 },
  welcomeTitle: { fontSize: 28, fontWeight: "800", letterSpacing: 0.5, lineHeight: 34 },
  welcomeSubtitle: { fontSize: 16, fontWeight: "500", marginTop: 6, lineHeight: 22 },
  loginCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
  },
  inputContainer: { marginBottom: 20 },
  inputHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  inputLabel: { fontSize: 16, fontWeight: "700", marginLeft: 10, letterSpacing: 0.3 },
  textInput: { fontSize: 16, fontWeight: "500" },
  indicator: {
    height: 6,
    borderRadius: 3,
    marginBottom: 15,
    marginHorizontal: 5,
    alignSelf: "flex-start", // keeps it left-aligned like a progress bar
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 16,
    marginTop: 8,
    minHeight: 56,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: "800",
    marginLeft: 12,
    letterSpacing: 0.5,
  },
  loadingContainer: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  securityBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  securityText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 12,
    lineHeight: 18,
  },
});