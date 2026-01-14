// components/UserRatingDisplay.jsx
import React from "react";
import { View, Text } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

export default function UserRatingDisplay({ averageRating = 0, reviewCount = 0 }) {
  const rating = Number(averageRating);

  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={
            star <= rating
              ? "star"
              : star <= rating + 0.5
              ? "star-half-outline"
              : "star-outline"
          }
          size={19}
          color="#FFD700"
          style={{ marginRight: 2 }}
        />
      ))}
      <Text style={{ marginLeft: 8, fontSize: 16, fontWeight: "600", color: "#036dd6" }}>
        {rating.toFixed(1)}
        <Text style={{ color: "#777", fontWeight: "400", fontSize: 14 }}>
          {" "}({reviewCount} review{reviewCount !== 1 ? "s" : ""})
        </Text>
      </Text>
    </View>
  );
}