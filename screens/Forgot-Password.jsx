// screens/ForgotPassword.jsx — FULLY FIXED (NO SHAKING ON RETURN)
import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
  useColorScheme,
  Keyboard, // ← NEW: Added for dismiss
} from "react-native";
import { TextInput } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebaseConfig";

export default function ForgotPassword() {
  const navigation = useNavigation();
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const scheme = useColorScheme();
  const isDarkMode = scheme === "dark";

  const theme = {
    background: isDarkMode ? "#121212" : "#fafafa",
    card: isDarkMode ? "#1e1e1e" : "#ffffff",
    text: isDarkMode ? "#e0e0e0" : "#1a1a1a",
    textSecondary: isDarkMode ? "#b0b0b0" : "#666",
    primary: isDarkMode ? "#00ff7f" : "#017a6b",
    border: isDarkMode ? "#333" : "#e0e6ed",
  };

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleReset = async () => {
    const email = identifier.trim();

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);

      setIdentifier("");

      Alert.alert(
        "Check Your Email 📧",
        `We've sent password reset instructions to:\n\n${email}\n\n` +
          "Check your inbox and spam/junk folder.\n" +
          "The link expires in 1 hour.",
        [
          {
            text: "Got it",
            onPress: () => {
              Keyboard.dismiss(); // ← FIX: Dismiss keyboard before navigating
              navigation.navigate("Login");
            },
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error("Password reset error:", error.code, error.message);

      let userMessage = "Failed to send reset email. Please try again later.";

      switch (error.code) {
        case "auth/user-not-found":
          userMessage = "If an account exists with this email, reset instructions have been sent.";
          break;
        case "auth/invalid-email":
          userMessage = "Please enter a valid email address.";
          break;
        case "auth/too-many-requests":
          userMessage = "Too many attempts. Please try again later.";
          break;
        case "auth/network-request-failed":
          userMessage = "Network error. Check your internet connection.";
          break;
        default:
          userMessage = "Something went wrong. Please try again.";
      }

      setError(userMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* RLMARKET Header */}
          <View style={styles.header}>
            <View
              style={[
                styles.rlBadge,
                {
                  backgroundColor: isDarkMode ? "rgba(0, 255, 127, 0.1)" : "rgba(1, 122, 107, 0.08)",
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
                Enter your email to receive reset instructions
              </Text>
            </View>
          </View>

          {/* Reset Password Card */}
          <View
            style={[
              styles.resetCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.inputContainer}>
              <View style={styles.inputHeader}>
                <Ionicons name="mail-outline" size={20} color={theme.primary} />
                <Text style={[styles.inputLabel, { color: theme.text }]}>Email Address</Text>
              </View>
              <TextInput
                value={identifier}
                onChangeText={setIdentifier}
                mode="outlined"
                placeholder="Enter your email address"
                placeholderTextColor={theme.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                outlineColor={theme.border}
                activeOutlineColor={theme.primary}
                contentStyle={{ color: theme.text }}
                theme={{
                  colors: {
                    onSurfaceVariant: theme.border,
                    primary: theme.primary,
                  },
                }}
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
            </View>

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
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.resetButtonText}>Sending...</Text>
                </View>
              ) : (
                <>
                  <Ionicons name="send-outline" size={20} color="#fff" />
                  <Text style={styles.resetButtonText}>Send Reset Instructions</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.securityBadge,
              {
                backgroundColor: "rgba(1, 122, 107, 0.05)",
                borderColor: "rgba(1, 122, 107, 0.1)",
              },
            ]}
          >
            <Ionicons name="shield-checkmark-outline" size={20} color={theme.primary} />
            <Text style={[styles.securityText, { color: theme.textSecondary }]}>
              Your email is secured with encryption
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Back to Login CTA */}
      <View
        style={[
          styles.loginContainer,
          {
            backgroundColor: theme.card,
            borderTopColor: theme.border,
          },
        ]}
      >
        <Text style={[styles.loginText, { color: theme.textSecondary }]}>
          Remember your password?
        </Text>
        <TouchableOpacity
          style={[
            styles.loginButton,
            {
              backgroundColor: "rgba(1, 122, 107, 0.08)",
              borderColor: theme.primary,
            },
          ]}
          onPress={() => {
            Keyboard.dismiss(); // ← FIX: Dismiss keyboard here too
            navigation.navigate("Login");
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="log-in-outline" size={18} color={theme.primary} />
          <Text style={[styles.loginButtonText, { color: theme.primary }]}>
            Sign In
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 20,
    paddingBottom: 140,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
  },
  rlBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    marginRight: 16,
  },
  rlText: {
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -1.5,
  },
  headerContent: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0.5,
    lineHeight: 34,
  },
  welcomeSubtitle: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: 6,
    lineHeight: 22,
  },
  resetCard: {
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
  inputContainer: {
    marginBottom: 20,
  },
  inputHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 10,
    letterSpacing: 0.3,
  },
  resetButton: {
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
  resetButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    marginLeft: 12,
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
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
  loginContainer: {
    position: "absolute",
    bottom: 30,
    left: 24,
    right: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  loginText: {
    fontSize: 15,
    fontWeight: "500",
    marginRight: 12,
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  loginButtonText: {
    fontSize: 15,
    fontWeight: "800",
    marginLeft: 8,
    letterSpacing: 0.3,
  },
  error: {
    color: "#ef4444",
    fontSize: 13,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: "500",
  },
});