// components/Review.jsx
import React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

export default function Review({ reviews = [] }) {
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? "star" : "star-outline"}
          size={16}
          color="black" // ⭐ black stars
          style={{ marginRight: 2 }}
        />
      );
    }
    return stars;
  };

  return (
    <FlatList
      data={reviews}
      keyExtractor={(item, index) => index.toString()}
      renderItem={({ item }) => (
        <View style={styles.reviewCard}>
          <View style={styles.header}>
            <Text style={styles.username}>{item.user}</Text>
            <View style={styles.stars}>{renderStars(item.rating)}</View>
          </View>
          <Text style={styles.comment}>{item.comment}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  reviewCard: {
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  username: {
    fontWeight: "bold",
    fontSize: 14,
    marginRight: 10,
  },
  stars: {
    flexDirection: "row",
  },
  comment: {
    fontSize: 13,
    color: "#333",
  },
});
	
