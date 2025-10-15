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
} from "react-native";
import { TextInput, Button, FAB } from "react-native-paper";
import { AuthContext } from "../context/AuthContext";
import { UserContext } from "../context/UserContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useNavigation } from "@react-navigation/native"; // ✅ import hook

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const { setUser } = useContext(UserContext);

  const scheme = useColorScheme();
  const isDarkMode = scheme === "dark";

  const navigation = useNavigation(); // ✅ useNavigation hook

  const handleLogin = async () => {
    if (!email || !password) {
      return Alert.alert("Error", "Please fill in all fields");
    }

    setLoading(true);
    try {
      // 🔹 Step 1: Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 🔹 Step 2: Get Firebase ID Token
      const token = await user.getIdToken();

      // 🔹 Step 3: Send to backend for verification
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // 🔹 Step 4: Save user and token
      const userData = {
        email: user.email,
        uid: user.uid,
        token,
      };

      await AsyncStorage.setItem("user", JSON.stringify(userData));
      login(userData);
      setUser(userData);

      // 🔹 Step 5: Navigate to Home
      navigation.replace("HomeTabs");
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Login Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { backgroundColor: isDarkMode ? "#000" : "#f2f2f2" },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topContent}>
          <Image
            source={require("../assets/roomlink-logo.png")}
            style={styles.logo}
          />
          <Text
            style={[
              styles.welcome,
              { color: isDarkMode ? "#fff" : "#000" },
            ]}
          >
            Welcome Back
          </Text>

          <TextInput
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            style={[
              styles.input,
              { backgroundColor: isDarkMode ? "#1e1e1e" : "#fff" },
            ]}
            keyboardType="email-address"
            outlineColor="#036dd6"
            activeOutlineColor="#036dd6"
            textColor={isDarkMode ? "#fff" : "#000"}
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            mode="outlined"
            style={[
              styles.input,
              { backgroundColor: isDarkMode ? "#1e1e1e" : "#fff" },
            ]}
            outlineColor="#036dd6"
            activeOutlineColor="#036dd6"
            textColor={isDarkMode ? "#fff" : "#000"}
            right={
              <TextInput.Icon
                icon={showPassword ? "eye-off" : "eye"}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
          />

          <Button
            mode="contained"
            onPress={handleLogin}
            style={styles.loginButton}
            labelStyle={styles.loginLabel}
            loading={loading}
            disabled={loading}
          >
            {loading ? "Logging In..." : "Login"}
          </Button>

          <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
            <Text style={styles.link}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomContent}>
          <FAB
            style={styles.fab}
            icon="account-plus"
            color="white"
            onPress={() => navigation.navigate("Signup")}
            label="Create Account"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "space-between",
    padding: 20,
  },
  topContent: {
    flex: 1,
  },
  bottomContent: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 10,
  },
  logo: {
    width: 150,
    height: 150,
    alignSelf: "center",
    marginBottom: 10,
    resizeMode: "contain",
  },
  welcome: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 25,
  },
  input: {
    marginBottom: 15,
  },
  loginButton: {
    backgroundColor: "#036dd6",
    paddingVertical: 5,
    marginTop: 15,
    borderRadius: 12,
    elevation: 3,
  },
  loginLabel: { color: "white", fontSize: 16, fontWeight: "600" },
  link: {
    marginTop: 10,
    color: "#036dd6",
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
  },
  fab: {
    backgroundColor: "#036dd6",
  },
});
