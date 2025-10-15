import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
} from "react-native";
import { TextInput, Button } from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useUser } from "../context/UserContext";

export default function OtpVerification() {
  const { createUser } = useUser();
  const navigation = useNavigation();
  const route = useRoute();
  const isDark = useColorScheme() === "dark";

  // Safely get params from route
  const {
    firstName = "",
    lastName = "",
    username = "",
    email = "",
    password = "",
  } = route.params || {};

  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [timer, setTimer] = useState(60);
  const [resending, setResending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Generate OTP once
  useEffect(() => {
    generateOtp();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // Generate OTP
  const generateOtp = () => {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otpCode);
    console.log(`OTP for ${email}: ${otpCode}`); // For testing
  };

  // Handle OTP resend
  const handleResend = () => {
    if (resending || timer > 0) return;
    setResending(true);
    generateOtp();
    setTimer(60);
    setTimeout(() => {
      Alert.alert("OTP Sent", `New OTP logged to console for ${email}`);
      setResending(false);
    }, 500);
  };

  // Verify OTP
  const handleVerify = async () => {
    if (otp.length !== 6) return;
    setVerifying(true);

    if (otp === generatedOtp) {
      try {
        // Save all user info to context
        await createUser({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          username: username.trim(),
          email: email.trim(),
          password,
          verified: true,
        });

        setVerifying(false);
        Alert.alert("Success", "Your email has been verified!", [
          { text: "OK", onPress: () => navigation.replace("RoleSelection") },
        ]);
      } catch (error) {
        setVerifying(false);
        Alert.alert("Error", "Failed to create user. Try again.");
        console.log("Error creating user:", error);
      }
    } else {
      setVerifying(false);
      Alert.alert("Incorrect OTP", "Please check the code and try again.");
    }
  };

  const handleOtpChange = (text) => {
    setOtp(text);
    if (text.length === 6) handleVerify();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: isDark ? "#121212" : "#fff" }]}
    >
      <View style={styles.inner}>
        <Text style={[styles.heading, { color: isDark ? "#fff" : "#000" }]}>
          Verify Your Email
        </Text>
        <Text style={[styles.subheading, { color: isDark ? "#aaa" : "#555" }]}>
          Enter the 6-digit code sent to {email} (check console)
        </Text>

        <TextInput
          label="OTP"
          placeholder="Enter OTP"
          value={otp}
          onChangeText={handleOtpChange}
          keyboardType="numeric"
          maxLength={6}
          mode="outlined"
          style={[styles.input, { backgroundColor: isDark ? "#1e1e1e" : "#fff" }]}
          outlineColor="#036DD6"
          activeOutlineColor="#036DD6"
          textColor={isDark ? "#fff" : "#000"}
        />

        <Button
          mode="contained"
          onPress={handleVerify}
          loading={verifying}
          style={{ backgroundColor: "#036DD6", marginTop: 20 }}
          contentStyle={{ paddingVertical: 12 }}
        >
          Verify
        </Button>

        <View style={styles.resendRow}>
          <Text style={{ color: isDark ? "#aaa" : "#555" }}>Didn't receive the code?</Text>
          <TouchableOpacity onPress={handleResend} disabled={resending || timer > 0}>
            <Text style={{ color: timer > 0 ? "#888" : "#036DD6", marginLeft: 5 }}>
              {timer > 0 ? `Resend in ${timer}s` : "Resend OTP"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { padding: 20, flex: 1, justifyContent: "center" },
  heading: { fontSize: 24, fontWeight: "bold", marginBottom: 10, textAlign: "center" },
  subheading: { fontSize: 14, marginBottom: 20, textAlign: "center" },
  input: { marginBottom: 15 },
  resendRow: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
});
