// screens/ForgotPassword.jsx — FIXED: Proper success handling + no false "failed" errors
import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
  useColorScheme,
  Keyboard,
  Alert,
} from "react-native";
import { TextInput } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebaseConfig";

export default function ForgotPassword() {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const scheme = useColorScheme();
  const isDarkMode = scheme === "dark";

  const theme = {
    background: isDarkMode ? "#0f172a" : "#f8fafc",
    card: isDarkMode ? "#1e293b" : "#ffffff",
    text: isDarkMode ? "#e2e8f0" : "#1e293b",
    textSecondary: isDarkMode ? "#94a3b8" : "#64748b",
    primary: isDarkMode ? "#00ff7f" : "#017a6b",
    border: isDarkMode ? "#334155" : "#e2e8f0",
    error: "#ef4444",
    success: "#22c55e",
  };

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email.trim());
  };

  const handleReset = async () => {
    const trimmedEmail = email.trim();

    setError("");
    setSuccess("");

    if (!trimmedEmail) {
      setError("Email is required");
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setError("Please enter a valid email");
      return;
    }

    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, trimmedEmail);

      // Success: email was queued (Firebase always "sends" even if no user exists)
      setSuccess("Password reset email sent! Check your inbox and spam folder.");
      
      Alert.alert(
        "Reset Link Sent",
        `We sent a password reset link to:\n\n${trimmedEmail}\n\nCheck your inbox (and spam/junk folder).`,
        [
          {
            text: "Got it",
            onPress: () => {
              Keyboard.dismiss();
              setEmail(""); // clear field
              navigation.navigate("Login");
            },
          },
        ],
        { cancelable: false }
      );
    } catch (err) {
      console.error("Reset password error:", err.code, err.message);

      let msg = "Failed to send reset email. Please try again.";

      switch (err.code) {
        case "auth/invalid-email":
          msg = "Invalid email format";
          break;
        case "auth/user-not-found":
          msg = "No account found with this email";
          break;
        case "auth/too-many-requests":
          msg = "Too many attempts. Please try again later.";
          break;
        case "auth/network-request-failed":
          msg = "Network error. Check your internet connection.";
          break;
        default:
          msg = err.message || "An error occurred";
      }

      setError(msg);
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={28} color={theme.text} />
      </TouchableOpacity>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Slim Header */}
          <View style={styles.header}>
            <View
              style={[
                styles.rlBadge,
                {
                  backgroundColor: `${theme.primary}15`,
                  borderColor: theme.primary,
                },
              ]}
            >
              <Text style={[styles.rlText, { color: theme.primary }]}>RL</Text>
            </View>

            <View style={styles.headerContent}>
              <Text style={[styles.welcomeTitle, { color: theme.text }]}>
                Reset Password
              </Text>
              <Text style={[styles.welcomeSubtitle, { color: theme.textSecondary }]}>
                Enter your email to reset
              </Text>
            </View>
          </View>

          {/* Lighter Reset Card */}
          <View
            style={[
              styles.resetCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <TextInput
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setError("");
                  setSuccess("");
                }}
                mode="outlined"
                label="Email"
                placeholder="your@email.com"
                placeholderTextColor={theme.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                outlineColor={error ? theme.error : theme.border}
                activeOutlineColor={error ? theme.error : theme.primary}
                style={{ backgroundColor: "transparent" }}
                theme={{
                  colors: {
                    onSurfaceVariant: theme.textSecondary,
                    primary: theme.primary,
                    text: theme.text,
                    error: theme.error,
                  },
                }}
                left={<TextInput.Icon icon="email-outline" color={theme.primary} />}
                error={!!error}
              />
              {error ? (
                <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
              ) : null}
              {success ? (
                <Text style={[styles.successText, { color: theme.success }]}>{success}</Text>
              ) : null}
            </View>

            {/* Reset Button */}
            <TouchableOpacity
              style={[
                styles.resetButton,
                { backgroundColor: theme.primary, opacity: loading ? 0.7 : 1 },
              ]}
              onPress={handleReset}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text style={styles.resetButtonText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Back to Login */}
          <View style={styles.backContainer}>
            <Text style={[styles.backText, { color: theme.textSecondary }]}>
              Remember your password?
            </Text>
            <TouchableOpacity onPress={() => {
              Keyboard.dismiss();
              navigation.navigate("Login");
            }}>
              <Text style={[styles.backLink, { color: theme.primary }]}>
                Sign in
              </Text>
            </TouchableOpacity>
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
    padding: 24,
    paddingTop: 60,
    paddingBottom: 80,
  },
  backButton: {
    position: "absolute",
    top: 5,
    left: 10,
    zIndex: 10,
    padding: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 36,
  },
  rlBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    marginRight: 16,
  },
  rlText: { fontSize: 20, fontWeight: "900", letterSpacing: -1 },
  headerContent: { flex: 1 },
  welcomeTitle: { fontSize: 26, fontWeight: "900" },
  welcomeSubtitle: { fontSize: 15, marginTop: 4 },
  resetCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputContainer: { marginBottom: 16 },
  resetButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  resetButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },
  errorText: {
    fontSize: 13,
    marginTop: 4,
    marginLeft: 4,
  },
  successText: {
    fontSize: 13,
    marginTop: 4,
    marginLeft: 4,
  },
  backContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 32,
  },
  backText: { fontSize: 15 },
  backLink: {
    fontSize: 15,
    fontWeight: "700",
    marginLeft: 6,
  },
});