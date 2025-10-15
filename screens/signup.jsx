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
} from "react-native";
import { TextInput, Button, Checkbox } from "react-native-paper";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { AuthContext } from "../context/AuthContext";
import { countries } from "../constants/countries";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const API_URL = "http://192.168.244.32:5000";

export default function Signup({ navigation }) {
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

  const isDark = useColorScheme() === "dark";

  // ✅ Auto-detect country from device locale
  useEffect(() => {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    const countryCode = locale.split("-")[1] || "NG";
    const found = countries.find((c) => c.code === countryCode);
    if (found) {
      setSelectedCountry(found);
      setUserCountry(found.code);
      setUserCurrency(found.symbol);
    }
  }, []);

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

    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    if (!email.trim()) tempErrors.email = "Email is required";
    else if (!emailRegex.test(email.trim()))
      tempErrors.email = "Invalid email";

    const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[#%&@]).{6,}$/;
    if (!password) tempErrors.password = "Password is required";
    else if (!passwordRegex.test(password))
      tempErrors.password =
        "Password must have 1 uppercase, 1 number, 1 special (#%&@)";

    if (password !== confirmPassword)
      tempErrors.confirmPassword = "Passwords do not match";

    if (!agree) tempErrors.agree = "You must agree to Terms & Privacy";

    if (!selectedCountry) tempErrors.country = "Please select your country";

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;

    const countryData = countries.find(
      (c) => c.code === selectedCountry?.code
    );

    if (!countryData?.active) {
      Alert.alert(
        "Coming Soon",
        "RoomLink is not yet available in your region. Stay tuned!"
      );
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          username,
          email,
          password,
          country: selectedCountry.code,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Signup failed");

      setUserCountry(selectedCountry.code);
      setUserCurrency(selectedCountry.symbol);

      Alert.alert(
        "✅ Account Created",
        "Verification link sent! Please check your inbox."
      );
      navigation.navigate("Login");
    } catch (error) {
      console.error("Signup Error:", error);
      Alert.alert("❌ Error", error.message || "Could not sign up. Try again.");
    }
  };

  const handleSelectCountry = (country) => {
    setSelectedCountry(country);
    setUserCountry(country.code);
    setUserCurrency(country.symbol);
    setCountryModalVisible(false);
  };

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: isDark ? "#000" : "#f5f5f5" },
      ]}
      enableOnAndroid
      extraScrollHeight={20}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.title, { color: isDark ? "#fff" : "#000" }]}>
        Fill in your details to create an account
      </Text>

      {/* Country selector */}
      <TouchableOpacity
        style={[
          styles.countryBox,
          { backgroundColor: isDark ? "#1e1e1e" : "#fff" },
        ]}
        onPress={() => setCountryModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text
          style={{
            color: selectedCountry ? (isDark ? "#fff" : "#000") : "#aaa",
          }}
        >
          {selectedCountry
            ? `${selectedCountry.flag}  ${selectedCountry.name}`
            : "Select Country"}
        </Text>
        <Icon
          name="chevron-down"
          size={22}
          color={isDark ? "#ccc" : "#555"}
        />
      </TouchableOpacity>
      {errors.country && <Text style={styles.error}>{errors.country}</Text>}

      {/* Country selection modal */}
      <Modal
        visible={countryModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCountryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: isDark ? "#1e1e1e" : "#fff" },
            ]}
          >
            {/* X button */}
            <TouchableOpacity
              style={styles.closeX}
              onPress={() => setCountryModalVisible(false)}
            >
              <Text style={{ color: isDark ? "#fff" : "#000", fontSize: 20 }}>
                ✕
              </Text>
            </TouchableOpacity>

            {/* Modal label */}
            <Text
              style={[styles.modalLabel, { color: isDark ? "#fff" : "#000" }]}
            >
              Select Country
            </Text>

            {/* Search input with icon */}
            <TextInput
              placeholder="Search country and region"
              value={search}
              onChangeText={setSearch}
              mode="outlined"
              style={[
                styles.searchInput,
                { backgroundColor: isDark ? "#111" : "#fafafa" },
              ]}
              outlineColor="#036dd6"
              activeOutlineColor="#036dd6"
              textColor={isDark ? "#fff" : "#000"}
              placeholderTextColor={isDark ? "#888" : "#666"}
              left={<TextInput.Icon icon="magnify" color="#036dd6" />}
            />

            {/* Country list */}
            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.countryItem, { opacity: item.active ? 1 : 0.5 }]}
                  onPress={() => handleSelectCountry(item)}
                >
                  <Text style={styles.flag}>{item.flag}</Text>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: isDark ? "#fff" : "#000",
                        fontWeight: "500",
                      }}
                    >
                      {item.name}
                    </Text>
                    <Text style={{ color: "#777", fontSize: 12 }}>
                      {item.symbol} {item.currency}
                    </Text>
                  </View>
                  {!item.active && (
                    <Text style={{ color: "#888", fontSize: 11 }}>
                      Coming Soon
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Other Inputs */}
      <TextInput
        label="First Name"
        value={firstName}
        onChangeText={setFirstName}
        mode="outlined"
        style={[styles.input, { backgroundColor: isDark ? "#1e1e1e" : "#fff" }]}
        outlineColor="#036dd6"
        activeOutlineColor="#036dd6"
        textColor={isDark ? "#fff" : "#000"}
      />
      {errors.firstName && <Text style={styles.error}>{errors.firstName}</Text>}

      <TextInput
        label="Last Name"
        value={lastName}
        onChangeText={setLastName}
        mode="outlined"
        style={[styles.input, { backgroundColor: isDark ? "#1e1e1e" : "#fff" }]}
        outlineColor="#036dd6"
        activeOutlineColor="#036dd6"
        textColor={isDark ? "#fff" : "#000"}
      />
      {errors.lastName && <Text style={styles.error}>{errors.lastName}</Text>}

      <TextInput
        label="Username"
        value={username}
        onChangeText={setUsername}
        mode="outlined"
        style={[styles.input, { backgroundColor: isDark ? "#1e1e1e" : "#fff" }]}
        outlineColor="#036dd6"
        activeOutlineColor="#036dd6"
        textColor={isDark ? "#fff" : "#000"}
      />
      {errors.username && <Text style={styles.error}>{errors.username}</Text>}

      <TextInput
        label="Email Address"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        keyboardType="email-address"
        style={[styles.input, { backgroundColor: isDark ? "#1e1e1e" : "#fff" }]}
        outlineColor="#036dd6"
        activeOutlineColor="#036dd6"
        textColor={isDark ? "#fff" : "#000"}
      />
      {errors.email && <Text style={styles.error}>{errors.email}</Text>}

      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!showPassword}
        mode="outlined"
        style={[styles.input, { backgroundColor: isDark ? "#1e1e1e" : "#fff" }]}
        outlineColor="#036dd6"
        activeOutlineColor="#036dd6"
        textColor={isDark ? "#fff" : "#000"}
        right={
          <TextInput.Icon
            icon={showPassword ? "eye-off" : "eye"}
            onPress={() => setShowPassword(!showPassword)}
          />
        }
      />
      {errors.password && <Text style={styles.error}>{errors.password}</Text>}

      <TextInput
        label="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry={!showConfirmPassword}
        mode="outlined"
        style={[styles.input, { backgroundColor: isDark ? "#1e1e1e" : "#fff" }]}
        outlineColor="#036dd6"
        activeOutlineColor="#036dd6"
        textColor={isDark ? "#fff" : "#000"}
        right={
          <TextInput.Icon
            icon={showConfirmPassword ? "eye-off" : "eye"}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          />
        }
      />
      {errors.confirmPassword && (
        <Text style={styles.error}>{errors.confirmPassword}</Text>
      )}

      <View style={styles.agreeRow}>
        <Checkbox.Android
          status={agree ? "checked" : "unchecked"}
          onPress={() => setAgree(!agree)}
          color="#036dd6"
        />
        <Text style={[styles.agreeText, { color: isDark ? "#fff" : "#000" }]}>
          I agree to the{" "}
          <Text style={styles.linkText}>Terms & Privacy Policy</Text>
        </Text>
      </View>
      {errors.agree && <Text style={styles.error}>{errors.agree}</Text>}

      <Button
        mode="contained"
        onPress={handleSignup}
        style={styles.signupButton}
        labelStyle={{ color: "#fff" }}
      >
        Sign Up
      </Button>

      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.link}>Already have an account? Login</Text>
      </TouchableOpacity>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20 },
  title: { fontSize: 18, fontWeight: "500", marginBottom: 20 },
  input: { marginBottom: 15 },
  signupButton: {
    backgroundColor: "#036dd6",
    paddingVertical: 10,
    marginTop: 10,
    borderRadius: 10,
  },
  link: { marginTop: 10, color: "#036dd6", textAlign: "center" },
  error: { color: "red", marginBottom: 10, marginLeft: 4, fontSize: 12 },
  agreeRow: { flexDirection: "row", alignItems: "center", marginVertical: 10 },
  agreeText: { fontSize: 14, flexShrink: 1 },
  linkText: { color: "#036dd6", fontWeight: "600" },
  countryBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#036dd6",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    height: "80%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  closeX: {
    position: "absolute",
    right: 20,
    top: 15,
    zIndex: 2,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 10,
    textAlign: "center",
  },
  searchInput: {
    marginBottom: 15,
  },
  countryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderColor: "#ddd",
  },
  flag: { fontSize: 25, marginRight: 10 },
});
