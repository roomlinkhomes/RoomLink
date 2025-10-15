// screens/RatingScreen.jsx
import React, { useContext, useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert 
} from "react-native";
import { UserContext } from "../context/UserContext";
import Rating from "../component/Rating";
import Review from "../component/Review";
import { useNavigation } from "@react-navigation/native";

export default function RatingScreen({ route }) {
  const { listingId } = route.params; // get listingId from navigation
  const { getListingReviews } = useContext(UserContext);
  const navigation = useNavigation();

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const data = await getListingReviews(listingId);
        setReviews(data || []);

        // Calculate average rating
        const avg =
          data && data.length
            ? data.reduce((sum, r) => sum + (r.rating || 0), 0) / data.length
            : 0;
        setAverageRating(avg);

        setLoading(false);
      } catch (err) {
        console.log("Error fetching reviews:", err);
        Alert.alert("Error", "Unable to fetch reviews.");
        setLoading(false);
      }
    };

    fetchReviews();
  }, [listingId]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.header}>Vendor Ratings & Reviews</Text>

      {/* Rating Summary */}
      <View style={styles.ratingContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#1A237E" />
        ) : (
          <>
            <Rating rating={averageRating} size={28} />
            <Text style={styles.ratingText}>{averageRating.toFixed(1)} / 5</Text>
            <Text style={styles.reviewCount}>{reviews.length} Reviews</Text>
          </>
        )}
      </View>

      {/* Reviews List */}
      {!loading && reviews.length > 0 ? (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <Review 
              user={item.userName || item.user} 
              comment={item.comment} 
              rating={item.rating} 
            />
          )}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      ) : (
        !loading && (
          <Text style={styles.noReviewsText}>
            No reviews yet.
          </Text>
        )
      )}

      {/* Button to Write a Review */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate("WriteReview", { listingId })}
      >
        <Text style={styles.addButtonText}>Write a Review</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  header: { fontSize: 20, fontWeight: "bold", marginBottom: 20, color: "#1A237E" },
  ratingContainer: { alignItems: "center", marginBottom: 20 },
  ratingText: { fontSize: 18, fontWeight: "600", marginTop: 5, color: "#000" },
  reviewCount: { fontSize: 14, color: "#555", marginTop: 2 },
  noReviewsText: { textAlign: "center", marginTop: 20, color: "#555" },
  addButton: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#1A237E",
  },
  addButtonText: { color: "#1A237E", fontWeight: "bold" },
});
