import React, { useContext, useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  useColorScheme,
  Image,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { UserContext } from "../context/UserContext";
import { addReview } from "../firebase/reviewService";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

// Helper function: "X time ago" timestamp
const formatTimeAgo = (timestamp) => {
  if (!timestamp) return "Just now";

  let date;
  if (timestamp.toDate) {
    // Firestore Timestamp
    date = timestamp.toDate();
  } else if (timestamp.seconds) {
    // Raw Firestore object
    date = new Date(timestamp.seconds * 1000);
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    return "Just now";
  }

  const now = new Date();
  const secondsAgo = Math.floor((now - date) / 1000);

  if (secondsAgo < 60) return "Just now";
  if (secondsAgo < 3600) {
    const mins = Math.floor(secondsAgo / 60);
    return `${mins} minute${mins > 1 ? "s" : ""} ago`;
  }
  if (secondsAgo < 86400) {
    const hours = Math.floor(secondsAgo / 3600);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  }
  if (secondsAgo < 2592000) {
    const days = Math.floor(secondsAgo / 86400);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }
  if (secondsAgo < 31536000) {
    const months = Math.floor(secondsAgo / 2592000);
    return `${months} month${months > 1 ? "s" : ""} ago`;
  }

  const years = Math.floor(secondsAgo / 31536000);
  return `${years} year${years > 1 ? "s" : ""} ago`;
};

export default function ProductReviews() {
  const navigation = useNavigation();
  const route = useRoute();
  const { targetUserId } = route.params || {};
  const { user: currentUser, getUserReviews } = useContext(UserContext);
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const theme = {
    primary: "#28a745",
    text: isDarkMode ? "#e0e0e0" : "#212529",
    textSecondary: isDarkMode ? "#b0b0b0" : "#6c757d",
    background: isDarkMode ? "#121212" : "#fafafa",
    card: isDarkMode ? "#1e1e1e" : "#ffffff",
    border: isDarkMode ? "#333" : "#e0e6ed",
  };

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [viewMode, setViewMode] = useState("reviews");
  const [selectedRating, setSelectedRating] = useState(0);
  const [sellerName, setSellerName] = useState("Seller");
  const [sellerAvatar, setSellerAvatar] = useState(null);
  const [reviewerInfoMap, setReviewerInfoMap] = useState({});

  const dynamicStyles = useMemo(
    () => ({
      container: { flex: 1, backgroundColor: theme.background },
      reviewCard: { backgroundColor: theme.card, borderColor: theme.border },
      ratingSummaryCard: { backgroundColor: theme.card, borderColor: theme.border },
      writeRatingSection: { backgroundColor: theme.card, borderColor: theme.border },
      bottomActionBar: { backgroundColor: theme.card, borderTopColor: theme.border },
    }),
    [theme]
  );

  const getFullName = (userData) => {
    if (!userData) return "Seller";
    if (userData.displayName?.trim()) return userData.displayName.trim();
    if (userData.firstName && userData.lastName)
      return `${userData.firstName.trim()} ${userData.lastName.trim()}`;
    if (userData.name?.trim()) return userData.name.trim();
    if (userData.username) return userData.username;
    return "Seller";
  };

  useEffect(() => {
    if (!targetUserId) {
      Alert.alert("Error", "No seller selected.");
      navigation.goBack();
      return;
    }

    const fetchSellerInfo = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", targetUserId));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setSellerName(getFullName(data));
          setSellerAvatar(data.photoURL || data.profileImage || data.avatar || null);
        }
      } catch (err) {
        console.error("Error fetching seller info:", err);
      }
    };

    fetchSellerInfo();
    fetchReviews();
  }, [targetUserId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const data = await getUserReviews?.(targetUserId);
      const safeData = Array.isArray(data) ? data : [];
      const avg =
        safeData.length > 0
          ? safeData.reduce((sum, r) => sum + (typeof r.rating === "number" ? r.rating : 0), 0) / safeData.length
          : 0;
      setReviews(safeData);
      setAverageRating(avg);
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchReviewerInfo = async () => {
      if (reviews.length === 0) {
        setReviewerInfoMap({});
        return;
      }

      const reviewerIds = [...new Set(reviews.map((r) => r.reviewerId || r.uid).filter(Boolean))];
      const newMap = { ...reviewerInfoMap };

      for (const uid of reviewerIds) {
        if (newMap[uid]) continue;

        try {
          const userDoc = await getDoc(doc(db, "users", uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            newMap[uid] = {
              name: getFullName(data),
              avatar: data.photoURL || data.profileImage || data.avatar || null,
            };
          } else {
            newMap[uid] = { name: "User", avatar: null };
          }
        } catch (err) {
          newMap[uid] = { name: "User", avatar: null };
        }
      }

      setReviewerInfoMap(newMap);
    };

    fetchReviewerInfo();
  }, [reviews]);

  const handleSubmitRating = async () => {
    if (selectedRating === 0) {
      Alert.alert("Rating Required", "Please select a star rating.");
      return;
    }
    if (!currentUser || !currentUser.uid) {
      Alert.alert("Login Required", "You must be logged in to submit a rating.");
      return;
    }

    const reviewerName =
      currentUser.displayName || currentUser.email?.split("@")[0] || "Anonymous";

    try {
      await addReview(
        targetUserId,
        selectedRating,
        currentUser.uid,
        reviewerName,
        ""
      );

      Alert.alert("Success!", `You rated ${sellerName} ${selectedRating} star${selectedRating > 1 ? "s" : ""}!`);

      setViewMode("reviews");
      setSelectedRating(0);

      setRefreshing(true);
      await fetchReviews();
      setRefreshing(false);
    } catch (error) {
      console.error("Rating submit error:", error);
      Alert.alert("Error", "Failed to submit rating. Try again.");
    }
  };

  const renderReviewItem = ({ item }) => {
    const reviewerId = item.reviewerId || item.uid;
    const reviewerInfo = reviewerInfoMap[reviewerId] || {};
    const fullName = reviewerInfo.name || item.reviewerName || "User";
    const avatarUri = reviewerInfo.avatar;

    const commentText = item.comment || item.review || item.text;

    return (
      <View style={[styles.reviewCard, dynamicStyles.reviewCard]}>
        <View style={styles.reviewHeader}>
          <View style={styles.userInfo}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={20} color="#999" />
              </View>
            )}

            <View style={styles.userDetails}>
              <Text style={[styles.userName, { color: theme.text }]} numberOfLines={1}>
                {fullName}
              </Text>
              {/* TIME AGO TIMESTAMP */}
              <Text style={[styles.reviewDate, { color: theme.textSecondary }]}>
                {formatTimeAgo(item.timestamp || item.createdAt)}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: "row" }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name={star <= (item.rating || 0) ? "star" : "star-outline"}
                size={20}
                color="#FFD700"
              />
            ))}
          </View>
        </View>

        {commentText && commentText.trim() !== "" && (
          <Text style={[styles.reviewComment, { color: theme.textSecondary }]}>
            {commentText.trim()}
          </Text>
        )}
      </View>
    );
  };

  const renderHeader = () => (
    <>
      <View style={styles.headerCard}>
        <View style={styles.headerContent}>
          <View style={styles.profileAvatarContainer}>
            {sellerAvatar ? (
              <Image source={{ uri: sellerAvatar }} style={styles.profileAvatar} />
            ) : (
              <View style={styles.profileAvatarPlaceholder}>
                <Ionicons name="person" size={32} color="#999" />
              </View>
            )}
          </View>

          <Text style={[styles.headerTitle, { color: theme.text, marginLeft: 12 }]}>
            {sellerName}'s Ratings
          </Text>

          <View style={styles.headerSpacer} />
        </View>
      </View>

      <View style={[styles.ratingSummaryCard, dynamicStyles.ratingSummaryCard]}>
        <View style={styles.ratingHeader}>
          <Text style={[styles.ratingTitle, { color: theme.text }]}>Overall Rating</Text>
          <TouchableOpacity
            onPress={() => setViewMode(viewMode === "reviews" ? "write" : "reviews")}
            style={styles.toggleButton}
          >
            <Text style={[styles.toggleText, { color: theme.primary }]}>
              {viewMode === "reviews" ? "Add Rating" : "View Ratings"}
            </Text>
            <Ionicons
              name={viewMode === "reviews" ? "add-circle-outline" : "list-outline"}
              size={20}
              color={theme.primary}
            />
          </TouchableOpacity>
        </View>

        {loading || refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              {refreshing ? "Updating..." : "Loading..."}
            </Text>
          </View>
        ) : (
          <View style={styles.ratingContent}>
            <View style={styles.mainRating}>
              <Text style={[styles.averageRating, { color: theme.text }]}>
                {averageRating.toFixed(1)}
              </Text>
              <Text style={[styles.ratingLabel, { color: theme.textSecondary }]}>out of 5</Text>
            </View>

            <View style={styles.ratingBreakdown}>
              <View style={{ flexDirection: "row" }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= Math.round(averageRating) ? "star" : "star-outline"}
                    size={24}
                    color="#FFD700"
                  />
                ))}
              </View>
              <Text style={[styles.reviewCount, { color: theme.textSecondary }]}>
                {reviews.length} rating{reviews.length !== 1 ? "s" : ""}
              </Text>
            </View>

            <View style={styles.ratingBars}>
              {[5, 4, 3, 2, 1].map((star) => {
                const count = reviews.filter((r) => typeof r.rating === "number" && r.rating === star).length;
                const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                return (
                  <View key={star} style={styles.ratingBarRow}>
                    <Text style={[styles.starLabel, { color: theme.textSecondary }]}>
                      {star} <Ionicons name="star" size={14} color="#FFD700" />
                    </Text>
                    <View style={styles.barContainer}>
                      <View
                        style={[
                          styles.barFill,
                          { width: `${percentage}%`, backgroundColor: theme.primary },
                        ]}
                      />
                      <Text style={[styles.barCount, { color: theme.textSecondary }]}>{count}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </View>

      {viewMode === "write" && (
        <View style={[styles.writeRatingSection, dynamicStyles.writeRatingSection]}>
          <Text style={[styles.writePrompt, { color: theme.text }]}>
            How would you rate {sellerName}?
          </Text>

          <View style={{ flexDirection: "row", marginVertical: 20, justifyContent: "center" }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setSelectedRating(star)} activeOpacity={0.7}>
                <Ionicons
                  name={star <= selectedRating ? "star" : "star-outline"}
                  size={48}
                  color="#FFD700"
                  style={{ marginHorizontal: 8 }}
                />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.ratingHint, { color: theme.textSecondary, textAlign: "center", marginBottom: 20 }]}>
            {selectedRating > 0 ? `${selectedRating} star${selectedRating > 1 ? "s" : ""} selected` : "Tap a star to rate"}
          </Text>
        </View>
      )}
    </>
  );

  return (
    <SafeAreaView style={dynamicStyles.container}>
      <FlatList
        data={viewMode === "reviews" ? reviews : []}
        keyExtractor={(item) => (item.id ? item.id.toString() : Math.random().toString())}
        renderItem={renderReviewItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          viewMode === "reviews" && !loading && !refreshing ? (
            <View style={styles.emptyReviewsCard}>
              <Ionicons name="star-outline" size={64} color={theme.textSecondary} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No Ratings Yet</Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                Be the first to rate {sellerName}
              </Text>
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 180 }}
        refreshing={refreshing}
        onRefresh={fetchReviews}
      />

      <View style={dynamicStyles.bottomActionBar}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor:
                (viewMode === "write" && selectedRating > 0) || viewMode === "reviews"
                  ? theme.primary
                  : "#aaa",
            },
          ]}
          disabled={viewMode === "write" && selectedRating === 0}
          onPress={async () => {
            if (viewMode === "write") {
              await handleSubmitRating();
            } else {
              setViewMode("write");
              setSelectedRating(0);
            }
          }}
        >
          <Ionicons
            name={viewMode === "write" ? "checkmark-circle-outline" : "pencil"}
            size={20}
            color="#fff"
          />
          <Text style={styles.buttonText}>
            {viewMode === "write" ? "Submit Rating" : "Add Rating"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: 12,
  },
  profileAvatarContainer: {
    marginLeft: 8,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  profileAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e9ecef",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    flex: 1,
    textAlign: "left",
  },
  headerSpacer: {
    width: 44,
    height: 44,
  },
  ratingSummaryCard: {
    margin: 20,
    marginTop: 12,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  ratingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  ratingTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(40, 167, 69, 0.2)",
    backgroundColor: "rgba(40, 167, 69, 0.05)",
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
    marginRight: 6,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  ratingContent: {
    alignItems: "center",
  },
  mainRating: {
    alignItems: "center",
    marginBottom: 20,
  },
  averageRating: {
    fontSize: 48,
    fontWeight: "900",
    lineHeight: 52,
  },
  ratingLabel: {
    fontSize: 16,
    marginTop: 4,
  },
  ratingBreakdown: {
    alignItems: "center",
    marginBottom: 24,
  },
  reviewCount: {
    fontSize: 16,
    marginTop: 8,
    fontWeight: "600",
  },
  ratingBars: {
    width: "100%",
  },
  ratingBarRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  starLabel: {
    fontSize: 14,
    fontWeight: "600",
    minWidth: 60,
  },
  barContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 16,
  },
  barFill: {
    height: 8,
    borderRadius: 4,
    marginRight: 12,
    minWidth: 20,
  },
  barCount: {
    fontSize: 12,
    fontWeight: "600",
    minWidth: 20,
    textAlign: "right",
  },
  writeRatingSection: {
    alignItems: "center",
    padding: 30,
    margin: 20,
    marginTop: 0,
    borderRadius: 20,
    borderWidth: 1,
  },
  writePrompt: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  ratingHint: {
    fontSize: 16,
    marginTop: 10,
  },
  reviewCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: "#e9ecef",
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e9ecef",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
  },
  reviewDate: {
    fontSize: 13,
    marginTop: 2,
  },
  reviewComment: {
    fontSize: 15,
    lineHeight: 22,
  },
  emptyReviewsCard: {
    alignItems: "center",
    padding: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(40, 167, 69, 0.1)",
    borderStyle: "dashed",
    backgroundColor: "rgba(40, 167, 69, 0.02)",
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: "center",
    maxWidth: 280,
  },
  bottomActionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    paddingVertical: 16,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    marginLeft: 8,
  },
});