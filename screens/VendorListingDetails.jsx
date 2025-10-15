import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
  useColorScheme,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { UserContext } from "../context/UserContext";
import Avatar from "../component/avatar";

const { width } = Dimensions.get("window");

export default function VendorListingDetails({ route }) {
  const { listing } = route.params;
  const navigation = useNavigation();
  const { user, getUserById, getListingReviews } = useContext(UserContext);
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const [currentIndex, setCurrentIndex] = useState(0);
  const [poster, setPoster] = useState({ name: "Unknown", avatar: null });
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [loadingPoster, setLoadingPoster] = useState(true);

  const borderColor = isDarkMode ? "#333" : "#eee"; // Dynamic border color
  const dividerColor = isDarkMode ? "#333" : "#eee";

  // ⭐ Render stars
  const renderStars = (avg) => {
    const full = Math.floor(avg);
    const hasHalf = avg - full >= 0.5;
    return (
      <View style={styles.starsRow}>
        {Array.from({ length: 5 }).map((_, i) => {
          let name = "star-outline";
          if (i < full) name = "star";
          else if (i === full && hasHalf) name = "star-half";
          return (
            <Ionicons
              key={i}
              name={name}
              size={20}
              color={name === "star-outline" ? "#ccc" : "#000"}
              style={{ marginRight: 2 }}
            />
          );
        })}
      </View>
    );
  };

  // 🔹 Fetch poster info
  useEffect(() => {
    const fetchPoster = async () => {
      try {
        if (listing?.posterId) {
          if (listing.posterId === user?.id) {
            setPoster({ name: user.name, avatar: user.avatar || user.profilePic });
          } else {
            setLoadingPoster(true);
            const otherUser = await getUserById(listing.posterId);
            setPoster({ name: otherUser?.name || "Unknown", avatar: otherUser?.avatar });
            setLoadingPoster(false);
          }
        }
      } catch (err) {
        console.log("Error fetching poster:", err);
        setLoadingPoster(false);
      }
    };
    fetchPoster();
  }, [listing, user]);

  // 🔹 Fetch reviews for listing
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoadingReviews(true);
        const data = await getListingReviews(listing.id);
        setReviews(data || []);
        setLoadingReviews(false);
      } catch (err) {
        console.log("Error fetching reviews:", err);
        setLoadingReviews(false);
        Alert.alert("Error", "Unable to fetch reviews.");
      }
    };
    fetchReviews();
  }, [listing]);

  const averageRating = reviews.length
    ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
    : 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDarkMode ? "#121212" : "#fff" }]}
    >
      {/* Image Carousel */}
      <View style={styles.carouselWrapper}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={(e) => setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
          scrollEventThrottle={16}
        >
          {listing?.images?.map((img, idx) => (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.9}
              onPress={() =>
                navigation.navigate("GalleryScreen", { images: listing.images, startIndex: idx })
              }
            >
              <Image source={{ uri: img }} style={styles.image} resizeMode="cover" />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {listing?.images?.length > 1 && (
          <View style={styles.counterBox}>
            <Text style={styles.counterText}>
              {currentIndex + 1}/{listing.images.length}
            </Text>
          </View>
        )}
      </View>

      {/* Listing Details */}
      <View
        style={[
          styles.details,
          {
            marginTop: -40,
            backgroundColor: isDarkMode ? "#1e1e1e" : "#fff",
          },
        ]}
      >
        <Text style={[styles.title, { color: isDarkMode ? "#fff" : "#000" }]}>
          {listing?.title}
        </Text>
        {!!listing?.price && (
          <Text style={[styles.price, { color: "#1A237E" }]}>
            ₦{Number(listing.price).toLocaleString()}
          </Text>
        )}
        {!!listing?.category && (
          <Text style={[styles.category, { color: isDarkMode ? "#ccc" : "#555" }]}>
            Category: {listing.category}
          </Text>
        )}
        {!!listing?.description && (
          <Text style={[styles.description, { color: isDarkMode ? "#eee" : "#000" }]}>
            {listing.description}
          </Text>
        )}
      </View>

      {/* Poster Profile */}
      <TouchableOpacity
        style={[styles.vendorBox, { borderColor: borderColor }]}
        onPress={() =>
          navigation.navigate("Profile", {
            vendor: { id: listing.posterId, name: poster.name, avatar: poster.avatar },
          })
        }
      >
        {loadingPoster ? (
          <ActivityIndicator size="small" color="#1A237E" style={{ marginRight: 12 }} />
        ) : (
          <Avatar uri={poster.avatar} size={50} />
        )}
        <View>
          <Text style={[styles.vendorName, { color: isDarkMode ? "#fff" : "#000" }]}>
            {poster.name}
          </Text>
          <Text style={[styles.vendorSub, { color: isDarkMode ? "#aaa" : "#555" }]}>
            Tap to view profile
          </Text>
        </View>
      </TouchableOpacity>

      {/* Ratings */}
      <View style={styles.ratingSection}>
        <View style={styles.statCol}>
          <Text style={[styles.statLabel, { color: isDarkMode ? "#aaa" : "#666" }]}>
            Rating
          </Text>
          <Text style={[styles.statValue, { color: isDarkMode ? "#fff" : "#000" }]}>
            {loadingReviews ? "—" : averageRating.toFixed(1)}
          </Text>
          <View>{loadingReviews ? <ActivityIndicator size="small" color="#1A237E" /> : renderStars(averageRating)}</View>
        </View>

        <View style={[styles.vertDivider, { backgroundColor: dividerColor }]} />

        <View style={styles.statCol}>
          <Text style={[styles.statLabel, { color: isDarkMode ? "#aaa" : "#666" }]}>
            Reviews
          </Text>
          <Text style={[styles.statValue, { color: isDarkMode ? "#fff" : "#000" }]}>
            {loadingReviews ? "—" : reviews.length}
          </Text>
          <Text style={[styles.statSub, { color: isDarkMode ? "#aaa" : "#666" }]}>
            total
          </Text>
        </View>
      </View>

      {/* Review Actions */}
      <View style={styles.reviewActions}>
        <TouchableOpacity
          style={styles.reviewButton}
          onPress={() => navigation.navigate("RatingScreen", { listingId: listing.id })}
        >
          <Ionicons name="create-outline" size={18} color="#1A237E" />
          <Text style={styles.reviewText}>Write a Review</Text>
        </TouchableOpacity>

        {reviews.length > 0 && (
          <TouchableOpacity
            style={[styles.reviewButton, { marginLeft: 18 }]}
            onPress={() =>
              navigation.navigate("RatingScreen", { listingId: listing.id, viewMode: "reviews" })
            }
          >
            <Ionicons name="chatbox-ellipses-outline" size={18} color="#1A237E" />
            <Text style={styles.reviewText}>See Reviews</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Contact */}
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => navigation.navigate("Orders", { listing })}
      >
        <Ionicons name="chatbubbles-outline" size={22} color="#1A237E" style={{ marginRight: 6 }} />
        <Text style={styles.actionText}>Contact</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  carouselWrapper: { position: "relative" },
  image: { width, height: 430 },
  counterBox: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  counterText: { color: "#fff", fontSize: 14 },
  details: { padding: 15, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  title: { fontSize: 20, fontWeight: "bold" },
  price: { fontSize: 18, fontWeight: "bold", marginTop: 5 },
  category: { fontSize: 14, marginTop: 5 },
  description: { fontSize: 16, marginTop: 10, lineHeight: 22 },
  vendorBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    gap: 12,
  },
  vendorName: { fontSize: 16, fontWeight: "bold" },
  vendorSub: { fontSize: 12 },
  ratingSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingTop: 14,
  },
  statCol: { flex: 1, alignItems: "center", paddingVertical: 6 },
  statLabel: { fontSize: 12, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: "700" },
  statSub: { fontSize: 12, marginTop: 2 },
  starsRow: { flexDirection: "row", marginTop: 6 },
  vertDivider: { width: 1, marginHorizontal: 10 },
  reviewActions: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    marginTop: 8,
    marginBottom: 6,
  },
  reviewButton: { flexDirection: "row", alignItems: "center" },
  reviewText: { marginLeft: 6, fontSize: 14, color: "#1A237E", fontWeight: "600" },
  actionButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1A237E",
    margin: 20,
    padding: 14,
    borderRadius: 30,
    backgroundColor: "transparent",
  },
  actionText: { color: "#1A237E", fontSize: 16, fontWeight: "600" },
});
