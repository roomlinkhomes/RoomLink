// screens/Login.jsx — FIXED: Compatible with listener-based AuthContext (no login() function)
// Ensures profile exists on every login + better error messages
import React, { useState, useContext } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  useColorScheme,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { TextInput } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { UserContext } from "../context/UserContext"; // remove if not needed anymore
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";

// Helper: Ensure user profile exists in Firestore & return full data
const ensureUserProfile = async (uid, email) => {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  let userData = {
    id: uid,
    uid,
    email,
    firstName: "",
    lastName: "",
    username: email.split("@")[0],
    country: "NG",
    currency: "₦",
    isVendor: false,
    photoURL: null,
  };

  if (!userSnap.exists()) {
    // Create default profile if missing (fixes old half-created accounts)
    await setDoc(userRef, {
      ...userData,
      createdAt: serverTimestamp(),
    });
  } else {
    const data = userSnap.data();
    userData = {
      ...userData,
      firstName: data.firstName || "",
      lastName: data.lastName || "",
      username: data.username || email.split("@")[0],
      country: data.country || "NG",
      currency: data.currency || "₦",
      isVendor: data.isVendor ?? false,
      photoURL: data.photoURL || null,
    };
  }

  return userData;
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");

  // Only keep if you still use a separate UserContext
  const { setUser } = useContext(UserContext) || { setUser: () => {} };

  const scheme = useColorScheme();
  const isDarkMode = scheme === "dark";
  const navigation = useNavigation();

  const theme = {
    background: isDarkMode ? "#0f172a" : "#f8fafc",
    card: isDarkMode ? "#1e293b" : "#ffffff",
    text: isDarkMode ? "#e2e8f0" : "#1e293b",
    textSecondary: isDarkMode ? "#94a3b8" : "#64748b",
    primary: isDarkMode ? "#00ff7f" : "#017a6b",
    border: isDarkMode ? "#334155" : "#e2e8f0",
    error: "#ef4444",
  };

  const handleLogin = async () => {
    setEmailError("");
    setPasswordError("");
    setGeneralError("");

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail) {
      setEmailError("Email is required");
      return;
    }
    if (!cleanPassword) {
      setPasswordError("Password is required");
      return;
    }

    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        cleanEmail,
        cleanPassword
      );
      const user = userCredential.user;

      // Reload to ensure fresh token/state
      await user.reload();
      const refreshedUser = auth.currentUser;

      // Ensure profile exists & get full data (fixes old accounts)
      const userData = await ensureUserProfile(refreshedUser.uid, refreshedUser.email);

      // Optional: only if you still have separate UserContext
      setUser(userData);

      // IMPORTANT: Do NOT save to AsyncStorage here — AuthContext listener handles persistence
      // Do NOT call login() — it doesn't exist anymore

      navigation.replace("HomeTabs");
    } catch (error) {
      console.error("LOGIN FAILED:", error.code, error.message);

      let message = "An error occurred. Please try again.";
      let fieldError = null;

      switch (error.code) {
        case "auth/invalid-credential":
          message = "Invalid email or password (account may not exist or credentials are wrong). Try 'Forgot Password' if this is an older account.";
          fieldError = "general";
          break;
        case "auth/invalid-email":
        case "auth/user-not-found":
          fieldError = "email";
          message = "Invalid email or no account found";
          break;
        case "auth/wrong-password":
          fieldError = "password";
          message = "Incorrect password";
          break;
        case "auth/too-many-requests":
          message = "Too many attempts. Try again later.";
          break;
        case "auth/network-request-failed":
          message = "Network error — check your internet connection.";
          break;
        default:
          message = `${error.code || "Unknown error"}: ${error.message || "Login failed"}`;
      }

      if (fieldError === "email") setEmailError(message);
      else if (fieldError === "password") setPasswordError(message);
      else setGeneralError(message);

      Alert.alert("Login Issue", message);
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
          {/* Header */}
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
                Welcome Back
              </Text>
              <Text style={[styles.welcomeSubtitle, { color: theme.textSecondary }]}>
                Sign in to continue
              </Text>
            </View>
          </View>

          {/* Login Card */}
          <View
            style={[
              styles.loginCard,
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
                  setEmailError("");
                }}
                mode="outlined"
                label="Email"
                placeholder="your@email.com"
                placeholderTextColor={theme.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                outlineColor={emailError ? theme.error : theme.border}
                activeOutlineColor={emailError ? theme.error : theme.primary}
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
                error={!!emailError}
              />
              {emailError ? (
                <Text style={[styles.errorText, { color: theme.error }]}>
                  {emailError}
                </Text>
              ) : null}
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <TextInput
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setPasswordError("");
                }}
                secureTextEntry={!showPassword}
                mode="outlined"
                label="Password"
                placeholder="••••••••"
                outlineColor={passwordError ? theme.error : theme.border}
                activeOutlineColor={passwordError ? theme.error : theme.primary}
                style={{ backgroundColor: "transparent" }}
                theme={{
                  colors: {
                    onSurfaceVariant: theme.textSecondary,
                    primary: theme.primary,
                    text: theme.text,
                    error: theme.error,
                  },
                }}
                left={<TextInput.Icon icon="lock-outline" color={theme.primary} />}
                right={
                  <TextInput.Icon
                    icon={showPassword ? "eye-off" : "eye"}
                    onPress={() => setShowPassword(!showPassword)}
                    color={theme.primary}
                  />
                }
                error={!!passwordError}
              />
              {passwordError ? (
                <Text style={[styles.errorText, { color: theme.error }]}>
                  {passwordError}
                </Text>
              ) : null}
            </View>

            {/* General Error */}
            {generalError ? (
              <Text style={[styles.generalError, { color: theme.error }]}>
                {generalError}
              </Text>
            ) : null}

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, { backgroundColor: theme.primary }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Forgot Password */}
            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => navigation.navigate("ForgotPassword")}
            >
              <Text style={[styles.forgotText, { color: theme.primary }]}>
                Forgot password?
              </Text>
            </TouchableOpacity>
          </View>

          {/* Create Account */}
          <View style={styles.createAccount}>
            <Text style={[styles.createText, { color: theme.textSecondary }]}>
              Don't have an account?
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
              <Text style={[styles.createLink, { color: theme.primary }]}>
                Sign up
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
    top: 1,
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
  loginCard: {
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
  loginButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },
  forgotPassword: {
    alignItems: "center",
    marginTop: 16,
  },
  forgotText: { fontSize: 14, fontWeight: "900" },
  generalError: {
    textAlign: "center",
    marginTop: 12,
    fontSize: 14,
  },
  errorText: {
    fontSize: 13,
    marginTop: 4,
    marginLeft: 4,
  },
  createAccount: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 32,
  },
  createText: { fontSize: 15 },
  createLink: {
    fontSize: 15,
    fontWeight: "700",
    marginLeft: 6,
  },
});