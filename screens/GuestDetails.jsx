// screens/GuestDetails.jsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  useColorScheme,
  Platform,
  KeyboardAvoidingView,
  SafeAreaView,
  Modal,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as Linking from "expo-linking";
import { auth, db } from "../firebaseConfig";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";

export default function GuestDetails() {
  const route = useRoute();
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const {
    listing,
    checkIn,
    checkOut,
    nights,
    pricePerNight,
    totalAmount: baseTotal = 0,
  } = route.params || {};

  const serviceFeeRate = 0.02;
  const serviceFee = Math.round(baseTotal * serviceFeeRate);
  const totalWithFee = baseTotal + serviceFee;

  // Form states
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+234");
  const [showCodePicker, setShowCodePicker] = useState(false);
  const [email, setEmail] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [specialRequests, setSpecialRequests] = useState("");
  const [loading, setLoading] = useState(false);

  // Floating chat state – appears after successful payment
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const countryCodes = [
    { code: "+234", label: "Nigeria (+234)" },
    { code: "+1", label: "USA / Canada (+1)" },
    { code: "+44", label: "United Kingdom (+44)" },
    { code: "+27", label: "South Africa (+27)" },
    { code: "+91", label: "India (+91)" },
    { code: "+971", label: "UAE (+971)" },
    { code: "+233", label: "Ghana (+233)" },
  ];

  // Listen for Paystack success deep link
  useEffect(() => {
    const subscription = Linking.addEventListener("url", ({ url }) => {
      if (url?.includes("payment-success")) {
        setPaymentSuccess(true);
        Alert.alert(
          "Payment Successful!",
          "Your booking is now confirmed. You can now chat with the host.",
          [{ text: "OK" }]
        );
      }
    });

    // Also check if app was opened via deep link
    Linking.getInitialURL().then((initialUrl) => {
      if (initialUrl?.includes("payment-success")) {
        setPaymentSuccess(true);
      }
    });

    return () => subscription.remove();
  }, []);

  const handleProceedToPayment = async () => {
    if (!fullName.trim() || !phone.trim() || !email.trim()) {
      Alert.alert("Incomplete", "Please provide full name, phone and email.");
      return;
    }

    const cleanPhone = phone.replace(/\D/g, "");
    const fullPhone = countryCode + cleanPhone;

    if (cleanPhone.length < 7 || cleanPhone.length > 15) {
      Alert.alert("Invalid Phone", "Please enter a valid phone number.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email.");
      return;
    }

    if (adults + children < 1) {
      Alert.alert("Guests Required", "At least one guest is required.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Login Required", "Please log in to continue.");
      navigation.navigate("Login");
      return;
    }

    setLoading(true);

    try {
      // ─── Fetch host information ───
      const hostId = listing?.userId || listing?.ownerId || listing?.hostUid;
      let hostInfo = {
        hostId: hostId || null,
        hostName: "Unknown Host",
        hostEmail: null,
        hostPhone: null,
        hostPhotoURL: null,
      };

      if (hostId) {
        const hostDocRef = doc(db, "users", hostId);
        const hostDocSnap = await getDoc(hostDocRef);

        if (hostDocSnap.exists()) {
          const hostData = hostDocSnap.data();
          hostInfo = {
            hostId,
            hostName: hostData.displayName || hostData.fullName || hostData.name || "Host",
            hostEmail: hostData.email || null,
            hostPhone: hostData.phone || hostData.phoneNumber || null,
            hostPhotoURL: hostData.photoURL || hostData.profilePicture || null,
          };
        }
      }

      // ─── Create booking with BOTH guest and host info ───
      const bookingRef = await addDoc(collection(db, "bookings"), {
        listingId: listing?.id,
        listingTitle: listing?.title,
        listingImages: listing?.images || [],
        
        // Host information (fully saved)
        hostId: hostInfo.hostId,
        hostInfo,   // ← contains name, email, phone, photo

        buyerId: user.uid,
        buyerEmail: user.email || email.trim(),
        checkIn,
        checkOut,
        nights,
        pricePerNight,
        baseAmount: baseTotal,
        serviceFee,
        totalAmount: totalWithFee,
        currency: "NGN",
        guestDetails: {
          fullName: fullName.trim(),
          phone: fullPhone,
          email: email.trim(),
          adults,
          children,
          specialRequests: specialRequests.trim(),
        },
        status: "pending_payment",
        createdAt: serverTimestamp(),
      });

      // ─── Initialize Paystack ───
      const response = await fetch(
        "https://us-central1-roomlink-homes.cloudfunctions.net/initializePaystack",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.email || email.trim(),
            amount: Math.round(totalWithFee * 100),
            reference: `roomlink_booking_${bookingRef.id}_${Date.now()}`,
            bookingId: bookingRef.id,
            callback_url: "roomlink://payment-success",
          }),
        }
      );

      const data = await response.json();

      if (!data?.url) {
        throw new Error(data?.message || "Failed to initialize payment.");
      }

      // ─── Open Paystack WebView ───
      navigation.navigate("PaystackWebView", {
        url: data.url,
        bookingId: bookingRef.id,
      });

    } catch (error) {
      console.error("Payment initiation error:", error);
      Alert.alert("Error", error.message || "Could not start payment. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const openChatWithHost = () => {
    navigation.navigate("Message", {
      listingId: listing?.id,
      listingOwnerId: listing?.userId || listing?.ownerId || listing?.hostUid,
      otherUserName: listing?.hostName || listing?.ownerName || "Host",
    });
  };

  const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={28} color={isDark ? "#fff" : "#333"} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, isDark && styles.textLight]}>
              Guest Information
            </Text>
          </View>

          {/* Summary */}
          <View style={[styles.summarySection, isDark && styles.summarySectionDark]}>
            <Text style={[styles.summaryTitle, isDark && styles.textLight]}>
              {listing?.title || "Your Booking"}
            </Text>
            <Text style={[styles.summaryLocation, isDark && styles.textMuted]}>
              {listing?.location || "—"}
            </Text>

            <View style={styles.dateRow}>
              <View style={styles.dateBlock}>
                <Text style={styles.dateLabel}>Check-in</Text>
                <Text style={[styles.dateValue, isDark && styles.textLight]}>
                  {formatDate(checkIn)}
                </Text>
              </View>
              <View style={styles.dateBlock}>
                <Text style={styles.dateLabel}>Check-out</Text>
                <Text style={[styles.dateValue, isDark && styles.textLight]}>
                  {formatDate(checkOut)}
                </Text>
              </View>
            </View>

            <View style={styles.priceBreakdown}>
              <View style={styles.priceRow}>
                <Text style={[styles.priceLabel, isDark && styles.textMuted]}>
                  {nights} night{nights !== 1 ? "s" : ""} × ₦{pricePerNight?.toLocaleString() || "—"}
                </Text>
                <Text style={[styles.priceValue, isDark && styles.textLight]}>
                  ₦{baseTotal.toLocaleString()}
                </Text>
              </View>

              <View style={styles.priceRow}>
                <Text style={[styles.priceLabel, isDark && styles.textMuted]}>
                  Service fee (2%)
                </Text>
                <Text style={[styles.priceValue, isDark && styles.textLight]}>
                  ₦{serviceFee.toLocaleString()}
                </Text>
              </View>

              <View style={[styles.priceRow, styles.totalRow]}>
                <Text style={[styles.totalLabel, isDark && styles.textLight]}>
                  Total
                </Text>
                <Text style={[styles.totalAmount, isDark && styles.textAccent]}>
                  ₦{totalWithFee.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>

          {/* Form */}
          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
              Who's staying?
            </Text>

            <View style={[styles.inputContainer, isDark && styles.inputContainerDark]}>
              <Ionicons name="person-outline" size={22} color="#017a6b" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                placeholder="Full name"
                placeholderTextColor={isDark ? "#888" : "#aaa"}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>

            <View style={[styles.inputContainer, isDark && styles.inputContainerDark]}>
              <TouchableOpacity style={styles.countryCodeBtn} onPress={() => setShowCodePicker(true)}>
                <Text style={styles.countryCodeText}>{countryCode}</Text>
                <Ionicons name="chevron-down" size={18} color="#017a6b" />
              </TouchableOpacity>
              <TextInput
                style={[styles.input, { flex: 1 }, isDark && styles.inputDark]}
                placeholder="Phone number (without code)"
                placeholderTextColor={isDark ? "#888" : "#aaa"}
                value={phone}
                onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, ""))}
                keyboardType="phone-pad"
              />
            </View>

            <View style={[styles.inputContainer, isDark && styles.inputContainerDark]}>
              <Ionicons name="mail-outline" size={22} color="#017a6b" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                placeholder="Email address"
                placeholderTextColor={isDark ? "#888" : "#aaa"}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.guestCounters}>
              <View style={styles.counterGroup}>
                <Text style={[styles.counterLabel, isDark && styles.textMuted]}>
                  Adults
                </Text>
                <View style={[styles.counterRow, isDark && styles.counterRowDark]}>
                  <TouchableOpacity
                    style={styles.counterBtn}
                    onPress={() => setAdults((prev) => Math.max(1, prev - 1))}
                  >
                    <Ionicons name="remove" size={24} color="#017a6b" />
                  </TouchableOpacity>
                  <Text style={[styles.counterText, isDark && styles.textLight]}>
                    {adults}
                  </Text>
                  <TouchableOpacity
                    style={styles.counterBtn}
                    onPress={() => setAdults((prev) => prev + 1)}
                  >
                    <Ionicons name="add" size={24} color="#017a6b" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.counterGroup}>
                <Text style={[styles.counterLabel, isDark && styles.textMuted]}>
                  Children
                </Text>
                <View style={[styles.counterRow, isDark && styles.counterRowDark]}>
                  <TouchableOpacity
                    style={styles.counterBtn}
                    onPress={() => setChildren((prev) => Math.max(0, prev - 1))}
                  >
                    <Ionicons name="remove" size={24} color="#017a6b" />
                  </TouchableOpacity>
                  <Text style={[styles.counterText, isDark && styles.textLight]}>
                    {children}
                  </Text>
                  <TouchableOpacity
                    style={styles.counterBtn}
                    onPress={() => setChildren((prev) => prev + 1)}
                  >
                    <Ionicons name="add" size={24} color="#017a6b" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={[styles.inputContainer, isDark && styles.inputContainerDark]}>
              <Ionicons
                name="chatbox-ellipses-outline"
                size={22}
                color="#017a6b"
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, styles.textArea, isDark && styles.inputDark]}
                placeholder="Special requests, early arrival, etc. (optional)"
                placeholderTextColor={isDark ? "#888" : "#aaa"}
                value={specialRequests}
                onChangeText={setSpecialRequests}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Notice */}
          <View style={[styles.noticeCard, isDark && styles.noticeCardDark]}>
            <Ionicons name="information-circle-outline" size={24} color="#FF9500" />
            <Text style={[styles.noticeText, isDark && styles.textMuted]}>
              This booking becomes non-refundable after payment. Please double-check everything.
            </Text>
          </View>

          {/* Pay Button */}
          <TouchableOpacity
            style={[
              styles.payButton,
              loading && styles.payButtonDisabled,
              isDark && styles.payButtonDark,
            ]}
            onPress={handleProceedToPayment}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="lock-closed-outline" size={22} color="#fff" />
                <Text style={styles.payButtonText}>
                  Pay ₦{totalWithFee.toLocaleString()}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 140 }} />
        </ScrollView>

        {/* Floating Chat Button – appears after successful payment */}
        {paymentSuccess && (
          <TouchableOpacity
            style={[
              styles.floatingChatButton,
              isDark && styles.floatingChatButtonDark,
            ]}
            onPress={openChatWithHost}
            activeOpacity={0.85}
          >
            <Ionicons name="chatbubbles-outline" size={28} color="#fff" />
            <View style={styles.floatingBadge}>
              <Text style={styles.badgeText}>Chat with Host</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Country code picker modal */}
        <Modal
          visible={showCodePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCodePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
              <Text style={[styles.modalTitle, isDark && styles.textLight]}>
                Select Country Code
              </Text>

              <FlatList
                data={countryCodes}
                keyExtractor={(item) => item.code}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.codeItem}
                    onPress={() => {
                      setCountryCode(item.code);
                      setShowCodePicker(false);
                    }}
                  >
                    <Text style={[styles.codeLabel, isDark && styles.textLight]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                )}
              />

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setShowCodePicker(false)}
              >
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  containerDark: {
    backgroundColor: "#0f1117",
  },
  scrollContent: {
    padding: 20,
    paddingTop: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111",
  },
  summarySection: {
    padding: 20,
    backgroundColor: "rgba(1, 122, 107, 0.05)",
    borderRadius: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: "rgba(1, 122, 107, 0.12)",
  },
  summarySectionDark: {
    backgroundColor: "rgba(2, 141, 124, 0.08)",
    borderColor: "rgba(2, 141, 124, 0.18)",
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111",
    marginBottom: 4,
  },
  summaryLocation: {
    fontSize: 15,
    color: "#64748b",
    marginBottom: 20,
  },
  dateRow: {
    flexDirection: "row",
    marginBottom: 20,
  },
  dateBlock: {
    flex: 1,
    alignItems: "center",
  },
  dateLabel: {
    fontSize: 13,
    color: "#94a3b8",
    marginBottom: 6,
  },
  dateValue: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111",
  },
  priceBreakdown: {
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 16,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 15,
    color: "#475569",
  },
  priceValue: {
    fontSize: 15,
    fontWeight: "500",
    color: "#111",
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#cbd5e1",
    paddingTop: 16,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111",
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: "800",
    color: "#017a6b",
  },
  formSection: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: "700",
    color: "#111",
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
  },
  inputContainerDark: {
    backgroundColor: "#1e2535",
    borderColor: "#334155",
  },
  inputIcon: {
    padding: 16,
    backgroundColor: "#f1f5f9",
  },
  countryCodeBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: "#f1f5f9",
    borderRightWidth: 1,
    borderRightColor: "#e2e8f0",
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#017a6b",
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    color: "#111",
  },
  inputDark: {
    color: "#e2e8f0",
  },
  textArea: {
    height: 110,
    textAlignVertical: "top",
    paddingTop: 16,
  },
  guestCounters: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  counterGroup: {
    flex: 1,
    marginHorizontal: 8,
  },
  counterLabel: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 8,
  },
  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    paddingVertical: 8,
  },
  counterRowDark: {
    backgroundColor: "#253142",
  },
  counterBtn: {
    padding: 12,
    backgroundColor: "#e0f2f1",
    borderRadius: 12,
    marginHorizontal: 16,
  },
  counterText: {
    fontSize: 22,
    fontWeight: "700",
    minWidth: 44,
    textAlign: "center",
    color: "#111",
  },
  noticeCard: {
    flexDirection: "row",
    backgroundColor: "#fffbeb",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#fef08a",
    marginBottom: 28,
  },
  noticeCardDark: {
    backgroundColor: "#2d2a1e",
    borderColor: "#ca8a04",
  },
  noticeText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: "#444",
    lineHeight: 22,
  },
  payButton: {
    backgroundColor: "#017a6b",
    borderRadius: 20,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#017a6b",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  payButtonDark: {
    backgroundColor: "#028d7c",
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 10,
  },

  // Floating chat button styles
  floatingChatButton: {
    position: "absolute",
    bottom: 40,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#017a6b",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 999,
  },
  floatingChatButtonDark: {
    backgroundColor: "#028d7c",
  },
  floatingBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#ff3b30",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "60%",
  },
  modalContentDark: {
    backgroundColor: "#1e2535",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
    color: "#111",
  },
  codeItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  codeLabel: {
    fontSize: 16,
    color: "#111",
  },
  closeBtn: {
    marginTop: 16,
    alignItems: "center",
    padding: 12,
  },
  closeText: {
    color: "#017a6b",
    fontSize: 16,
    fontWeight: "600",
  },

  textLight: { color: "#f1f5f9" },
  textMuted: { color: "#94a3b8" },
  textAccent: { color: "#34d399" },
});