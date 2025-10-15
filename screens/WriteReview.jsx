// screens/WriteReview.jsx
import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { UserContext } from "../context/UserContext";
import Rating from "../component/Rating";
import { useNavigation } from "@react-navigation/native";

export default function WriteReview({ route }) {
  const { listingId } = route.params;
  const navigation = useNavigation();
  const { user, submitListingReview } = useContext(UserContext); // Make sure you have this function

  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert("Error", "Please select a rating.");
      return;
    }
    if (!comment.trim()) {
      Alert.alert("Error", "Please write a comment.");
      return;
    }

    try {
      setLoading(true);
      await submitListingReview({
        listingId,
        userId: user.id,
        userName: user.name,
        rating,
        comment,
      });

      Alert.alert("Success", "Your review has been submitted!");
      navigation.goBack(); // Go back to the Rating screen
    } catch (err) {
      console.log("Submit review error:", err);
      Alert.alert("Error", "Unable to submit review. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.header}>Write a Review</Text>

      {/* Rating Selector */}
      <Text style={styles.label}>Your Rating</Text>
      <Rating
        vendorId={listingId} // optional, used inside Rating component
        userId={user.id}
        existingRating={rating}
        setRating={setRating} // allow Rating to update rating
      />

      {/* Comment Input */}
      <Text style={styles.label}>Your Comment</Text>
      <TextInput
        style={styles.input}
        multiline
        placeholder="Write your review here..."
        value={comment}
        onChangeText={setComment}
      />

      {/* Submit Button */}
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Submit Review</Text>
        )}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  header: { fontSize: 22, fontWeight: "bold", marginBottom: 20, color: "#1A237E" },
  label: { fontSize: 16, fontWeight: "600", marginTop: 10, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: "#1A237E",
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: "center",
  },
  submitButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
