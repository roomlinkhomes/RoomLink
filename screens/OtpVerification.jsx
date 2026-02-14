// OtpVerification.jsx — FIXED: Custom beautiful tinted success card (modal) + SMALLER button
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  ActivityIndicator,
} from "react-native";
import { TextInput, Button } from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import { auth, db } from "../firebaseConfig";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

const functions = getFunctions();

export default function OtpVerification() {
  const navigation = useNavigation();
  const route = useRoute();
  const isDark = useColorScheme() === "dark";

  const primaryColor = "#017a6b";
  const accentColor = "#00ff7f";
  const tintBackground = isDark ? "rgba(1, 122, 107, 0.15)" : "rgba(0, 255, 127, 0.12)";

  const {
    email = "",
    password = "",
    firstName = "",
    lastName = "",
    username = "",
    country = {},
  } = route.params || {};

  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(60);
  const [resending, setResending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Countdown for resend
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // Resend OTP
  const handleResend = async () => {
    if (resending || timer > 0 || !email) return;

    setResending(true);
    setError("");

    try {
      const sendSignupOTP = httpsCallable(functions, "sendSignupOTP");
      await sendSignupOTP({
        email: email.trim(),
        name: `${firstName.trim()} ${lastName.trim()}`,
      });

      setTimer(60);
    } catch (err) {
      console.error("Resend failed:", err);
      setError("Failed to resend OTP");
    } finally {
      setResending(false);
    }
  };

  // Verify OTP + Create user + Show custom success modal
  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setVerifying(true);
    setError("");

    try {
      const verifySignupOTP = httpsCallable(functions, "verifySignupOTP");
      const verifyResult = await verifySignupOTP({ email: email.trim(), otp });

      if (!verifyResult.data.success) {
        throw new Error(verifyResult.data.message || "OTP verification failed");
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: `${firstName.trim()} ${lastName.trim()}`,
      });

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim(),
        country: country.code || null,
        emailVerified: true,
        createdAt: serverTimestamp(),
      });

      // Show custom tinted success modal
      setShowSuccessModal(true);
    } catch (err) {
      console.error("Verification error:", err);
      let msg = "Something went wrong. Please try again.";
      if (err.code === "auth/email-already-in-use") msg = "Email already in use";
      else if (err.code === "auth/weak-password") msg = "Password is too weak";
      else if (err.message?.includes("expired")) msg = "OTP has expired – request a new one";
      else if (err.message?.includes("invalid")) msg = "Invalid OTP – double-check the code";
      else if (err.message) msg = err.message;

      setError(msg);
      setOtp("");
    } finally {
      setVerifying(false);
    }
  };

  // Debounced auto-verify
  useEffect(() => {
    if (otp.length > 0) setError("");

    if (otp.length !== 6) return;

    const autoVerifyTimer = setTimeout(() => {
      handleVerify();
    }, 400);

    return () => clearTimeout(autoVerifyTimer);
  }, [otp]);

  return (
    <>
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

          {error ? (
            <Text style={[styles.errorText, { color: "#ef4444" }]}>{error}</Text>
          ) : null}

          <TextInput
            label="OTP"
            placeholder="Enter 6-digit code"
            value={otp}
            onChangeText={(text) => {
              const numeric = text.replace(/\D/g, "");
              setOtp(numeric);
            }}
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
            <TouchableOpacity
              onPress={handleResend}
              disabled={resending || timer > 0}
            >
              <Text
                style={{
                  color: timer > 0 || resending ? "#888" : primaryColor,
                  marginLeft: 8,
                  fontWeight: "bold",
                }}
              >
                {timer > 0
                  ? `Resend in ${timer}s`
                  : resending
                  ? "Sending..."
                  : "Resend OTP"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Custom Tinted Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.successCard,
            { backgroundColor: isDark ? "#1e293b" : "#ffffff" }
          ]}>
            <Text style={styles.successEmoji}>🎉</Text>
            <Text style={[styles.successTitle, { color: primaryColor }]}>
              Welcome to RoomLink!
            </Text>
            <Text style={[styles.successMessage, { color: isDark ? "#e2e8f0" : "#1e293b" }]}>
              Hey {firstName.trim() || "there"}! 👋{"\n\n"}
              Your account is now fully created and verified.{"\n"}
              Get ready to connect, chat, and explore!
            </Text>

            {/* Smaller button */}
            <TouchableOpacity
              style={[
                styles.successButton,
                { backgroundColor: primaryColor }
              ]}
              onPress={() => {
                setShowSuccessModal(false);
                navigation.replace("Login");
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.successButtonText}>Go to Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { padding: 24, flex: 1, justifyContent: "center" },
  heading: { fontSize: 28, fontWeight: "800", marginBottom: 12, textAlign: "center" },
  subheading: { fontSize: 16, marginBottom: 32, textAlign: "center", lineHeight: 24 },
  input: { marginBottom: 24, fontSize: 16 },
  resendRow: { flexDirection: "row", justifyContent: "center", marginTop: 32, alignItems: "center" },
  errorText: { textAlign: "center", marginBottom: 16, fontSize: 14 },

  // Custom success modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  successCard: {
    width: "80%",
    maxWidth: 340,
    padding: 32,
    borderRadius: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 1,
    borderColor: "rgba(1, 122, 107, 0.3)",
  },
  successEmoji: { fontSize: 64, marginBottom: 16 },
  successTitle: { fontSize: 28, fontWeight: "900", marginBottom: 16 },
  successMessage: { fontSize: 16, textAlign: "center", lineHeight: 24, marginBottom: 32 },

  // Smaller button style
  successButton: {
    paddingVertical: 10,           // Reduced (was 16)
    paddingHorizontal: 28,         // Reduced (was 40)
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 140,                 // Keeps it balanced but compact
  },
  successButtonText: {
    color: "#ffffff",
    fontSize: 15,                  // Reduced (was 18)
    fontWeight: "bold",
  },
});