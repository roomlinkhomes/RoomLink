// screens/Login.jsx — SHAKING FIXED FOREVER
import React, { useState, useContext } from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Text,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  useColorScheme,
  SafeAreaView,
  ActivityIndicator,
  Keyboard, // ← Added for future use if needed
} from "react-native";
import { TextInput } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import { UserContext } from "../context/UserContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const { setUser } = useContext(UserContext);
  const scheme = useColorScheme();
  const isDarkMode = scheme === "dark";
  const navigation = useNavigation();

  const theme = {
    background: isDarkMode ? "#121212" : "#fafafa",
    card: isDarkMode ? "#1e1e1e" : "#ffffff",
    text: isDarkMode ? "#e0e0e0" : "#1a1a1a",
    textSecondary: isDarkMode ? "#b0b0b0" : "#666",
    primary: isDarkMode ? "#00ff7f" : "#017a6b",
    border: isDarkMode ? "#333" : "#e0e6ed",
  };

  const handleLogin = async () => {
    if (!email || !password) {
      return Alert.alert("Error", "Please fill in all fields");
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      const user = userCredential.user;

      await user.reload();
      const refreshedUser = auth.currentUser;

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      let userData = {
        id: user.uid,
        uid: user.uid,
        email: user.email,
        firstName: "",
        lastName: "",
        username: user.email.split("@")[0],
        country: "NG",
        currency: "₦",
        photoURL: refreshedUser.photoURL || null,
        isVendor: false,
      };

      if (userSnap.exists()) {
        const data = userSnap.data();
        userData = {
          ...userData,
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          username: data.username || user.email.split("@")[0],
          country: data.country || "NG",
          currency: data.currency || "₦",
          isVendor: data.isVendor ?? false,
          photoURL: refreshedUser.photoURL || data.photoURL || null,
        };
      } else {
        await setDoc(userRef, {
          id: user.uid,
          email: user.email,
          firstName: "",
          lastName: "",
          username: user.email.split("@")[0],
          country: "NG",
          currency: "₦",
          isVendor: false,
          createdAt: serverTimestamp(),
        });
      }

      await AsyncStorage.setItem("user", JSON.stringify(userData));
      login(userData);
      setUser(userData);
      navigation.replace("HomeTabs");
    } catch (error) {
      console.error("Login Error:", error);
      let message = "An error occurred while logging in.";
      if (error.code === "auth/invalid-email") message = "Invalid email address.";
      else if (error.code === "auth/user-not-found")
        message = "No account found with this email.";
      else if (error.code === "auth/wrong-password")
        message = "Incorrect password.";
      else if (error.code === "auth/too-many-requests")
        message = "Too many failed attempts. Try again later.";

      Alert.alert("Login Error", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        // ← Removed keyboardVerticalOffset — causes mismatch with ForgotPassword
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
                  backgroundColor: isDarkMode
                    ? "rgba(0, 255, 127, 0.1)"
                    : "rgba(1, 122, 107, 0.08)",
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
                Sign in to continue shopping & renting new homes
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
              <View style={styles.inputHeader}>
                <Ionicons name="mail-outline" size={20} color={theme.primary} />
                <Text style={[styles.inputLabel, { color: theme.text }]}>
                  Email Address
                </Text>
              </View>
              <TextInput
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                placeholder="Enter your email"
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
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputHeader}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={theme.primary}
                />
                <Text style={[styles.inputLabel, { color: theme.text }]}>
                  Password
                </Text>
              </View>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                mode="outlined"
                placeholder="Enter your password"
                placeholderTextColor={theme.textSecondary}
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
                    icon={showPassword ? "eye-off" : "eye"}
                    onPress={() => setShowPassword(!showPassword)}
                    color={theme.primary}
                  />
                }
              />
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, { backgroundColor: theme.primary }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.loginButtonText}>Signing In...</Text>
                </View>
              ) : (
                <>
                  <Ionicons name="log-in-outline" size={20} color="#fff" />
                  <Text style={styles.loginButtonText}>Sign In Securely</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Forgot Password */}
            <TouchableOpacity
              style={styles.forgotPasswordContainer}
              onPress={() => navigation.navigate("ForgotPassword")}
            >
              <Ionicons name="key-outline" size={16} color={theme.primary} />
              <Text style={[styles.forgotPasswordText, { color: theme.primary }]}>
                Forgot Password?
              </Text>
            </TouchableOpacity>
          </View>

          {/* Security Badge */}
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

      {/* Create Account CTA — MATCHED EXACTLY TO ForgotPassword */}
      <View
        style={[
          styles.createAccountContainer,
          {
            backgroundColor: theme.card,
            borderTopColor: theme.border,
          },
        ]}
      >
        <Text style={[styles.createAccountText, { color: theme.textSecondary }]}>
          Don't have an account?
        </Text>
        <TouchableOpacity
          style={[
            styles.createAccountButton,
            {
              backgroundColor: "rgba(1, 122, 107, 0.08)",
              borderColor: theme.primary,
            },
          ]}
          onPress={() => navigation.navigate("Signup")}
          activeOpacity={0.7}
        >
          <Ionicons name="person-add-outline" size={18} color={theme.primary} />
          <Text
            style={[styles.createAccountButtonText, { color: theme.primary }]}
          >
            Create Account
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 20,
    paddingBottom: 140, // ← Matches ForgotPassword exactly
  },
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
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    marginLeft: 12,
    letterSpacing: 0.5,
  },
  loadingContainer: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  forgotPasswordContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    marginTop: 20,
  },
  forgotPasswordText: { fontSize: 15, fontWeight: "700", marginLeft: 8, letterSpacing: 0.3 },
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
  createAccountContainer: {
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
    borderTopColor: "transparent", // ← Matches ForgotPassword
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  createAccountText: { fontSize: 15, fontWeight: "500", marginRight: 12 },
  createAccountButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  createAccountButtonText: {
    fontSize: 15,
    fontWeight: "800",
    marginLeft: 8,
    letterSpacing: 0.3,
  },
});