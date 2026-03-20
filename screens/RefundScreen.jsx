// screens/RefundScreen.jsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  useColorScheme,
  Alert,
  ActivityIndicator,
  FlatList,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { auth, db } from "../firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

export default function RefundScreen() {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refundReason, setRefundReason] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchUserBookings = async () => {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Login Required", "Please log in to view your bookings.");
        navigation.goBack();
        return;
      }

      try {
        setLoading(true);
        console.log("Fetching bookings for user:", user.uid);

        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const bookingsQuery = query(
          collection(db, "bookings"),
          where("buyerId", "==", user.uid),
          where("status", "==", "confirmed")
        );

        const querySnapshot = await getDocs(bookingsQuery);
        const userBookings = [];

        querySnapshot.forEach((docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const checkOutDate = data.checkOut ? new Date(data.checkOut) : null;

            const isRecent =
              !checkOutDate ||
              checkOutDate > now ||
              checkOutDate >= twentyFourHoursAgo;

            if (isRecent) {
              userBookings.push({
                id: docSnap.id,
                ...data,
                checkIn: data.checkIn,
                checkOut: data.checkOut,
                nights: data.nights,
                totalAmount: data.totalAmount || 0,
                isNonRefundable: data.isNonRefundable || false,
                discountPercent: data.discountPercent || 0,
                listingTitle: data.listingTitle || "Unknown Listing",
                listingLocation: data.listingLocation || "—",
                hostId: data.hostId || null,
                hostName: data.hostName || "Host",
              });
            }
          }
        });

        console.log("Loaded bookings count:", userBookings.length);
        setBookings(userBookings);
      } catch (error) {
        console.error("Error fetching bookings:", error.code || error.message);
        Alert.alert("Error", "Could not load your bookings. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserBookings();
  }, []);

  const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const openRefundModal = (booking) => {
    if (booking.isNonRefundable) {
      Alert.alert(
        "Non-Refundable Booking",
        "This booking is non-refundable. No refunds or cancellations are possible after payment.",
        [{ text: "OK" }]
      );
      return;
    }

    setSelectedBooking(booking);
    setRefundReason("");
    setModalVisible(true);
  };

  const submitRefundRequest = async () => {
    if (!refundReason.trim()) {
      Alert.alert("Reason Required", "Please explain why you're requesting a refund.");
      return;
    }

    setSubmitting(true);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("No user logged in");

      console.log("Submitting refund for booking:", selectedBooking.id);

      // Add refund request document
      await addDoc(collection(db, "refunds"), {
        bookingId: selectedBooking.id,
        userId: currentUser.uid,
        userName: currentUser.displayName || "Unknown User",
        userEmail: currentUser.email || "unknown@email.com",
        hostId: selectedBooking.hostId || null,
        hostName: selectedBooking.hostName || "Host",
        listingTitle: selectedBooking.listingTitle,
        amount: selectedBooking.totalAmount,
        reason: refundReason.trim(),
        requestedAt: serverTimestamp(),
        status: "pending",
        createdAt: serverTimestamp(),
      });

      // Update booking (consistent with BecomeVendorScreen: setDoc + merge)
      const bookingRef = doc(db, "bookings", selectedBooking.id);
      await setDoc(
        bookingRef,
        {
          status: "refund_requested",
          refundRequestedAt: serverTimestamp(),
          refundReason: refundReason.trim(),
        },
        { merge: true }
      );

      Alert.alert(
        "Refund Requested",
        "Your request has been submitted successfully. We'll review it and get back to you (usually within 5–10 business days).",
        [
          {
            text: "OK",
            onPress: () => {
              setModalVisible(false);
              setBookings((prev) => prev.filter((b) => b.id !== selectedBooking.id));
            },
          },
        ]
      );
    } catch (error) {
      console.error("Refund request failed:", error.code || error.message);
      Alert.alert("Error", "Failed to submit refund request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderBookingItem = ({ item }) => (
    <View style={[styles.bookingCard, isDark && styles.bookingCardDark]}>
      <Text style={[styles.bookingTitle, isDark && styles.textLight]}>
        {item.listingTitle}
      </Text>
      <Text style={[styles.bookingLocation, isDark && styles.textMuted]}>
        {item.listingLocation}
      </Text>
      <View style={styles.dateRow}>
        <View style={styles.dateBlock}>
          <Text style={[styles.dateLabel, isDark && styles.textMuted]}>
            Check-in
          </Text>
          <Text style={[styles.dateValue, isDark && styles.textLight]}>
            {formatDate(item.checkIn)}
          </Text>
        </View>
        <View style={styles.dateBlock}>
          <Text style={[styles.dateLabel, isDark && styles.textMuted]}>
            Check-out
          </Text>
          <Text style={[styles.dateValue, isDark && styles.textLight]}>
            {formatDate(item.checkOut)}
          </Text>
        </View>
      </View>
      <View style={styles.priceRow}>
        <Text style={[styles.priceLabel, isDark && styles.textMuted]}>
          Total Paid
        </Text>
        <Text style={[styles.priceValue, isDark && styles.textLight]}>
          ₦{item.totalAmount.toLocaleString()}
        </Text>
      </View>
      {item.discountPercent > 0 && item.isNonRefundable && (
        <Text style={styles.discountNote}>
          (Non-refundable rate – {item.discountPercent}% discount)
        </Text>
      )}
      <TouchableOpacity
        style={[
          styles.refundButton,
          item.isNonRefundable && styles.refundButtonDisabled,
          isDark && styles.refundButtonDark,
        ]}
        onPress={() => openRefundModal(item)}
        disabled={item.isNonRefundable}
      >
        <Ionicons name="cash-outline" size={20} color="#fff" />
        <Text style={styles.refundButtonText}>
          {item.isNonRefundable ? "Non-Refundable" : "Request Refund"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={isDark ? "#fff" : "#333"} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isDark && styles.textLight]}>
            Refund / Cancellation
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#017a6b" />
            <Text style={[styles.loadingText, isDark && styles.textLight]}>
              Loading your bookings...
            </Text>
          </View>
        ) : bookings.length === 0 ? (
          <View style={styles.noBookingsContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="calendar" size={70} color={isDark ? "#4b5563" : "#9ca3af"} />
              <Ionicons name="close-circle" size={32} color="#ef4444" style={styles.emptyCross} />
            </View>
            <Text style={[styles.noBookingsText, isDark && styles.textLight]}>
              No eligible bookings found
            </Text>
            <Text style={[styles.noBookingsSubText, isDark && styles.textMuted]}>
              You can only request refunds for upcoming stays or bookings ended within the last 24 hours.
            </Text>
            <TouchableOpacity
              style={styles.backHomeButton}
              onPress={() => navigation.navigate("Home")}
            >
              <Text style={styles.backHomeText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={[styles.sectionTitle, isDark && styles.textLight]}>
              Your Recent Bookings
            </Text>
            <FlatList
              data={bookings}
              keyExtractor={(item) => item.id}
              renderItem={renderBookingItem}
              scrollEnabled={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Refund Reason Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, isDark && styles.modalContainerDark]}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={28} color={isDark ? "#fff" : "#333"} />
                </TouchableOpacity>
                <Text style={[styles.modalTitle, isDark && styles.textLight]}>
                  Request Refund
                </Text>
                <View style={{ width: 28 }} />
              </View>

              {selectedBooking ? (
                <View style={styles.bookingSummary}>
                  <Text style={[styles.summaryTitle, isDark && styles.textLight]}>
                    {selectedBooking.listingTitle || "Booking"}
                  </Text>
                  <Text style={[styles.summaryDates, isDark && styles.textMuted]}>
                    {formatDate(selectedBooking.checkIn || "")} – {formatDate(selectedBooking.checkOut || "")}
                  </Text>
                  <Text style={[styles.summaryAmount, isDark && styles.textLight]}>
                    Total Paid: ₦{(selectedBooking.totalAmount || 0).toLocaleString()}
                  </Text>
                </View>
              ) : (
                <Text style={{ color: isDark ? "#ff6b6b" : "#ef4444", textAlign: "center", marginBottom: 20 }}>
                  No booking selected — please try again
                </Text>
              )}

              <Text style={[styles.inputLabel, isDark && styles.textLight]}>
                Why are you requesting a refund?
              </Text>
              <TextInput
                style={[styles.reasonInput, isDark && styles.reasonInputDark]}
                multiline
                numberOfLines={6}
                placeholder="Tell us your reason (e.g., change of plans, emergency, etc.)"
                placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
                value={refundReason}
                onChangeText={setRefundReason}
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!refundReason.trim() || submitting) && styles.submitButtonDisabled,
                ]}
                onPress={submitRefundRequest}
                disabled={!refundReason.trim() || submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit Refund Request</Text>
                )}
              </TouchableOpacity>

              <Text style={[styles.noteText, isDark && styles.noteTextDark]}>
                We'll review your request and respond within 5–10 business days.
              </Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// styles remain unchanged (your original ones are fine)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  containerDark: { backgroundColor: "#0f1117" },
  scrollContent: { padding: 20, paddingTop: 8 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 28 },
  backButton: { padding: 8, marginRight: 12 },
  headerTitle: { fontSize: 26, fontWeight: "700", color: "#111" },
  sectionTitle: { fontSize: 20, fontWeight: "700", color: "#111", marginBottom: 16 },
  bookingCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  bookingCardDark: { backgroundColor: "#1e2535", borderColor: "#334155" },
  bookingTitle: { fontSize: 18, fontWeight: "700", color: "#111", marginBottom: 4 },
  bookingLocation: { fontSize: 14, color: "#64748b", marginBottom: 12 },
  dateRow: { flexDirection: "row", marginBottom: 16 },
  dateBlock: { flex: 1, alignItems: "center" },
  dateLabel: { fontSize: 13, color: "#94a3b8", marginBottom: 4 },
  dateValue: { fontSize: 16, fontWeight: "600", color: "#111" },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  priceLabel: { fontSize: 15, color: "#475569" },
  priceValue: { fontSize: 16, fontWeight: "600", color: "#111" },
  discountNote: { fontSize: 13, color: "#059669", fontWeight: "500", marginTop: 4, textAlign: "right" },
  refundButton: {
    backgroundColor: "#ef4444",
    borderRadius: 20,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  refundButtonDark: { backgroundColor: "#f87171" },
  refundButtonDisabled: { backgroundColor: "#9ca3af", shadowColor: "#000" },
  refundButtonText: { color: "#fff", fontSize: 16, fontWeight: "700", marginLeft: 10 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 100 },
  loadingText: { marginTop: 16, fontSize: 16, color: "#111" },
  noBookingsContainer: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 100, paddingHorizontal: 40 },
  emptyIconContainer: { position: "relative", marginBottom: 24 },
  emptyCross: { position: "absolute", bottom: -8, right: -8 },
  noBookingsText: { fontSize: 22, fontWeight: "600", color: "#111", marginTop: 16, textAlign: "center" },
  noBookingsSubText: { fontSize: 15, color: "#64748b", marginTop: 12, textAlign: "center", marginBottom: 32 },
  backHomeButton: {
    backgroundColor: "#017a6b",
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 32,
    shadowColor: "#017a6b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  backHomeText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  textLight: { color: "#f1f5f9" },
  textMuted: { color: "#94a3b8" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalContainer: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
    maxHeight: "85%",
  },
  modalContainerDark: { backgroundColor: "#1e2535" },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: "700", color: "#111" },
  bookingSummary: {
    backgroundColor: "rgba(241, 245, 249, 0.6)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  summaryTitle: { fontSize: 18, fontWeight: "700", color: "#111", marginBottom: 8 },
  summaryDates: { fontSize: 15, color: "#64748b", marginBottom: 8 },
  summaryAmount: { fontSize: 17, fontWeight: "600", color: "#017a6b" },
  inputLabel: { fontSize: 16, fontWeight: "600", color: "#111", marginBottom: 8 },
  reasonInput: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 16,
    minHeight: 140,
    fontSize: 16,
    color: "#111",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    textAlignVertical: "top",
    marginBottom: 20,
  },
  reasonInputDark: {
    backgroundColor: "#2a2a2a",
    color: "#e5e7eb",
    borderColor: "#444",
  },
  submitButton: {
    backgroundColor: "#ef4444",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  submitButtonDisabled: { backgroundColor: "#9ca3af" },
  submitButtonText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  noteText: { fontSize: 13, color: "#64748b", textAlign: "center" },
  noteTextDark: { color: "#94a3b8" },
});