// screens/OtpVerification.jsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  Alert,
} from "react-native";
import { TextInput, Button } from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth, db } from "../firebaseConfig";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

const functions = getFunctions();
const TIMER_EXPIRY_KEY = "@otp_resend_expiry_time";

export default function OtpVerification() {
  const navigation = useNavigation();
  const route = useRoute();
  const isDark = useColorScheme() === "dark";
  const primaryColor = "#017a6b";

  const {
    email = "",
    password = "",
    firstName = "",
    lastName = "",
    username = "",
    country = {},
    onSaveProfile,
  } = route.params || {};

  const [otp, setOtp] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [resending, setResending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  // Timer logic
  const calculateRemainingTime = async () => {
    try {
      const savedExpiry = await AsyncStorage.getItem(TIMER_EXPIRY_KEY);
      if (!savedExpiry) {
        startNewTimer();
        return;
      }
      const expiry = parseInt(savedExpiry, 10);
      const remaining = Math.max(0, Math.ceil((expiry - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) {
        await AsyncStorage.removeItem(TIMER_EXPIRY_KEY);
      }
    } catch (e) {
      console.error("Timer load error:", e);
      startNewTimer();
    }
  };

  const startNewTimer = async () => {
    const expiryTime = Date.now() + 60 * 1000;
    await AsyncStorage.setItem(TIMER_EXPIRY_KEY, expiryTime.toString());
    setTimeLeft(60);
  };

  useEffect(() => {
    calculateRemainingTime();
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const handleResend = async () => {
    if (resending || timeLeft > 0 || !email) return;
    setResending(true);
    setError("");
    try {
      const sendSignupOTP = httpsCallable(functions, "sendSignupOTP");
      await sendSignupOTP({
        email: email.trim(),
        name: `${firstName.trim()} ${lastName.trim()}`,
      });
      await startNewTimer();
      Alert.alert("Success", "A new OTP has been sent to your email.");
    } catch (err) {
      console.error("Resend failed:", err);
      setError("Failed to resend OTP. Please try again.");
    } finally {
      setResending(false);
    }
  };

  // ==================== FINAL handleVerify - Direct to Home ====================
  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setVerifying(true);
    setError("");

    try {
      // 1. Verify OTP
      const verifySignupOTP = httpsCallable(functions, "verifySignupOTP");
      const verifyResult = await verifySignupOTP({ email: email.trim(), otp });

      if (!verifyResult.data.success) {
        throw new Error(verifyResult.data.message || "OTP verification failed");
      }

      // 2. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      const user = userCredential.user;

      // 3. Update displayName
      await updateProfile(user, {
        displayName: `${firstName.trim()} ${lastName.trim()}`,
      });

      // 4. Save profile using function from Signup
      if (onSaveProfile) {
        try {
          await onSaveProfile(user.uid);
          console.log("✅ onSaveProfile succeeded");
        } catch (saveErr) {
          console.warn("onSaveProfile failed:", saveErr);
        }
      }

      // 5. Atomic transaction for username + full user profile
      const usernameDocRef = doc(db, "usernames", username.trim().toLowerCase());
      const userDocRef = doc(db, "users", user.uid);

      await runTransaction(db, async (transaction) => {
        const usernameSnap = await transaction.get(usernameDocRef);
        if (usernameSnap.exists()) {
          throw new Error("Username is already taken");
        }

        transaction.set(usernameDocRef, {
          uid: user.uid,
          username: username.trim().toLowerCase(),
          createdAt: serverTimestamp(),
        });

        transaction.set(userDocRef, {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          fullName: `${firstName.trim()} ${lastName.trim()}`,
          username: username.trim().toLowerCase(),
          email: email.trim().toLowerCase(),
          country: country.code || "NG",
          emailVerified: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      console.log("✅ Account created successfully! Navigating to Home...");

      // Navigate directly to Home (User stays logged in)
      navigation.replace("Home");   // ← Change this if your home screen name is different

    } catch (err) {
      console.error("=== VERIFICATION ERROR ===", err);

      let msg = "Something went wrong. Please try again.";
      if (err.message?.includes("already taken")) msg = "This username is already taken.";
      else if (err.code === "auth/email-already-in-use") msg = "Email already in use.";
      else if (err.message?.includes("permission-denied")) msg = "Permission error. Check Firestore rules.";
      else if (err.message?.includes("expired") || err.message?.includes("invalid")) {
        msg = "Invalid or expired OTP. Please request a new one.";
      }

      setError(msg);
      setOtp("");
    } finally {
      setVerifying(false);
    }
  };

  // Auto verify when 6 digits entered
  useEffect(() => {
    if (otp.length > 0) setError("");
    if (otp.length !== 6) return;
    const autoTimer = setTimeout(handleVerify, 400);
    return () => clearTimeout(autoTimer);
  }, [otp]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: isDark ? "#0f172a" : "#f8fafc" }]}
    >
      <View style={styles.inner}>
        <Text style={[styles.heading, { color: isDark ? "#e2e8f0" : "#1e293b" }]}>
          Verify Your Email
        </Text>
        <Text style={[styles.subheading, { color: isDark ? "#94a3b8" : "#64748b" }]}>
          Enter the 6-digit code sent to{"\n"}
          <Text style={{ fontWeight: "bold", color: primaryColor }}>
            {email || "your email"}
          </Text>
        </Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TextInput
          label="OTP"
          placeholder="Enter 6-digit code"
          value={otp}
          onChangeText={(text) => setOtp(text.replace(/\D/g, ""))}
          keyboardType="numeric"
          maxLength={6}
          mode="outlined"
          style={[styles.input, { backgroundColor: isDark ? "#1e293b" : "#ffffff" }]}
          outlineColor={primaryColor}
          activeOutlineColor={primaryColor}
          textColor={isDark ? "#e2e8f0" : "#1e293b"}
        />

        <Button
          mode="contained"
          onPress={handleVerify}
          loading={verifying}
          disabled={verifying || otp.length !== 6}
          style={{ backgroundColor: primaryColor, marginTop: 24, borderRadius: 12 }}
          contentStyle={{ paddingVertical: 12 }}
          labelStyle={{ fontSize: 16, fontWeight: "bold", color: "#ffffff" }}
        >
          {verifying ? "Verifying..." : "Verify & Create Account"}
        </Button>

        <View style={styles.resendRow}>
          <Text style={{ color: isDark ? "#94a3b8" : "#64748b" }}>
            Didn't receive the code?
          </Text>
          <TouchableOpacity onPress={handleResend} disabled={resending || timeLeft > 0}>
            <Text style={{
              color: (timeLeft > 0 || resending) ? "#888" : primaryColor,
              marginLeft: 8,
              fontWeight: "bold",
            }}>
              {timeLeft > 0
                ? `Resend in ${timeLeft}s`
                : resending
                  ? "Sending..."
                  : "Resend OTP"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { padding: 24, flex: 1, justifyContent: "center" },
  heading: { fontSize: 28, fontWeight: "800", marginBottom: 12, textAlign: "center" },
  subheading: { fontSize: 16, marginBottom: 32, textAlign: "center", lineHeight: 24 },
  input: { marginBottom: 24, fontSize: 16 },
  resendRow: { flexDirection: "row", justifyContent: "center", marginTop: 32, alignItems: "center" },
  errorText: { textAlign: "center", marginBottom: 16, fontSize: 14, color: "#ef4444" },
});