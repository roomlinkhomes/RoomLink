// components/UserRatingModal.jsx
import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { addUserReview } from "../firebase/reviewService";
import { useUser } from "../context/UserContext";

export default function UserRatingModal({ visible, onClose, targetUserId, onSuccess }) {
  const { user: currentUser } = useUser();
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);

  const submitRating = async () => {
    if (rating === 0) {
      Alert.alert("Select a star", "Please choose a rating");
      return;
    }

    setLoading(true);
    try {
      await addUserReview(
        targetUserId,
        rating,
        currentUser.uid,
        currentUser.displayName || currentUser.username
      );
      Alert.alert("Thank you!", "Your rating has been submitted");
      onSuccess?.();
      onClose();
      setRating(0);
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to submit rating");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center" }}
        activeOpacity={1}
        onPressOut={onClose}
      >
        <View
          style={{
            margin: 30,
            backgroundColor: "white",
            borderRadius: 20,
            padding: 30,
            alignItems: "center",
          }}
          onStartShouldSetResponder={() => true}
        >
          <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 20 }}>
            Rate this user
          </Text>

          <View style={{ flexDirection: "row", marginBottom: 20 }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                style={{ padding: 8 }}
              >
                <Ionicons
                  name={star <= rating ? "star" : "star-outline"}
                  size={44}
                  color="#FFD700"
                />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={{ fontSize: 16, marginBottom: 20 }}>
            {rating > 0 ? `${rating} star${rating > 1 ? "s" : ""}` : "Tap to rate"}
          </Text>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              onPress={onClose}
              style={{
                paddingHorizontal: 24,
                paddingVertical: 12,
                backgroundColor: "#eee",
                borderRadius: 12,
              }}
            >
              <Text style={{ fontWeight: "600" }}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={submitRating}
              disabled={loading}
              style={{
                paddingHorizontal: 32,
                paddingVertical: 12,
                backgroundColor: "#036dd6",
                borderRadius: 12,
                flexDirection: "row",
                gap: 8,
                alignItems: "center",
              }}
            >
              {loading && <ActivityIndicator color="white" />}
              <Text style={{ color: "white", fontWeight: "bold" }}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}