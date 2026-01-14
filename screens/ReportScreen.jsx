// screens/ReportScreen.jsx — FIXED: Removed all image/screenshot logic
import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  useColorScheme,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { UserContext } from "../context/UserContext";
import { Ionicons } from "@expo/vector-icons";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase"; // Make sure db is imported

export default function ReportScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useContext(UserContext);
  const isDark = useColorScheme() === "dark";

  const { listingId: rawListingId, listingTitle = "This listing" } = route.params || {};
  const [listingId] = useState(rawListingId);

  const [selectedReason, setSelectedReason] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!listingId) {
      Alert.alert("Error", "Invalid listing.");
      navigation.goBack();
    }
  }, [listingId, navigation]);

  const reasonsList = [
    "Fake / Scam Listing",
    "Wrong Price or Fraud",
    "Inappropriate Content",
    "Duplicate Listing",
    "Wrong Location",
    "Already Sold/Rented",
    "Harassment / Rude Owner",
    "Spam / Bot",
    "Other",
  ];

  const handleSubmit = async () => {
    if (!selectedReason) return Alert.alert("Required", "Please select a reason.");
    if (selectedReason === "Other" && !comment.trim()) return Alert.alert("Required", "Please explain the issue.");

    setSubmitting(true);
    try {
      // Saves directly to Firestore (same as MessageScreenHeader)
      await addDoc(collection(db, "reports"), {
        reporterId: user?.uid,
        reportedListingId: listingId,
        reportedListingTitle: listingTitle,
        reason: selectedReason,
        details: comment.trim() || null,
        timestamp: serverTimestamp(),
        status: "pending",
      });

      Alert.alert("Report Sent", "Thank you for helping keep RoomLink safe!", [
        { text: "Done", onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      console.error("Report submission error:", err);
      Alert.alert("Error", err.message || "Failed to submit report.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!listingId) return null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? "#121212" : "#fafafa" }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>

        {/* RLMARKET OFFICIAL HEADER — SAME AS EVERYWHERE */}
        <View style={styles.pageHeader}>
          <View style={[
            styles.rlBadge,
            { backgroundColor: isDark ? 'rgba(0, 255, 127, 0.1)' : 'rgba(1, 122, 107, 0.08)' }
          ]}>
            <Text style={[styles.rlText, { color: isDark ? "#00ff7f" : "#017a6b" }]}>RL</Text>
          </View>

          <View style={styles.headerContent}>
            <Text style={[styles.pageTitle, { color: isDark ? "#e0e0e0" : "#1a1a1a" }]}>
              Report Listing
            </Text>
            <Text style={[styles.subtitle, { color: isDark ? "#b0b0b0" : "#666" }]}>
              Help us keep RoomLink safe
            </Text>
          </View>

          <View style={{ width: 48 }} />
        </View>

        {/* LISTING TITLE */}
        <View style={styles.titleCard}>
          <Text style={[styles.listingTitle, { color: isDark ? "#e0e0e0" : "#1a1a1a" }]}>
            {listingTitle}
          </Text>
        </View>

        {/* REASON SELECTION */}
        <View style={styles.card}>
          <Text style={[styles.sectionTitle, { color: isDark ? "#e0e0e0" : "#1a1a1a" }]}>
            Select a reason
          </Text>

          {reasonsList.map((reason) => (
            <TouchableOpacity
              key={reason}
              style={styles.reasonRow}
              onPress={() => setSelectedReason(reason)}
              disabled={submitting}
            >
              <View style={[
                styles.radio,
                selectedReason === reason && styles.radioSelected,
                { borderColor: selectedReason === reason ? (isDark ? "#00ff7f" : "#017a6b") : (isDark ? "#444" : "#ddd") }
              ]}>
                {selectedReason === reason && <View style={styles.radioDot} />}
              </View>
              <Text style={[styles.reasonText, { color: isDark ? "#e0e0e0" : "#222" }]}>
                {reason}
              </Text>
            </TouchableOpacity>
          ))}

          {selectedReason === "Other" && (
            <TextInput
              style={[styles.input, { color: isDark ? "#e0e0e0" : "#1a1a1a", backgroundColor: isDark ? "#1e1e1e" : "#fff" }]}
              placeholder="Explain the issue..."
              placeholderTextColor={isDark ? "#666" : "#999"}
              multiline
              value={comment}
              onChangeText={setComment}
            />
          )}
        </View>

      </ScrollView>

      {/* RLMARKET BOTTOM ACTION BAR */}
      <View style={[
        styles.footer,
        { backgroundColor: isDark ? "#1e1e1e" : "#ffffff", borderTopColor: isDark ? "#333" : "#e0e6ed" }
      ]}>
        <TouchableOpacity
          style={[
            styles.submitBtn,
            { backgroundColor: selectedReason ? (isDark ? "#00ff7f" : "#017a6b") : "#666" }
          ]}
          onPress={handleSubmit}
          disabled={submitting || !selectedReason}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="flag" size={20} color="#fff" />
              <Text style={styles.submitText}>Submit Report</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // SAME HEADER AS CART, REVIEWS, ADDREVIEW
  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  rlBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(1, 122, 107, 0.2)",
  },
  rlText: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -1,
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: "500",
  },

  titleCard: {
    marginHorizontal: 20,
    padding: 16,
    backgroundColor: "#017a6b0d",
    borderRadius: 16,
    marginBottom: 8,
  },
  listingTitle: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },

  card: {
    margin: 20,
    marginTop: 8,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e0e6ed",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 20,
  },
  reasonRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  radio: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2.5,
    marginRight: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  radioSelected: {
    borderColor: "#017a6b",
  },
  radioDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#017a6b",
  },
  reasonText: {
    fontSize: 16,
    flex: 1,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#ddd",
    borderRadius: 16,
    padding: 16,
    minHeight: 100,
    textAlignVertical: "top",
    marginTop: 16,
    fontSize: 16,
  },

  // SAME FOOTER AS EVERYWHERE
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopWidth: 1,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  submitText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
    marginLeft: 10,
  },
});