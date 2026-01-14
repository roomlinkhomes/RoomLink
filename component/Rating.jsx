// components/Rating.jsx — FINAL (uses auth.currentUser — NO ERRORS)
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { addReview } from "../firebase/reviewService";
import { auth } from "../firebaseConfig"; // ← ADD THIS LINE

export default function Rating({ targetUserId, onRatingSubmitted }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleRate = async (value) => {
    const user = auth.currentUser; // ← Use direct auth

    if (!user) {
      Alert.alert("Login Required", "You must be logged in to rate.");
      return;
    }

    if (user.uid === targetUserId) {
      Alert.alert("Wait o!", "You no fit rate yourself my guy 😂");
      return;
    }

    setRating(value);
    setLoading(true);

    try {
      const reviewerName =
        user.displayName ||
        user.email?.split("@")[0] ||
        "Anonymous";

      await addReview(
        targetUserId,
        value,
        user.uid,
        reviewerName
      );

      Alert.alert("Thank you!", `You gave ${value} star${value > 1 ? "s" : ""}!`);
      onRatingSubmitted?.(value);
    } catch (err) {
      console.error("Rating failed:", err);
      Alert.alert("Error", err.message || "Could not submit rating.");
      setRating(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Rate this User</Text>
      
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => handleRate(star)}
            onPressIn={() => setHoverRating(star)}
            onPressOut={() => setHoverRating(0)}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Ionicons
              name={star <= (hoverRating || rating) ? "star" : "star-outline"}
              size={40}
              color="#FFD700"
              style={styles.star}
            />
          </TouchableOpacity>
        ))}
      </View>

      {loading && (
        <ActivityIndicator size="small" color="#FFD700" style={{ marginTop: 12 }} />
      )}

      <Text style={styles.ratingText}>
        {rating > 0
          ? `${rating} star${rating > 1 ? "s" : ""} selected`
          : "Tap a star to rate"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    marginVertical: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    alignItems: "center",
  },
  label: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1e1e1e",
    marginBottom: 12,
  },
  stars: {
    flexDirection: "row",
    justifyContent: "center",
  },
  star: {
    marginHorizontal: 6,
  },
  ratingText: {
    textAlign: "center",
    marginTop: 12,
    fontSize: 15,
    color: "#555",
    fontWeight: "500",
  },
});