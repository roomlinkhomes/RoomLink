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
  TextInput,
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
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

export default function RefundScreen() {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refundReason, setRefundReason] = useState(""); // New: user enters reason
  const [selectedBooking, setSelectedBooking] = useState(null); // For showing reason input

  // Fetch user's recent/active confirmed bookings
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
              hostId: data.hostId || null,      // ← host UID
              hostName: data.hostName || "Host", // ← if you store host name in booking
            });
          }
        });

        setBookings(userBookings);
      } catch (error) {
        console.error("Error fetching bookings:", error);
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

  const handleRequestRefund = (booking) => {
    if (booking.isNonRefundable) {
      Alert.alert(
        "Non-Refundable Booking",
        "This booking is non-refundable. No refunds or cancellations are possible after payment.",
        [{ text: "OK" }]
      );
      return;
    }

    // Show reason input + confirmation
    setSelectedBooking(booking);
    setRefundReason(""); // Reset reason

    Alert.alert(
      "Request Refund",
      `Please explain why you're requesting a refund for:\n\n${booking.listingTitle}\nTotal: ₦${booking.totalAmount.toLocaleString()}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit Request",
          style: "destructive",
          onPress: async () => {
            if (!refundReason.trim()) {
              Alert.alert("Reason Required", "Please provide a reason for the refund request.");
              return;
            }

            try {
              // 1. Create refund request document in "refunds" collection
              await addDoc(collection(db, "refunds"), {
                bookingId: booking.id,
                userId: auth.currentUser.uid,
                userName: auth.currentUser.displayName || "Unknown User",
                userEmail: auth.currentUser.email || "unknown@email.com",
                hostId: booking.hostId || null,
                hostName: booking.hostName || "Host",
                listingTitle: booking.listingTitle,
                amount: booking.totalAmount,
                reason: refundReason.trim(),
                requestedAt: serverTimestamp(),
                status: "pending", // pending / approved / rejected
                createdAt: serverTimestamp(),
              });

              // 2. Optional: Update booking status
              await updateDoc(doc(db, "bookings", booking.id), {
                status: "refund_requested",
                refundRequestedAt: serverTimestamp(),
                refundReason: refundReason.trim(),
              });

              Alert.alert(
                "Refund Requested",
                "Your request has been submitted. We'll notify you once processed (usually 5–10 business days).",
                [{ text: "OK", onPress: () => navigation.goBack() }]
              );

              // Optional: Refresh bookings list
              setBookings((prev) => prev.filter((b) => b.id !== booking.id));
            } catch (error) {
              console.error("Refund request failed:", error);
              Alert.alert("Error", "Could not submit refund request. Please try again.");
            }
          },
        },
      ]
    );
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
        onPress={() => handleRequestRefund(item)}
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons
              name="chevron-back"
              size={28}
              color={isDark ? "#fff" : "#333"}
            />
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
            <Ionicons
              name="calendar-remove"
              size={80}
              color={isDark ? "#444" : "#ccc"}
            />
            <Text style={[styles.noBookingsText, isDark && styles.textLight]}>
              No recent active bookings found
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
    </SafeAreaView>
  );
}

// Styles remain unchanged (copy from your original file)
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
    marginBottom: 16,
  },
  bookingCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  bookingCardDark: {
    backgroundColor: "#1e2535",
    borderColor: "#334155",
  },
  bookingTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    marginBottom: 4,
  },
  bookingLocation: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  dateBlock: {
    flex: 1,
    alignItems: "center",
  },
  dateLabel: {
    fontSize: 13,
    color: "#94a3b8",
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  priceLabel: {
    fontSize: 15,
    color: "#475569",
  },
  priceValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
  },
  discountNote: {
    fontSize: 13,
    color: "#059669",
    fontWeight: "500",
    marginTop: 4,
    textAlign: "right",
  },
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
  refundButtonDark: {
    backgroundColor: "#f87171",
  },
  refundButtonDisabled: {
    backgroundColor: "#9ca3af",
    shadowColor: "#000",
  },
  refundButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#111",
  },
  noBookingsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
  },
  noBookingsText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111",
    marginTop: 20,
    textAlign: "center",
  },
  noBookingsSubText: {
    fontSize: 15,
    color: "#64748b",
    marginTop: 12,
    textAlign: "center",
    marginBottom: 32,
  },
  backHomeButton: {
    backgroundColor: "#017a6b",
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  backHomeText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  textLight: { color: "#f1f5f9" },
  textMuted: { color: "#94a3b8" },
});