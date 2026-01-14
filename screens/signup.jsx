// screens/Signup.jsx — RLMARKET REBRANDED (FIXED: Valid Ionicons lock icon)
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
} from "react-native";
import { TextInput, Button, Checkbox } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import { countries } from "../constants/countries";
import { auth, db } from "../firebaseConfig";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";

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

  const scheme = useColorScheme();
  const isDarkMode = scheme === "dark";

  // 🆕 RLMARKET Theme - EXACT SAME AS LOGIN
  const theme = {
    background: isDarkMode ? "#121212" : "#fafafa",
    card: isDarkMode ? "#1e1e1e" : "#ffffff",
    text: isDarkMode ? "#e0e0e0" : "#1a1a1a",
    textSecondary: isDarkMode ? "#b0b0b0" : "#666",
    primary: isDarkMode ? "#00ff7f" : "#017a6b",
    border: isDarkMode ? "#333" : "#e0e6ed",
  };

  // Auto-detect user country and set currency
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

  const filteredCountries = countries.filter((country) =>
    country.name.toLowerCase().includes(search.toLowerCase())
  );

  const validate = () => {
    let tempErrors = {};
    const nameRegex = /^[A-Za-z]+$/;
    if (!firstName.trim()) tempErrors.firstName = "First name is required";
    else if (!nameRegex.test(firstName.trim()))
      tempErrors.firstName = "First name cannot contain numbers";

    if (!lastName.trim()) tempErrors.lastName = "Last name is required";
    else if (!nameRegex.test(lastName.trim()))
      tempErrors.lastName = "Last name cannot contain numbers";

    const usernameRegex = /^[a-z][a-z0-9_]{4,}$/;
    if (!username.trim()) tempErrors.username = "Username is required";
    else if (!usernameRegex.test(username.trim()))
      tempErrors.username =
        "Username must start with lowercase, min 5 chars, only _ allowed";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) tempErrors.email = "Email is required";
    else if (!emailRegex.test(email.trim()))
      tempErrors.email = "Invalid email format";

    const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[#%&@]).{6,}$/;
    if (!password) tempErrors.password = "Password is required";
    else if (!passwordRegex.test(password))
      tempErrors.password =
        "Password must include 1 uppercase, 1 number, and 1 special character (#%&@)";

    if (password !== confirmPassword)
      tempErrors.confirmPassword = "Passwords do not match";

    if (!agree) tempErrors.agree = "You must agree to Terms & Privacy";

    if (!selectedCountry) tempErrors.country = "Please select your country";

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // ✅ RLMARKET SIGNUP - AUTO CREATES USER DOC
  const handleSignup = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
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
        id: user.uid,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: username.trim(),
        email: email.trim().toLowerCase(),
        country: selectedCountry.code,
        currency: selectedCountry.symbol,
        isVendor: false,
        createdAt: serverTimestamp(),
      });

      setUserCountry(selectedCountry.code);
      setUserCurrency(selectedCountry.symbol);

      Alert.alert("Success", "Account created successfully! Welcome to RLMARKET!");
      navigation.navigate("Login");
    } catch (error) {
      console.error("Signup Error:", error);
      let message = "Signup failed. Please try again.";
      if (error.code === "auth/email-already-in-use") {
        message = "This email is already registered.";
      } else if (error.code === "auth/invalid-email") {
        message = "Invalid email address.";
      } else if (error.code === "auth/weak-password") {
        message = "Password is too weak.";
      }
      Alert.alert("Error", message);
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
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 🆕 RLMARKET Header */}
          <View style={styles.header}>
            <View style={[
              styles.rlBadge,
              { 
                backgroundColor: isDarkMode ? 'rgba(0, 255, 127, 0.1)' : 'rgba(1, 122, 107, 0.08)',
                borderColor: theme.primary
              }
            ]}>
              <Text style={[styles.rlText, { color: theme.primary }]}>RL</Text>
            </View>
            
            <View style={styles.headerContent}>
              <Text style={[styles.welcomeTitle, { color: theme.text }]}>
                Create Account
              </Text>
              <Text style={[styles.welcomeSubtitle, { color: theme.textSecondary }]}>
                Join RLMARKET today
              </Text>
            </View>
          </View>

          {/* 🆕 Signup Card */}
          <View style={[
            styles.signupCard,
            { 
              backgroundColor: theme.card,
              borderColor: theme.border,
              shadowColor: '#000'
            }
          ]}>
            {/* Country Selector */}
            <View style={styles.inputContainer}>
              <View style={styles.inputHeader}>
                <Ionicons name="earth-outline" size={20} color={theme.primary} />
                <Text style={[styles.inputLabel, { color: theme.text }]}>Country</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.countryBox,
                  { 
                    backgroundColor: theme.card,
                    borderColor: theme.border
                  }
                ]}
                onPress={() => setCountryModalVisible(true)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.countryText,
                  { 
                    color: selectedCountry ? theme.text : theme.textSecondary 
                  }
                ]}>
                  {selectedCountry
                    ? `${selectedCountry.flag} ${selectedCountry.name}`
                    : "Select your country"}
                </Text>
                <Ionicons name="chevron-down" size={20} color={theme.primary} />
              </TouchableOpacity>
              {errors.country && <Text style={styles.error}>{errors.country}</Text>}
            </View>

            {/* First Name */}
            <View style={styles.inputContainer}>
              <View style={styles.inputHeader}>
                <Ionicons name="person-outline" size={20} color={theme.primary} />
                <Text style={[styles.inputLabel, { color: theme.text }]}>First Name</Text>
              </View>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                mode="outlined"
                placeholder="Enter your first name"
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
              />
              {errors.firstName && <Text style={styles.error}>{errors.firstName}</Text>}
            </View>

            {/* Last Name */}
            <View style={styles.inputContainer}>
              <View style={styles.inputHeader}>
                <Ionicons name="person-outline" size={20} color={theme.primary} />
                <Text style={[styles.inputLabel, { color: theme.text }]}>Last Name</Text>
              </View>
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                mode="outlined"
                placeholder="Enter your last name"
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
              />
              {errors.lastName && <Text style={styles.error}>{errors.lastName}</Text>}
            </View>

            {/* Username */}
            <View style={styles.inputContainer}>
              <View style={styles.inputHeader}>
                <Ionicons name="at-outline" size={20} color={theme.primary} />
                <Text style={[styles.inputLabel, { color: theme.text }]}>Username</Text>
              </View>
              <TextInput
                value={username}
                onChangeText={setUsername}
                mode="outlined"
                placeholder="Enter your username"
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
              />
              {errors.username && <Text style={styles.error}>{errors.username}</Text>}
            </View>

            {/* Email */}
            <View style={styles.inputContainer}>
              <View style={styles.inputHeader}>
                <Ionicons name="mail-outline" size={20} color={theme.primary} />
                <Text style={[styles.inputLabel, { color: theme.text }]}>Email Address</Text>
              </View>
              <TextInput
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                placeholder="Enter your email"
                placeholderTextColor={theme.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
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
              />
              {errors.email && <Text style={styles.error}>{errors.email}</Text>}
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
              <View style={styles.inputHeader}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.primary} />
                <Text style={[styles.inputLabel, { color: theme.text }]}>Password</Text>
              </View>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                mode="outlined"
                placeholder="Enter your password"
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
                    icon={showPassword ? "eye-off" : "eye"}
                    onPress={() => setShowPassword(!showPassword)}
                    color={theme.primary}
                  />
                }
              />
              {errors.password && <Text style={styles.error}>{errors.password}</Text>}
            </View>

            {/* Confirm Password */}
            <View style={styles.inputContainer}>
              <View style={styles.inputHeader}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.primary} />
                <Text style={[styles.inputLabel, { color: theme.text }]}>Confirm Password</Text>
              </View>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                mode="outlined"
                placeholder="Confirm your password"
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
                    icon={showConfirmPassword ? "eye-off" : "eye"}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    color={theme.primary}
                  />
                }
              />
              {errors.confirmPassword && <Text style={styles.error}>{errors.confirmPassword}</Text>}
            </View>

            {/* Terms Agreement */}
            <View style={styles.agreeContainer}>
              <Checkbox.Android
                status={agree ? "checked" : "unchecked"}
                onPress={() => setAgree(!agree)}
                color={theme.primary}
                uncheckedColor={theme.primary}
              />
              <Text style={[styles.agreeText, { color: theme.text }]}>
                I agree to the{" "}
                <Text style={[styles.linkText, { color: theme.primary }]}>Terms & Privacy Policy</Text>
              </Text>
            </View>
            {errors.agree && <Text style={styles.error}>{errors.agree}</Text>}

            {/* 🆕 Signup Button */}
            <Button
              mode="contained"
              onPress={handleSignup}
              style={[
                styles.signupButton,
                { backgroundColor: theme.primary }
              ]}
              labelStyle={styles.signupButtonText}
              loading={loading}
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </View>

          {/* 🆕 Security Badge */}
          <View style={[
            styles.securityBadge,
            { 
              backgroundColor: 'rgba(1, 122, 107, 0.05)',
              borderColor: 'rgba(1, 122, 107, 0.1)'
            }
          ]}>
            <Ionicons name="shield-checkmark-outline" size={20} color={theme.primary} />
            <Text style={[styles.securityText, { color: theme.textSecondary }]}>
              Your data is secured with encryption
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 🆕 Login CTA - FIXED */}
      <View style={[
        styles.loginContainer,
        { 
          backgroundColor: theme.card,
          borderTopColor: theme.border
        }
      ]}>
        <Text style={[styles.loginText, { color: theme.textSecondary }]}>
          Already have an account?
        </Text>
        <TouchableOpacity
          style={[
            styles.loginButton,
            { 
              backgroundColor: 'rgba(1, 122, 107, 0.08)', 
              borderColor: theme.primary 
            }
          ]}
          onPress={() => navigation.navigate("Login")}
          activeOpacity={0.7}
        >
          <Ionicons name="log-in-outline" size={18} color={theme.primary} />
          <Text style={[styles.loginButtonText, { color: theme.primary }]}>
            Sign In
          </Text>
        </TouchableOpacity>
      </View>

      {/* 🆕 Country Modal - RLMARKET Styled */}
      <Modal
        visible={countryModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCountryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.modalContainer,
            { 
              backgroundColor: theme.card,
              borderTopColor: theme.border,
              borderTopWidth: 1
            }
          ]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Select Country
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setCountryModalVisible(false)}
              >
                <Ionicons name="close-outline" size={24} color={theme.primary} />
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
              contentStyle={{ color: theme.text }}
              theme={{
                colors: {
                  onSurfaceVariant: theme.border,
                  primary: theme.primary,
                },
              }}
              left={<TextInput.Icon icon="magnify" color={theme.primary} />}  // Solid magnify (most common)
            />

            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.countryItem,
                    { 
                      backgroundColor: theme.card,
                      borderBottomColor: theme.border,
                      opacity: item.active ? 1 : 0.5 
                    }
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
        </View>
      </Modal>
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

  // 🆕 RLMARKET Header - EXACT SAME AS LOGIN
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  rlBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    marginRight: 16,
  },
  rlText: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -1.5,
  },
  headerContent: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.5,
    lineHeight: 34,
  },
  welcomeSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 6,
    lineHeight: 22,
  },

  // 🆕 Signup Card
  signupCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
    letterSpacing: 0.3,
  },
  textInput: {
    fontSize: 16,
    fontWeight: '500',
  },
  countryBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    minHeight: 56,
  },
  countryText: {
    fontSize: 16,
    fontWeight: '500',
  },

  // Agreement
  agreeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 20,
    marginBottom: 24,
  },
  agreeText: {
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
    marginLeft: 12,
  },
  linkText: {
    fontWeight: '700',
  },

  // Buttons
  signupButton: {
    paddingVertical: 18,
    borderRadius: 16,
    marginTop: 8,
    elevation: 10,
  },
  signupButtonText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Security Badge
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  securityText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
    lineHeight: 18,
  },

  // FIXED Login CTA
  loginContainer: {
    position: 'absolute',
    bottom: 30,
    left: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  loginText: {
    fontSize: 15,
    fontWeight: '500',
    marginRight: 12,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  loginButtonText: {
    fontSize: 15,
    fontWeight: '800',
    marginLeft: 8,
    letterSpacing: 0.3,
  },

  // Error styling
  error: {
    color: '#ef4444',
    fontSize: 13,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '500',
  },

  // 🆕 Country Modal - RLMARKET Styled
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    padding: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  closeButton: {
    padding: 8,
  },
  searchInput: {
    fontSize: 16,
    fontWeight: '500',
    margin: 24,
    marginBottom: 16,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
  },
  countryFlag: {
    fontSize: 24,
    marginRight: 16,
  },
  countryInfo: {
    flex: 1,
  },
  countryName: {
    fontSize: 16,
    fontWeight: '600',
  },
  countryDetails: {
    fontSize: 14,
    marginTop: 2,
  },
  comingSoon: {
    fontSize: 12,
    fontWeight: '500',
  },
});