import React, { useState, useEffect } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { nigeriaData } from "../data/nigeriaData";
import { useNavigation } from "@react-navigation/native";

// ✅ Firebase imports
import { auth } from "../firebaseConfig";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const db = getFirestore();

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

  // 🆕 RLMARKET Theme (Minimal)
  const theme = {
    background: isDark ? "#121212" : "#fafafa",
    text: isDark ? "#e0e0e0" : "#1a1a1a",
    textSecondary: isDark ? "#b0b0b0" : "#666",
    inputBorder: isDark ? "#333" : "#e0e6ed",
    inputBackground: isDark ? "#2a2a2a" : "#f8f9fa",
    primary: isDark ? "#00ff7f" : "#017a6b",
    error: "#ed5e5e",
    modalBackground: isDark ? "#1e1e1e" : "#ffffff",
    card: isDark ? "#1e1e1e" : "#ffffff",
  };

  // ✅ Fetch saved delivery info
  useEffect(() => {
    const fetchSavedInfo = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const docRef = doc(db, "users", user.uid, "data", "deliveryInfo");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setForm(docSnap.data());
          console.log("Loaded saved delivery info");
        }
      } catch (error) {
        console.log("❌ Error fetching delivery info:", error);
      }
    };

    fetchSavedInfo();
  }, []);

  // === Selectors ===
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

  // ✅ Save to Firestore + Navigate
  const handleSave = async () => {
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

    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        alert("You need to be signed in to continue.");
        setLoading(false);
        return;
      }

      const docRef = doc(db, "users", user.uid, "data", "deliveryInfo");
      await setDoc(docRef, form, { merge: true });

      alert("✅ Delivery info saved successfully!");

      // ✅ Pass full delivery info to OrderSummary
      navigation.navigate("OrderSummary", {
        deliveryInfo: form,
      });
    } catch (error) {
      console.log("❌ Error saving delivery info:", error);
      alert("Error saving info. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* 🆕 RLMARKET Header */}
      <View style={styles.pageHeader}>
        <View style={[
          styles.rlBadge,
          { 
            backgroundColor: isDark ? 'rgba(0, 255, 127, 0.1)' : 'rgba(1, 122, 107, 0.08)'
          }
        ]}>
          <Text style={[styles.rlText, { color: theme.primary }]}>RL</Text>
        </View>
        <View style={styles.headerContent}>
          <Text style={[styles.pageTitle, { color: theme.text }]}>
            Delivery Information
          </Text>
          <Text style={[styles.pageSubtitle, { color: theme.textSecondary }]}>
            Complete your delivery details
          </Text>
        </View>
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={styles.container}
        enableOnAndroid
        extraScrollHeight={140}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* === FIRST NAME === */}
        <Text style={[styles.label, { color: theme.text }]}>
          First Name <Text style={{ color: theme.error }}>*</Text>
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
              backgroundColor: theme.inputBackground,
            },
          ]}
        />

        {/* === LAST NAME === */}
        <Text style={[styles.label, { color: theme.text }]}>
          Last Name <Text style={{ color: theme.error }}>*</Text>
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
              backgroundColor: theme.inputBackground,
            },
          ]}
        />

        {/* === STATE === */}
        <Text style={[styles.label, { color: theme.text }]}>
          State <Text style={{ color: theme.error }}>*</Text>
        </Text>
        <TouchableOpacity onPress={() => setModals({ ...modals, state: true })}>
          <View style={[
            styles.selectorInput,
            {
              borderColor: theme.inputBorder,
              backgroundColor: theme.inputBackground,
            }
          ]}>
            <Text 
              style={[
                styles.selectorText,
                { 
                  color: form.state ? theme.text : (isDark ? "#aaa" : "#888") 
                }
              ]}
            >
              {form.state || "Select state"}
            </Text>
            <Ionicons name="chevron-down" size={20} color={theme.textSecondary} />
          </View>
        </TouchableOpacity>

        {/* === CITY === */}
        {form.state ? (
          <>
            <Text style={[styles.label, { color: theme.text }]}>
              City <Text style={{ color: theme.error }}>*</Text>
            </Text>
            <TouchableOpacity onPress={() => setModals({ ...modals, city: true })}>
              <View style={[
                styles.selectorInput,
                {
                  borderColor: theme.inputBorder,
                  backgroundColor: theme.inputBackground,
                }
              ]}>
                <Text 
                  style={[
                    styles.selectorText,
                    { 
                      color: form.city ? theme.text : (isDark ? "#aaa" : "#888") 
                    }
                  ]}
                >
                  {form.city || "Select city"}
                </Text>
                <Ionicons name="chevron-down" size={20} color={theme.textSecondary} />
              </View>
            </TouchableOpacity>
          </>
        ) : null}

        {/* === LGA === */}
        {form.city ? (
          <>
            <Text style={[styles.label, { color: theme.text }]}>
              LGA <Text style={{ color: theme.error }}>*</Text>
            </Text>
            <TouchableOpacity onPress={() => setModals({ ...modals, lga: true })}>
              <View style={[
                styles.selectorInput,
                {
                  borderColor: theme.inputBorder,
                  backgroundColor: theme.inputBackground,
                }
              ]}>
                <Text 
                  style={[
                    styles.selectorText,
                    { 
                      color: form.lga ? theme.text : (isDark ? "#aaa" : "#888") 
                    }
                  ]}
                >
                  {form.lga || "Select LGA"}
                </Text>
                <Ionicons name="chevron-down" size={20} color={theme.textSecondary} />
              </View>
            </TouchableOpacity>
          </>
        ) : null}

        {/* === PHONE === */}
        <Text style={[styles.label, { color: theme.text }]}>
          Phone Number <Text style={{ color: theme.error }}>*</Text>
        </Text>
        <View style={styles.phoneContainer}>
          <View style={[
            styles.phonePrefix,
            { 
              backgroundColor: theme.inputBackground,
              borderColor: theme.inputBorder 
            }
          ]}>
            <Text style={[styles.phonePrefixText, { color: theme.textSecondary }]}>
              🇳🇬 +234
            </Text>
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
                backgroundColor: theme.inputBackground,
              },
            ]}
          />
        </View>

        {/* === ADDRESS === */}
        <Text style={[styles.label, { color: theme.text }]}>
          Delivery Address <Text style={{ color: theme.error }}>*</Text>
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
              backgroundColor: theme.inputBackground,
            },
          ]}
        />

        {/* === SAVE BUTTON === */}
        <TouchableOpacity 
          style={[
            styles.saveBtn,
            { backgroundColor: theme.primary }
          ]} 
          onPress={handleSave}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.saveText}>Save & Continue</Text>
            </>
          )}
        </TouchableOpacity>
      </KeyboardAwareScrollView>

      {/* ✅ MODALS KEPT EXACTLY THE SAME */}
      {/* STATE */}
      <Modal visible={modals.state} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View
            style={[styles.modalBox, { backgroundColor: theme.modalBackground }]}
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
                  backgroundColor: isDark ? "#2a2a2a" : "#f8f9fa",
                },
              ]}
              value={search}
              onChangeText={setSearch}
            />

            {loading ? (
              <ActivityIndicator size="small" color={theme.primary} />
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

      {/* CITY */}
      <Modal visible={modals.city} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View
            style={[styles.modalBox, { backgroundColor: theme.modalBackground }]}
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
              <ActivityIndicator size="small" color={theme.primary} />
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

      {/* LGA */}
      <Modal visible={modals.lga} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View
            style={[styles.modalBox, { backgroundColor: theme.modalBackground }]}
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
              <ActivityIndicator size="small" color={theme.primary} />
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
  // 🆕 RLMARKET Header
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'transparent',
  },
  rlBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(1, 122, 107, 0.2)',
  },
  rlText: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -1,
  },
  headerContent: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pageSubtitle: {
    fontSize: 15,
    fontWeight: '500',
    marginTop: 4,
  },

  // ✅ Original Layout Preserved
  container: { 
    padding: 20, 
    flexGrow: 1,
    paddingBottom: 120, // Extra space for fixed button
  },
  label: { 
    marginBottom: 6, 
    fontSize: 15, 
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  // 🆕 Selector Inputs (Minimal Enhancement)
  selectorInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  selectorText: {
    fontSize: 16,
    flex: 1,
  },

  phoneContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 20 
  },
  phonePrefix: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginRight: 12,
    minWidth: 85,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  phonePrefixText: {
    fontSize: 14,
    fontWeight: '600',
  },
  phoneInput: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  // 🆕 Fixed Save Button
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 20,
    minHeight: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  saveText: { 
    color: "#fff", 
    fontSize: 17, 
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // ✅ ORIGINAL MODAL STYLES (UNCHANGED)
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
    fontWeight: "700", 
    marginBottom: 15,
    letterSpacing: 0.3,
  },
  modalItem: {
    fontSize: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    marginBottom: 4,
  },
  searchInput: { 
    borderWidth: 1.5, 
    borderRadius: 12, 
    padding: 14, 
    marginBottom: 15,
    fontSize: 16,
  },
  modalCloseIcon: { 
    position: "absolute", 
    top: 15, 
    right: 15, 
    zIndex: 2,
    padding: 6,
  },
});