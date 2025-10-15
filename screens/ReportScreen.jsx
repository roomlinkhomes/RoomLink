// screens/ReportScreen.jsx
import React, { useState, useContext } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ScrollView, 
  ActivityIndicator 
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { UserContext } from "../context/UserContext";

export default function ReportScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { listingId } = route.params || {};
  const { user } = useContext(UserContext);

  const reasonsList = [
    "Fake Listing",
    "Scammer / Fraud",
    "I don't like this listing",
    "Post contains nudity",
    "Other"
  ];

  const [selectedReason, setSelectedReason] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert("Error", "Please select a reason.");
      return;
    }

    // Require comment if "Other" is selected
    if (selectedReason === "Other" && !comment.trim()) {
      Alert.alert("Error", "Please provide a comment for 'Other'.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        listingId,
        userId: user?.id,
        reason: selectedReason,
        comment: comment.trim(),
      };

      // Backend request
      const response = await fetch("https://your-backend.com/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // "Authorization": `Bearer ${user.token}`, // Uncomment if auth required
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Failed to submit report");

      Alert.alert("Success", "Your report has been submitted.");
      navigation.goBack();
    } catch (err) {
      console.error("Report submission error:", err);
      Alert.alert("Error", err.message || "Unable to submit report.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Why are you reporting this listing?</Text>
      <Text style={styles.subHeader}>Listing ID: {listingId}</Text>

      {reasonsList.map((r) => (
        <TouchableOpacity
          key={r}
          style={styles.radioRow}
          onPress={() => setSelectedReason(r)}
          disabled={submitting}
        >
          <View style={[
            styles.radioCircle,
            selectedReason === r && { borderColor: "#1A237E" }
          ]}>
            {selectedReason === r && <View style={styles.selectedRb} />}
          </View>
          <Text style={styles.radioText}>{r}</Text>
        </TouchableOpacity>
      ))}

      {/* Show comment only for "Other" or always optional */}
      {(selectedReason === "Other" || true) && (
        <TextInput
          style={styles.input}
          placeholder="Add a comment (optional)"
          multiline
          numberOfLines={4}
          value={comment}
          onChangeText={setComment}
          editable={!submitting}
        />
      )}

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={submitting}>
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Submit Report</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flexGrow: 1, backgroundColor: "#fff" },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  subHeader: { fontSize: 14, color: "#555", marginBottom: 20 },
  radioRow: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  radioCircle: { 
    height: 22, width: 22, borderRadius: 11, borderWidth: 2, borderColor: "#ccc", 
    alignItems: "center", justifyContent: "center", marginRight: 12 
  },
  selectedRb: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#1A237E" },
  radioText: { fontSize: 16, color: "#333" },
  input: { 
    borderWidth: 1, borderColor: "#ccc", borderRadius: 10, padding: 12, 
    textAlignVertical: "top", marginBottom: 20 
  },
  button: { backgroundColor: "#1A237E", padding: 15, borderRadius: 10, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
