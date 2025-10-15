import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  useColorScheme,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { nigeriaData } from "../data/nigeriaData";
import { useNavigation } from "@react-navigation/native";

export default function Checkout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const navigation = useNavigation();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    state: "",
    city: "",
    lga: "",
    address: "",
  });

  const [modals, setModals] = useState({
    state: false,
    city: false,
    lga: false,
  });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedState, setSelectedState] = useState(null);

  const theme = {
    background: isDark ? "#121212" : "#fff",
    text: isDark ? "#fff" : "#000",
    inputBorder: isDark ? "#444" : "#ccc",
    modalBackground: isDark ? "#1e1e1e" : "#fff",
  };

  // === SELECTORS ===
  const handleSelectState = (stateObj) => {
    setLoading(true);
    setTimeout(() => {
      setSelectedState(stateObj);
      setForm({ ...form, state: stateObj.state, city: "", lga: "" });
      setModals({ ...modals, state: false });
      setLoading(false);
    }, 600);
  };

  const handleSelectCity = (capital) => {
    setLoading(true);
    setTimeout(() => {
      setForm({ ...form, city: capital, lga: "" });
      setModals({ ...modals, city: false, lga: true });
      setLoading(false);
    }, 600);
  };

  const handleSelectLga = (lga) => {
    setForm({ ...form, lga });
    setModals({ ...modals, lga: false });
  };

  const filteredStates = nigeriaData.filter((item) =>
    item.state.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = () => {
    // Basic validation
    if (
      !form.firstName ||
      !form.lastName ||
      !form.phone ||
      !form.state ||
      !form.city ||
      !form.lga ||
      !form.address
    ) {
      alert("Please fill in all required fields (*)");
      return;
    }

    // Navigate to OrderSummary with data
    navigation.navigate("OrderSummary", { deliveryInfo: form });
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.container}
        enableOnAndroid
        extraScrollHeight={140}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.header, { color: theme.text }]}>
          Delivery Information
        </Text>

        {/* === FIRST NAME === */}
        <Text style={[styles.label, { color: theme.text }]}>
          First Name <Text style={{ color: "red" }}>*</Text>
        </Text>
        <TextInput
          placeholder="Enter first name"
          placeholderTextColor={isDark ? "#aaa" : "#888"}
          value={form.firstName}
          onChangeText={(v) => setForm({ ...form, firstName: v })}
          style={[
            styles.input,
            {
              borderColor: theme.inputBorder,
              color: theme.text,
              backgroundColor: isDark ? "#1a1a1a" : "#f9f9f9",
            },
          ]}
        />

        {/* === LAST NAME === */}
        <Text style={[styles.label, { color: theme.text }]}>
          Last Name <Text style={{ color: "red" }}>*</Text>
        </Text>
        <TextInput
          placeholder="Enter last name"
          placeholderTextColor={isDark ? "#aaa" : "#888"}
          value={form.lastName}
          onChangeText={(v) => setForm({ ...form, lastName: v })}
          style={[
            styles.input,
            {
              borderColor: theme.inputBorder,
              color: theme.text,
              backgroundColor: isDark ? "#1a1a1a" : "#f9f9f9",
            },
          ]}
        />

        {/* === STATE === */}
        <Text style={[styles.label, { color: theme.text }]}>
          State <Text style={{ color: "red" }}>*</Text>
        </Text>
        <TouchableOpacity onPress={() => setModals({ ...modals, state: true })}>
          <TextInput
            placeholder="Select state"
            placeholderTextColor={isDark ? "#aaa" : "#888"}
            value={form.state}
            editable={false}
            style={[
              styles.input,
              {
                borderColor: theme.inputBorder,
                color: theme.text,
                backgroundColor: isDark ? "#1a1a1a" : "#f9f9f9",
              },
            ]}
          />
        </TouchableOpacity>

        {/* === CITY === */}
        {form.state ? (
          <>
            <Text style={[styles.label, { color: theme.text }]}>
              City <Text style={{ color: "red" }}>*</Text>
            </Text>
            <TouchableOpacity
              onPress={() => setModals({ ...modals, city: true })}
            >
              <TextInput
                placeholder="Select city"
                placeholderTextColor={isDark ? "#aaa" : "#888"}
                value={form.city}
                editable={false}
                style={[
                  styles.input,
                  {
                    borderColor: theme.inputBorder,
                    color: theme.text,
                    backgroundColor: isDark ? "#1a1a1a" : "#f9f9f9",
                  },
                ]}
              />
            </TouchableOpacity>
          </>
        ) : null}

        {/* === LGA === */}
        {form.city ? (
          <>
            <Text style={[styles.label, { color: theme.text }]}>
              LGA <Text style={{ color: "red" }}>*</Text>
            </Text>
            <TouchableOpacity
              onPress={() => setModals({ ...modals, lga: true })}
            >
              <TextInput
                placeholder="Select LGA"
                placeholderTextColor={isDark ? "#aaa" : "#888"}
                value={form.lga}
                editable={false}
                style={[
                  styles.input,
                  {
                    borderColor: theme.inputBorder,
                    color: theme.text,
                    backgroundColor: isDark ? "#1a1a1a" : "#f9f9f9",
                  },
                ]}
              />
            </TouchableOpacity>
          </>
        ) : null}

        {/* === PHONE === */}
        <Text style={[styles.label, { color: theme.text }]}>
          Phone Number <Text style={{ color: "red" }}>*</Text>
        </Text>
        <View style={styles.phoneContainer}>
          <View style={styles.phonePrefix}>
            <Text style={{ color: theme.text }}>🇳🇬 +234</Text>
          </View>
          <TextInput
            placeholder="Enter 11 digit number"
            placeholderTextColor={isDark ? "#aaa" : "#888"}
            keyboardType="phone-pad"
            maxLength={11}
            value={form.phone}
            onChangeText={(v) => setForm({ ...form, phone: v })}
            style={[
              styles.phoneInput,
              {
                borderColor: theme.inputBorder,
                color: theme.text,
                backgroundColor: isDark ? "#1a1a1a" : "#f9f9f9",
              },
            ]}
          />
        </View>

        {/* === ADDRESS === */}
        <Text style={[styles.label, { color: theme.text }]}>
          Delivery Address <Text style={{ color: "red" }}>*</Text>
        </Text>
        <TextInput
          placeholder="Enter full address"
          placeholderTextColor={isDark ? "#aaa" : "#888"}
          multiline
          numberOfLines={3}
          value={form.address}
          onChangeText={(v) => setForm({ ...form, address: v })}
          style={[
            styles.input,
            {
              height: 100,
              textAlignVertical: "top",
              borderColor: theme.inputBorder,
              color: theme.text,
              backgroundColor: isDark ? "#1a1a1a" : "#f9f9f9",
            },
          ]}
        />

        {/* === SAVE BUTTON === */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Ionicons name="save-outline" size={18} color="#fff" />
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>

      {/* ==== STATE MODAL ==== */}
      <Modal visible={modals.state} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View
            style={[
              styles.modalBox,
              { backgroundColor: theme.modalBackground },
            ]}
          >
            <TouchableOpacity
              onPress={() => setModals({ ...modals, state: false })}
              style={styles.modalCloseIcon}
            >
              <Ionicons name="close" size={22} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.modalHeader, { color: theme.text }]}>
              Select State
            </Text>
            <TextInput
              placeholder="Search state"
              placeholderTextColor={isDark ? "#aaa" : "#888"}
              style={[
                styles.searchInput,
                {
                  borderColor: theme.inputBorder,
                  color: theme.text,
                  backgroundColor: isDark ? "#1a1a1a" : "#f9f9f9",
                },
              ]}
              value={search}
              onChangeText={setSearch}
            />

            {loading ? (
              <ActivityIndicator size="small" color="#007bff" />
            ) : (
              <ScrollView>
                {filteredStates.map((item) => (
                  <TouchableOpacity
                    key={item.state}
                    onPress={() => handleSelectState(item)}
                  >
                    <Text style={[styles.modalItem, { color: theme.text }]}>
                      {item.state}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ==== CITY MODAL ==== */}
      <Modal visible={modals.city} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View
            style={[
              styles.modalBox,
              { backgroundColor: theme.modalBackground },
            ]}
          >
            <TouchableOpacity
              onPress={() => setModals({ ...modals, city: false })}
              style={styles.modalCloseIcon}
            >
              <Ionicons name="close" size={22} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.modalHeader, { color: theme.text }]}>
              Select City
            </Text>
            {loading ? (
              <ActivityIndicator size="small" color="#007bff" />
            ) : (
              selectedState && (
                <TouchableOpacity
                  onPress={() => handleSelectCity(selectedState.capital)}
                >
                  <Text style={[styles.modalItem, { color: theme.text }]}>
                    {selectedState.capital}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>
        </View>
      </Modal>

      {/* ==== LGA MODAL ==== */}
      <Modal visible={modals.lga} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View
            style={[
              styles.modalBox,
              { backgroundColor: theme.modalBackground },
            ]}
          >
            <TouchableOpacity
              onPress={() => setModals({ ...modals, lga: false })}
              style={styles.modalCloseIcon}
            >
              <Ionicons name="close" size={22} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.modalHeader, { color: theme.text }]}>
              Select LGA
            </Text>
            {loading ? (
              <ActivityIndicator size="small" color="#007bff" />
            ) : (
              <ScrollView>
                {selectedState?.lgas?.map((lga) => (
                  <TouchableOpacity
                    key={lga}
                    onPress={() => handleSelectLga(lga)}
                  >
                    <Text style={[styles.modalItem, { color: theme.text }]}>
                      {lga}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flexGrow: 1,
  },
  header: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 20,
  },
  label: {
    marginBottom: 6,
    fontSize: 14,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  phoneContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  phonePrefix: {
    borderWidth: 1,
    borderColor: "#ccc",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  phoneInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  saveBtn: {
    backgroundColor: "#007bff",
    paddingVertical: 15,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 20,
  },
  saveText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalBox: {
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "60%",
  },
  modalHeader: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  modalItem: {
    fontSize: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderColor: "#555",
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  modalCloseIcon: {
    position: "absolute",
    top: 15,
    right: 15,
    zIndex: 2,
  },
});
