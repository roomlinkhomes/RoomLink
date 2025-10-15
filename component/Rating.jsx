import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import axios from "axios";

// pass props: vendorId (string), userId (string), existingRating (number)
export default function Rating({ vendorId, userId, existingRating = 0 }) {
  const [rating, setRating] = useState(existingRating);
  const [loading, setLoading] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    setRating(existingRating);
  }, [existingRating]);

  const handleRate = async (value) => {
    try {
      setRating(value);
      setLoading(true);

      // Send to backend API
      const res = await axios.post(
        "https://your-backend-api.com/api/ratings", // change to your API
        {
          vendorId,
          userId,
          rating: value,
        }
      );

      if (res.data.success) {
        Alert.alert("Success", "Your rating has been submitted!");
      } else {
        Alert.alert("Error", "Something went wrong while submitting rating.");
      }
    } catch (err) {
      console.error("Rating error:", err);
      Alert.alert("Error", "Unable to submit rating.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Rate this Vendor</Text>

      <View style={styles.stars}>
        {Array.from({ length: 5 }).map((_, i) => {
          const starIndex = i + 1;
          return (
            <TouchableOpacity
              key={i}
              onPress={() => handleRate(starIndex)}
              onPressIn={() => setHoverRating(starIndex)}
              onPressOut={() => setHoverRating(0)}
              disabled={loading}
            >
              <Ionicons
                name="star"
                size={32}
                color={
                  starIndex <= (hoverRating || rating) ? "#000" : "#ccc"
                }
                style={{ marginHorizontal: 4 }}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      {loading && <ActivityIndicator size="small" color="#1A237E" />}
      <Text style={styles.ratingText}>
        {rating > 0 ? `${rating}/5` : "No rating yet"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 15,
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 12,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    color: "#1A237E",
  },
  stars: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  ratingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#444",
  },
});
	
