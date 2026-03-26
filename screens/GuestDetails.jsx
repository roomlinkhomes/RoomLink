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
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";

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
    pricePerNight: originalPricePerNight,
    totalAmount: finalTotal = 0,
    isNonRefundable = false,
    discountPercent = 0,
  } = route.params || {};

  const originalBaseTotal = originalPricePerNight * nights;
  const savings = originalBaseTotal - finalTotal;

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
  const [confirmedNonRefundable, setConfirmedNonRefundable] = useState(false);
  const [showDateConflict, setShowDateConflict] = useState(false); // ← NEW: controls modern notice

  // Payment & confirmation state
  const [bookingId, setBookingId] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState("idle"); // idle | pending | paid | failed

  // Persistent: check if user already has paid booking for this listing
  const [hasPaidBooking, setHasPaidBooking] = useState(false);

  const countryCodes = [
    { code: "+234", label: "Nigeria (+234)" },
    { code: "+1", label: "USA / Canada (+1)" },
    { code: "+44", label: "United Kingdom (+44)" },
    { code: "+27", label: "South Africa (+27)" },
    { code: "+91", label: "India (+91)" },
    { code: "+971", label: "UAE (+971)" },
    { code: "+233", label: "Ghana (+233)" },
  ];

  // Check for existing paid/confirmed booking
  useEffect(() => {
    const user = auth.currentUser;
    if (!user || !listing?.id) {
      setHasPaidBooking(false);
      return;
    }

    const q = query(
      collection(db, "bookings"),
      where("buyerId", "==", user.uid),
      where("listingId", "==", listing.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let found = false;
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const status = data?.status?.toLowerCase?.() || "";
        if (status === "paid" || status === "successful" || status === "confirmed") {
          found = true;
        }
      });
      setHasPaidBooking(found);
    });

    return () => unsubscribe();
  }, [listing?.id]);

  // Deep link handling (Paystack callback)
  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (url?.includes("payment-success") && bookingId) {
        setPaymentStatus("pending");
      }
    });

    const subscription = Linking.addEventListener("url", ({ url }) => {
      if (url?.includes("payment-success") && bookingId) {
        setPaymentStatus("pending");
        Alert.alert("Payment Received", "Confirming your booking — please wait...");
      }
    });

    return () => subscription.remove();
  }, [bookingId]);

  // Real-time listener for the current booking
  useEffect(() => {
    if (!bookingId) return;

    const bookingRef = doc(db, "bookings", bookingId);

    const unsubscribe = onSnapshot(bookingRef, async (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const status = data?.status?.toLowerCase?.() || "";

        if (status === "paid" || status === "successful" || status === "confirmed") {
          setPaymentStatus("paid");
          setHasPaidBooking(true);

          // Block dates on the listing after confirmation
          try {
            const listingRef = doc(db, "listings", listing.id);
            await updateDoc(listingRef, {
              bookedRanges: arrayUnion({
                bookingId: bookingId,
                checkIn: checkIn,
                checkOut: checkOut,
                status: "confirmed",
                createdAt: new Date().toISOString(),
              }),
            });
            console.log("Dates blocked successfully on listing");
          } catch (err) {
            console.error("Failed to block dates on listing:", err);
          }

          Alert.alert(
            "Booking Confirmed!",
            "Payment successful — chat with host now available.\n\nPlease do not tap 'I'm checked in' on the events tab if you are not checked in.",
            [
              { text: "Chat Now", onPress: () => openChatWithHost() },
              {
                text: "View My Bookings",
                onPress: () => navigation.navigate("HomeTabs", { screen: "Trips" }),
              },
            ]
          );
        } else if (status === "failed" || status === "cancelled" || status === "declined") {
          setPaymentStatus("failed");
          Alert.alert("Payment Issue", "The payment did not complete successfully. Please try again.");
        }
      }
    }, (err) => {
      console.error("Booking listener error:", err);
    });

    return () => unsubscribe();
  }, [bookingId, navigation, listing?.id, checkIn, checkOut]);

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

    if (isNonRefundable && !confirmedNonRefundable) {
      Alert.alert("Confirmation Required", "Please confirm you understand this booking is non-refundable.");
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
      // ------------------ CHECK FOR DATE CONFLICTS ------------------
      const listingRef = doc(db, "listings", listing.id);
      const listingSnap = await getDoc(listingRef);

      if (!listingSnap.exists()) {
        Alert.alert("Error", "This listing is no longer available.");
        setLoading(false);
        return;
      }

      const listingData = listingSnap.data();
      const bookedRanges = listingData.bookedRanges || [];

      const proposedStart = new Date(checkIn);
      const proposedEnd = new Date(checkOut);

      const hasConflict = bookedRanges.some((range) => {
        if (range.status !== "confirmed") return false;

        const existingStart = new Date(range.checkIn);
        const existingEnd = new Date(range.checkOut);

        return !(proposedEnd <= existingStart || proposedStart >= existingEnd);
      });

      if (hasConflict) {
        setShowDateConflict(true); // ← Show modern notice
        setLoading(false);
        return;
      }

      // ------------------ No conflict → proceed ------------------

      // Fetch host info
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
            hostName: hostData.fullName || 
                     `${hostData.firstName || ''} ${hostData.lastName || ''}`.trim() || 
                     hostData.username || 
                     "Host",
            hostEmail: hostData.email || null,
            hostPhone: hostData.phone || hostData.phoneNumber || null,
            hostPhotoURL: hostData.photoURL || hostData.profilePicture || null,
          };
        }
      }

      // Create booking document
      const bookingRef = await addDoc(collection(db, "bookings"), {
        listingId: listing?.id,
        listingTitle: listing?.title,
        listingImages: listing?.images || [],
        hostId: hostInfo.hostId,
        hostInfo,
        buyerId: user.uid,
        buyerEmail: user.email || email.trim(),
        checkIn,
        checkOut,
        nights,
        originalPricePerNight,
        discountedPricePerNight: finalTotal / nights,
        discountPercent,
        isNonRefundable,
        totalAmount: finalTotal,
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
        paymentReference: null,
        createdAt: serverTimestamp(),
      });

      setBookingId(bookingRef.id);

      // Initialize Paystack payment
      const response = await fetch(
        "https://us-central1-roomlink-homes.cloudfunctions.net/initializePaystack",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.email || email.trim(),
            amount: Math.round(finalTotal * 100), // kobo
            reference: `roomlink_booking_${bookingRef.id}_${Date.now()}`,
            bookingId: bookingRef.id,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status} - Payment init failed`);
      }

      const data = await response.json();

      if (!data?.url) {
        throw new Error(data?.message || "No payment URL received.");
      }

      navigation.navigate("PaystackWebView", {
        url: data.url,
        bookingId: bookingRef.id,
      });

      setPaymentStatus("pending");
    } catch (error) {
      console.error("Payment initiation error:", error);
      Alert.alert("Error", error.message || "Could not start payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const openChatWithHost = () => {
    if (!listing?.id) return;

    const hostId = listing?.userId || listing?.ownerId || listing?.hostUid || "";

    if (!hostId) {
      Alert.alert("Error", "Cannot start chat — host information is missing.");
      return;
    }

    navigation.navigate("HomeTabs", {
      screen: "Messages",
      params: {
        screen: "Message",
        params: {
          listingId: listing.id,
          otherUserId: hostId,
          otherUserName: "Host",
        },
      },
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

  const isPaid = paymentStatus === "paid" || hasPaidBooking;

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
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

          {/* Booking Summary */}
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
                  {nights} night{nights !== 1 ? "s" : ""} × ₦
                  {(finalTotal / nights)?.toLocaleString() || "—"}
                  {discountPercent > 0 && isNonRefundable && (
                    <Text style={styles.discountedNote}> (special rate)</Text>
                  )}
                </Text>
                <Text style={[styles.priceValue, isDark && styles.textLight]}>
                  ₦{finalTotal.toLocaleString()}
                </Text>
              </View>

              {discountPercent > 0 && savings > 0 && (
                <View style={styles.savingsRow}>
                  <Text style={styles.savingsText}>
                    You saved ₦{savings.toLocaleString()} ({discountPercent}% off)
                  </Text>
                </View>
              )}

              <View style={[styles.priceRow, styles.totalRow]}>
                <Text style={[styles.totalLabel, isDark && styles.textLight]}>
                  Total Amount
                </Text>
                <Text style={[styles.totalAmount, isDark && styles.textAccent]}>
                  ₦{finalTotal.toLocaleString()}
                </Text>
              </View>

              {isPaid && (
                <View style={styles.successBanner}>
                  <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                  <Text style={styles.successText}>Payment Confirmed</Text>
                </View>
              )}
            </View>
          </View>

          {/* Guest Form – hide after payment */}
          {!isPaid && (
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
                  placeholder="Special requests, early arrival, dietary needs, etc. (optional)"
                  placeholderTextColor={isDark ? "#888" : "#aaa"}
                  value={specialRequests}
                  onChangeText={setSpecialRequests}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>
          )}

          {/* Refund Policy Notice */}
          {!isPaid && isNonRefundable && (
            <>
              <View
                style={[
                  styles.noticeCard,
                  isDark ? styles.noticeCardNonRefundableDark : styles.noticeCardNonRefundable,
                ]}
              >
                <Ionicons
                  name="lock-closed"
                  size={24}
                  color="#ef4444"
                />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.noticeTitle, { color: "#991b1b" }]}>
                    Non-Refundable Booking
                  </Text>
                  <Text style={styles.noticeText}>
                    This is a <Text style={{ fontWeight: "bold" }}>final and non-refundable</Text> booking.
                    No cancellations, changes, or refunds, even for emergencies.
                  </Text>
                  {discountPercent > 0 && (
                    <Text style={{ color: "#059669", marginTop: 6, fontWeight: "600" }}>
                      Special non-refundable rate: {discountPercent}% off applied
                    </Text>
                  )}
                </View>
              </View>

              <TouchableOpacity
                style={[styles.checkboxContainer, isDark && styles.checkboxContainerDark]}
                onPress={() => setConfirmedNonRefundable((prev) => !prev)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.checkbox,
                    confirmedNonRefundable && { backgroundColor: "#ef4444", borderColor: "#ef4444" },
                  ]}
                >
                  {confirmedNonRefundable && <Ionicons name="checkmark" size={16} color="#fff" />}
                </View>
                <Text style={[styles.checkboxText, { color: isDark ? "#e0e0e0" : "#374151" }]}>
                  I understand this booking is <Text style={{ fontWeight: "bold" }}>non-refundable</Text> ,
                  no refunds, cancellations or changes allowed after payment.
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* Modern Dates Unavailable Notice */}
          {showDateConflict && (
            <View style={[styles.dateConflictContainer, isDark && styles.dateConflictContainerDark]}>
              <View style={styles.dateConflictHeader}>
                <View style={styles.conflictIconContainer}>
                  <Ionicons name="calendar" size={28} color="#f59e0b" />
                  <Ionicons name="close-circle" size={16} color="#ef4444" style={styles.conflictCross} />
                </View>
                <Text style={styles.conflictTitle}>
                  Dates No Longer Available
                </Text>
              </View>

              <Text style={[styles.conflictBody, isDark && styles.conflictBodyDark]}>
                These dates have just been booked by another guest.
                {'\n\n'}
                Please select different check-in / check-out dates or browse other listings.
              </Text>

              <TouchableOpacity
                style={styles.conflictButton}
                onPress={() => {
                  setShowDateConflict(false);
                  navigation.goBack(); // or navigate to search/listings screen
                }}
              >
                <Text style={styles.conflictButtonText}>Choose New Dates</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dismissLink}
                onPress={() => setShowDateConflict(false)}
              >
                <Text style={[styles.dismissText, isDark && styles.dismissTextDark]}>
                  Dismiss
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Main CTA Button */}
          <TouchableOpacity
            style={[
              styles.payButton,
              loading && styles.payButtonDisabled,
              (isNonRefundable && !confirmedNonRefundable && !isPaid) && styles.payButtonDisabled,
              isDark && styles.payButtonDark,
              isPaid && styles.paidButton,
            ]}
            onPress={isPaid ? () => navigation.navigate("HomeTabs", { screen: "Trips" }) : handleProceedToPayment}
            disabled={loading || (isNonRefundable && !confirmedNonRefundable && !isPaid)}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : isPaid ? (
              <>
                <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
                <Text style={styles.payButtonText}>Payment Confirmed – View Booking</Text>
              </>
            ) : (
              <>
                <Ionicons name="lock-closed-outline" size={22} color="#fff" />
                <Text style={styles.payButtonText}>
                  Pay ₦{finalTotal.toLocaleString()}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 140 }} />
        </ScrollView>

        {/* Persistent floating chat button */}
        {hasPaidBooking && (
          <TouchableOpacity
            style={[styles.floatingChatButton, isDark && styles.floatingChatButtonDark]}
            onPress={openChatWithHost}
            activeOpacity={0.85}
          >
            <Ionicons name="chatbubbles-outline" size={28} color="#fff" />
            <View style={styles.floatingBadge}>
              <Text style={styles.badgeText}>Chat with Host</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Country Code Modal */}
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
    marginBottom: 8,
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
  discountedNote: {
    fontSize: 13,
    color: "#059669",
    fontWeight: "600",
    marginLeft: 4,
  },
  savingsRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    alignItems: "center",
  },
  savingsText: {
    color: "#059669",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ecfdf5",
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  successText: {
    color: "#065f46",
    fontWeight: "600",
    marginLeft: 8,
    fontSize: 16,
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
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  noticeCardNonRefundable: {
    backgroundColor: "#fee2e2",
    borderColor: "#ef4444",
  },
  noticeCardNonRefundableDark: {
    backgroundColor: "#7f1d1d",
    borderColor: "#f87171",
  },
  noticeTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  noticeText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#374151",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fff",
  },
  checkboxContainerDark: {
    backgroundColor: "#1e2535",
    borderColor: "#7f1d1d",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#d1d5db",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 2,
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: "#374151",
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
  paidButton: {
    backgroundColor: "#10b981",
    shadowColor: "#10b981",
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

  // ── Modern Dates Conflict Notice ─────────────────────────────
  dateConflictContainer: {
    backgroundColor: 'rgba(254, 249, 195, 0.75)', // soft amber warning bg
    borderRadius: 20,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#fde68a',
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  dateConflictContainerDark: {
    backgroundColor: 'rgba(146, 64, 14, 0.3)',
    borderColor: '#92400e',
    shadowColor: '#b45309',
  },
  dateConflictHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  conflictIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
  },
  conflictCross: {
    position: 'absolute',
    bottom: -4,
    right: -4,
  },
  conflictTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#92400e',
  },
  conflictBody: {
    fontSize: 15,
    lineHeight: 22,
    color: '#44403c',
    marginBottom: 20,
  },
  conflictBodyDark: {
    color: '#fed7aa',
  },
  conflictButton: {
    backgroundColor: '#d97706',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  conflictButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  dismissLink: {
    alignItems: 'center',
  },
  dismissText: {
    fontSize: 14,
    color: '#6b7280',
    textDecorationLine: 'underline',
  },
  dismissTextDark: {
    color: '#9ca3af',
  },
});