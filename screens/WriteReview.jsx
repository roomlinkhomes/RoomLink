// screens/AddProductReview.jsx — FINAL FIXED (NO MORE ERRORS)
import React, { useState, useEffect } from "react";
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
  SafeAreaView,
  ScrollView,
  useColorScheme,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "../firebaseConfig";
import { addReview } from "../firebase/reviewService";
import Rating from "../component/Rating";

export default function AddProductReview() {
  const route = useRoute();
  const navigation = useNavigation();
  const isDark = useColorScheme() === "dark";

  // CRITICAL: Log the received param immediately
  const listingId = route.params?.listingId;
  console.log("AddProductReview received listingId:", listingId);

  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState("Customer");

  useEffect(() => {
    console.log("Current route.params:", route.params);
    if (!listingId) {
      Alert.alert("Error", "No seller selected — cannot open review form");
      navigation.goBack();
      return;
    }

    const loadUser = async () => {
      if (!auth.currentUser) {
        Alert.alert("Login Required", "Please login to write a review");
        navigation.replace("Login");
        return;
      }
      setUserName(
        auth.currentUser.displayName ||
        auth.currentUser.email?.split("@")[0] ||
        "Customer"
      );
    };
    loadUser();
  }, [listingId, navigation]);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert("Rating Required", "Please select a rating");
      return;
    }
    if (!comment.trim()) {
      Alert.alert("Review Required", "Please write your review");
      return;
    }
    if (!listingId) {
      Alert.alert("Error", "No seller selected — cannot submit");
      return;
    }

    console.log("Submitting review for seller ID:", listingId);

    setLoading(true);
    try {
      await addReview(
        listingId,
        rating,
        auth.currentUser.uid,
        userName,
        comment.trim()
      );

      Alert.alert("Thank You!", "Your review has been submitted!", [
        { text: "Write Another", onPress: () => { setComment(""); setRating(0); } },
        { text: "Done", onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      console.error("Rating failed:", err);
      Alert.alert("Error", err.message || "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? "#121212" : "#fafafa" }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>

          <View style={styles.pageHeader}>
            <View style={[
              styles.rlBadge,
              { backgroundColor: isDark ? 'rgba(0, 255, 127, 0.1)' : 'rgba(1, 122, 107, 0.08)' }
            ]}>
              <Text style={[styles.rlText, { color: isDark ? "#00ff7f" : "#017a6b" }]}>RL</Text>
            </View>

            <View style={styles.headerContent}>
              <Text style={[styles.pageTitle, { color: isDark ? "#e0e0e0" : "#1a1a1a" }]}>
                Review this Seller
              </Text>
              <Text style={[styles.itemCount, { color: isDark ? "#b0b0b0" : "#666" }]}>
                Share your experience
              </Text>
            </View>

            <View style={{ width: 48, height: 48 }} />
          </View>

          <View style={[
            styles.reviewCard,
            { backgroundColor: isDark ? "#1e1e1e" : "#ffffff", borderColor: isDark ? "#333" : "#e0e6ed" }
          ]}>
            <View style={styles.cardHeader}>
              <Ionicons name="star-outline" size={24} color={isDark ? "#00ff7f" : "#017a6b"} />
              <Text style={[styles.cardTitle, { color: isDark ? "#e0e0e0" : "#1a1a1a" }]}>
                Rate this Seller
              </Text>
            </View>
            <View style={styles.ratingCenter}>
              <Rating existingRating={rating} setRating={setRating} size={42} />
              <Text style={[styles.ratingLabel, { color: rating > 0 ? (isDark ? "#00ff7f" : "#017a6b") : (isDark ? "#666" : "#999") }]}>
                {rating > 0 ? `${rating} star${rating > 1 ? 's' : ''}` : "Tap to rate"}
              </Text>
            </View>
          </View>

          <View style={[
            styles.reviewCard,
            { backgroundColor: isDark ? "#1e1e1e" : "#ffffff", borderColor: isDark ? "#333" : "#e0e6ed" }
          ]}>
            <View style={styles.cardHeader}>
              <Ionicons name="chatbubble-outline" size={24} color={isDark ? "#00ff7f" : "#017a6b"} />
              <Text style={[styles.cardTitle, { color: isDark ? "#e0e0e0" : "#1a1a1a" }]}>
                Write Your Review
              </Text>
            </View>
            <TextInput
              style={[styles.input, { color: isDark ? "#e0e0e0" : "#1a1a1a" }]}
              multiline
              placeholder="Share your honest experience..."
              placeholderTextColor={isDark ? "#666" : "#999"}
              value={comment}
              onChangeText={setComment}
              maxLength={1000}
            />
            <Text style={[styles.counter, { color: isDark ? "#888" : "#888" }]}>
              {comment.length}/1000
            </Text>
          </View>

        </ScrollView>

        <View style={[
          styles.footer,
          { backgroundColor: isDark ? "#1e1e1e" : "#ffffff", borderTopColor: isDark ? "#333" : "#e0e6ed" }
        ]}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: rating && comment.trim() ? (isDark ? "#00ff7f" : "#017a6b") : "#666" }
            ]}
            onPress={handleSubmit}
            disabled={loading || !rating || !comment.trim()}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="send" size={18} color="#fff" />
                <Text style={styles.submitText}>Submit Review</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  rlBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(1, 122, 107, 0.2)',
  },
  rlText: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -1,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  itemCount: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  reviewCard: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
  },
  ratingCenter: { alignItems: 'center' },
  ratingLabel: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 16,
    padding: 16,
    minHeight: 140,
    textAlignVertical: 'top',
    backgroundColor: '#fcfcfc',
    fontSize: 16,
  },
  counter: {
    textAlign: 'right',
    marginTop: 10,
    fontSize: 13,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopWidth: 1,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  submitText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    marginLeft: 10,
  },
});