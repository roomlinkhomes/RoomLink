// screens/Signup.jsx — FIXED: infinite re-render loop in username check
import React, { useState, useContext, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  Alert,
  Modal,
  FlatList,
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
  TouchableWithoutFeedback,
} from "react-native";
import { TextInput, Checkbox } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import { countries } from "../constants/countries";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";
import { getFunctions, httpsCallable } from "firebase/functions";

const functions = getFunctions();

export default function Signup() {
  const navigation = useNavigation();
  const { setUserCountry, setUserCurrency } = useContext(AuthContext);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // Username availability
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

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

  // Auto-detect country
  useEffect(() => {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    const countryCode = locale.split("-")[1] || "NG";
    const found = countries.find((c) => c.code === countryCode);
    if (found) {
      setSelectedCountry(found);
      setUserCountry(found.code);
      setUserCurrency(found.symbol);
    }
  }, [setUserCountry, setUserCurrency]);

  // Debounce username input to prevent too many checks
  const [debouncedUsername, setDebouncedUsername] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUsername(username.trim().toLowerCase());
    }, 600);

    return () => clearTimeout(timer);
  }, [username]);

  // Username availability check — only runs when debounced value changes
  useEffect(() => {
    const clean = debouncedUsername;

    if (clean.length < 5) {
      setUsernameAvailable(null);
      setCheckingUsername(false);
      return;
    }

    setCheckingUsername(true);
    setUsernameAvailable(null);

    const checkUsername = async () => {
      try {
        const usernameRef = doc(db, "usernames", clean);
        const snap = await getDoc(usernameRef);
        setUsernameAvailable(!snap.exists());
      } catch (err) {
        console.error("Username check failed:", err);
        setUsernameAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    };

    checkUsername();
  }, [debouncedUsername]);

  const filteredCountries = countries.filter((country) =>
    country.name.toLowerCase().includes(search.toLowerCase())
  );

  const validate = () => {
    let tempErrors = {};
    const nameRegex = /^[A-Za-z]+$/;
    const usernameRegex = /^[a-z][a-z0-9_]{4,}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[#%&@]).{6,}$/;

    if (!firstName.trim()) tempErrors.firstName = "Required";
    else if (!nameRegex.test(firstName.trim())) tempErrors.firstName = "No numbers";

    if (!lastName.trim()) tempErrors.lastName = "Required";
    else if (!nameRegex.test(lastName.trim())) tempErrors.lastName = "No numbers";

    const cleanUsername = username.trim().toLowerCase();
    if (!username.trim()) tempErrors.username = "Required";
    else if (!usernameRegex.test(cleanUsername))
      tempErrors.username = "Start with letter, min 5 chars (a-z0-9_)";
    else if (usernameAvailable === false)
      tempErrors.username = "Taken — try another";
    else if (checkingUsername)
      tempErrors.username = "Checking...";

    if (!email.trim()) tempErrors.email = "Required";
    else if (!emailRegex.test(email.trim())) tempErrors.email = "Invalid email";

    if (!password) tempErrors.password = "Required";
    else if (!passwordRegex.test(password))
      tempErrors.password = "1 uppercase, 1 number, 1 special, min 6";

    if (password !== confirmPassword) tempErrors.confirmPassword = "No match";

    if (!agree) tempErrors.agree = "Agree to terms";

    if (!selectedCountry) tempErrors.country = "Select country";

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSendOTP = async () => {
    if (!validate() || usernameAvailable !== true) return;

    setLoading(true);

    try {
      const sendSignupOTP = httpsCallable(functions, "sendSignupOTP");
      await sendSignupOTP({
        email: email.trim(),
        name: `${firstName.trim()} ${lastName.trim()}`,
      });

      navigation.navigate("OtpVerification", {
        email: email.trim(),
        password: password.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: username.trim().toLowerCase(),
        country: selectedCountry,
      });
    } catch (error) {
      console.error("OTP send failed:", error);
      let msg = "Failed to send OTP. Try again.";
      if (error.message?.includes("already-exists")) msg = "Email already registered";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCountry = (country) => {
    setSelectedCountry(country);
    setUserCountry(country.code);
    setUserCurrency(country.symbol);
    setCountryModalVisible(false);
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
                Create Account
              </Text>
              <Text style={[styles.welcomeSubtitle, { color: theme.textSecondary }]}>
                Join RoomLink
              </Text>
            </View>
          </View>

          {/* Slim Signup Card */}
          <View
            style={[
              styles.signupCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            {/* Country */}
            <View style={styles.inputContainer}>
              <TextInput
                value={selectedCountry ? `${selectedCountry.flag} ${selectedCountry.name}` : ""}
                mode="outlined"
                label="Country"
                placeholder="Select country"
                placeholderTextColor={theme.textSecondary}
                editable={false}
                outlineColor={errors.country ? theme.error : theme.border}
                activeOutlineColor={errors.country ? theme.error : theme.primary}
                style={{ backgroundColor: "transparent" }}
                theme={{
                  colors: {
                    onSurfaceVariant: theme.textSecondary,
                    primary: theme.primary,
                    text: theme.text,
                    error: theme.error,
                  },
                }}
                left={<TextInput.Icon icon="earth" color={theme.primary} />}
                right={<TextInput.Icon icon="chevron-down" color={theme.primary} />}
                onFocus={() => setCountryModalVisible(true)}
              />
              {errors.country && <Text style={[styles.errorText, { color: theme.error }]}>{errors.country}</Text>}
            </View>

            {/* First Name */}
            <View style={styles.inputContainer}>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                mode="outlined"
                label="First Name"
                placeholder="Your first name"
                placeholderTextColor={theme.textSecondary}
                outlineColor={errors.firstName ? theme.error : theme.border}
                activeOutlineColor={errors.firstName ? theme.error : theme.primary}
                style={{ backgroundColor: "transparent" }}
                theme={{
                  colors: {
                    onSurfaceVariant: theme.textSecondary,
                    primary: theme.primary,
                    text: theme.text,
                    error: theme.error,
                  },
                }}
                left={<TextInput.Icon icon="account-outline" color={theme.primary} />}
              />
              {errors.firstName && <Text style={[styles.errorText, { color: theme.error }]}>{errors.firstName}</Text>}
            </View>

            {/* Last Name */}
            <View style={styles.inputContainer}>
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                mode="outlined"
                label="Last Name"
                placeholder="Your last name"
                placeholderTextColor={theme.textSecondary}
                outlineColor={errors.lastName ? theme.error : theme.border}
                activeOutlineColor={errors.lastName ? theme.error : theme.primary}
                style={{ backgroundColor: "transparent" }}
                theme={{
                  colors: {
                    onSurfaceVariant: theme.textSecondary,
                    primary: theme.primary,
                    text: theme.text,
                    error: theme.error,
                  },
                }}
                left={<TextInput.Icon icon="account-outline" color={theme.primary} />}
              />
              {errors.lastName && <Text style={[styles.errorText, { color: theme.error }]}>{errors.lastName}</Text>}
            </View>

            {/* Username */}
            <View style={styles.inputContainer}>
              <TextInput
                value={username}
                onChangeText={(val) => setUsername(val.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                mode="outlined"
                label="Username"
                placeholder="e.g. roomlink_bro"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
                outlineColor={
                  checkingUsername ? theme.primary :
                  usernameAvailable === true ? theme.success :
                  usernameAvailable === false ? theme.error :
                  theme.border
                }
                activeOutlineColor={
                  checkingUsername ? theme.primary :
                  usernameAvailable === true ? theme.success :
                  usernameAvailable === false ? theme.error :
                  theme.primary
                }
                style={{ backgroundColor: "transparent" }}
                theme={{
                  colors: {
                    onSurfaceVariant: theme.textSecondary,
                    primary: theme.primary,
                    text: theme.text,
                    error: theme.error,
                  },
                }}
                left={<TextInput.Icon icon="at" color={theme.primary} />}
                right={
                  checkingUsername ? (
                    <TextInput.Icon icon="timer-sand" color={theme.primary} />
                  ) : usernameAvailable === true ? (
                    <TextInput.Icon icon="check-circle" color={theme.success} />
                  ) : usernameAvailable === false ? (
                    <TextInput.Icon icon="close-circle" color={theme.error} />
                  ) : null
                }
              />
              {errors.username && <Text style={[styles.errorText, { color: theme.error }]}>{errors.username}</Text>}
              {usernameAvailable === true && username.length >= 5 && !errors.username && (
                <Text style={[styles.successText, { color: theme.success }]}>Available ✓</Text>
              )}
            </View>

            {/* Email */}
            <View style={styles.inputContainer}>
              <TextInput
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                label="Email"
                placeholder="your@email.com"
                placeholderTextColor={theme.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                outlineColor={errors.email ? theme.error : theme.border}
                activeOutlineColor={errors.email ? theme.error : theme.primary}
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
              />
              {errors.email && <Text style={[styles.errorText, { color: theme.error }]}>{errors.email}</Text>}
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                mode="outlined"
                label="Password"
                placeholder="••••••••"
                placeholderTextColor={theme.textSecondary}
                outlineColor={errors.password ? theme.error : theme.border}
                activeOutlineColor={errors.password ? theme.error : theme.primary}
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
              />
              {errors.password && <Text style={[styles.errorText, { color: theme.error }]}>{errors.password}</Text>}
            </View>

            {/* Confirm Password */}
            <View style={styles.inputContainer}>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                mode="outlined"
                label="Confirm Password"
                placeholder="••••••••"
                placeholderTextColor={theme.textSecondary}
                outlineColor={errors.confirmPassword ? theme.error : theme.border}
                activeOutlineColor={errors.confirmPassword ? theme.error : theme.primary}
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
                    icon={showConfirmPassword ? "eye-off" : "eye"}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    color={theme.primary}
                  />
                }
              />
              {errors.confirmPassword && <Text style={[styles.errorText, { color: theme.error }]}>{errors.confirmPassword}</Text>}
            </View>

            {/* Terms */}
            <View style={styles.agreeContainer}>
              <Checkbox.Android
                status={agree ? "checked" : "unchecked"}
                onPress={() => setAgree(!agree)}
                color={theme.primary}
                uncheckedColor={theme.border}
              />
              <Text style={[styles.agreeText, { color: theme.text }]}>
                I agree to the{" "}
                <Text style={[styles.linkText, { color: theme.primary }]}>Terms & Privacy</Text>
              </Text>
            </View>
            {errors.agree && <Text style={[styles.errorText, { color: theme.error }]}>{errors.agree}</Text>}

            {/* Signup Button */}
            <TouchableOpacity
              style={[
                styles.signupButton,
                { backgroundColor: theme.primary, opacity: loading || checkingUsername ? 0.7 : 1 },
              ]}
              onPress={handleSendOTP}
              disabled={loading || checkingUsername}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text style={styles.signupButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Login CTA */}
          <View style={styles.loginContainer}>
            <Text style={[styles.loginText, { color: theme.textSecondary }]}>
              Already have an account?
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={[styles.loginLink, { color: theme.primary }]}>
                Sign in
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Country Modal */}
      <Modal
        visible={countryModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCountryModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setCountryModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[
                styles.modalContainer,
                { backgroundColor: theme.card, borderTopColor: theme.border }
              ]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>Select Country</Text>
                  <TouchableOpacity onPress={() => setCountryModalVisible(false)}>
                    <Ionicons name="close" size={24} color={theme.primary} />
                  </TouchableOpacity>
                </View>

                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  mode="outlined"
                  placeholder="Search country..."
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.searchInput, { color: theme.text }]}
                  outlineColor={theme.border}
                  activeOutlineColor={theme.primary}
                  theme={{
                    colors: {
                      onSurfaceVariant: theme.textSecondary,
                      primary: theme.primary,
                      text: theme.text,
                    },
                  }}
                  left={<TextInput.Icon icon="magnify" color={theme.primary} />}
                />

                <FlatList
                  data={filteredCountries}
                  keyExtractor={(item) => item.code}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.countryItem,
                        { borderBottomColor: theme.border }
                      ]}
                      onPress={() => handleSelectCountry(item)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.countryFlag}>{item.flag}</Text>
                      <View style={styles.countryInfo}>
                        <Text style={[styles.countryName, { color: theme.text }]}>
                          {item.name}
                        </Text>
                        <Text style={[styles.countryDetails, { color: theme.textSecondary }]}>
                          {item.symbol} {item.currency}
                        </Text>
                      </View>
                      {!item.active && (
                        <Text style={[styles.comingSoon, { color: theme.textSecondary }]}>
                          Coming Soon
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
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
    marginBottom: 32,
  },
  rlBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    marginRight: 12,
  },
  rlText: { fontSize: 18, fontWeight: "900", letterSpacing: -1 },
  headerContent: { flex: 1 },
  welcomeTitle: { fontSize: 24, fontWeight: "900" },
  welcomeSubtitle: { fontSize: 14, marginTop: 4 },
  signupCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  inputContainer: { marginBottom: 14 },
  countryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  countryFlag: { fontSize: 22, marginRight: 12 },
  countryInfo: { flex: 1 },
  countryName: { fontSize: 15, fontWeight: "600" },
  countryDetails: { fontSize: 13, marginTop: 1 },
  comingSoon: { fontSize: 12, fontWeight: "500" },
  agreeContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 12,
    marginBottom: 16,
  },
  agreeText: { fontSize: 14, lineHeight: 20, flex: 1, marginLeft: 8 },
  linkText: { fontWeight: "700" },
  signupButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  signupButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 28,
  },
  loginText: { fontSize: 14 },
  loginLink: {
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 6,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  successText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  searchInput: { margin: 16, marginBottom: 8 },
});