// ProductDetails.jsx — FINAL FIXED: Live rating update after submit + Rate Seller works
import React, { useContext, useState, useEffect, useCallback } from "react";
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
  SafeAreaView,
} from "react-native";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { UserContext } from "../context/UserContext";
import { useCart } from "../context/CartContext";
import Avatar from "../component/avatar";

const { width } = Dimensions.get("window");

const getFullName = (userData) => {
  if (!userData) return "Seller";
  if (userData.displayName && userData.displayName.trim()) return userData.displayName.trim();
  if (userData.firstName && userData.lastName) return `${userData.firstName.trim()} ${userData.lastName.trim()}`;
  if (userData.name && userData.name.trim()) return userData.name.trim();
  if (userData.username) return userData.username;
  return "Seller";
};

const getStockStatus = (listing) => {
  const stock = listing?.stock || listing?.quantity || listing?.availableStock || listing?.inStock;
  if (stock === undefined || stock === null) {
    return { available: true, quantity: null };
  }
  return { available: stock > 0, quantity: stock };
};

export default function ProductDetails() {
  const route = useRoute();
  const navigation = useNavigation();
  const { listing } = route.params;
  const { user, getUserById, getListingReviews } = useContext(UserContext);
  const { addToCart, cartItems } = useCart();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const theme = {
    primary: "#28a745",
    secondary: "#007bff",
    success: "#28a745",
    danger: "#dc3545",
    text: isDarkMode ? "#e0e0e0" : "#212529",
    textSecondary: isDarkMode ? "#b0b0b0" : "#6c757d",
    background: isDarkMode ? "#121212" : "#fafafa",
    card: isDarkMode ? "#1e1e1e" : "#ffffff",
    border: isDarkMode ? "#333" : "#e0e6ed",
  };

  const [currentIndex, setCurrentIndex] = useState(0);
  const [seller, setSeller] = useState({ name: "Loading...", avatar: null });
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [loadingSeller, setLoadingSeller] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);

  const stockStatus = getStockStatus(listing);
  const isAvailable = stockStatus.available;
  const isInCart = cartItems.some((item) => item.id === listing.id);

  // Seller ID for rating
  const vendorId = listing?.posterId || listing?.userId || listing?.ownerId || listing?.vendorId || listing?.authorId || listing?.uid;

  // Reusable fetch function
  const fetchReviews = async () => {
    try {
      setLoadingReviews(true);
      const data = await getListingReviews(listing.id);
      setReviews(data || []);
      console.log("Reviews refreshed:", data?.length || 0, "reviews"); // Debug to confirm
    } catch (err) {
      console.log("Error fetching reviews:", err);
    } finally {
      setLoadingReviews(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchReviews();
  }, [listing.id]);

  // LIVE UPDATE: Refetch every time the screen regains focus (after submitting rating)
  useFocusEffect(
    useCallback(() => {
      // Small delay to ensure Firestore transaction is complete
      setTimeout(() => {
        fetchReviews();
      }, 800); // 0.8 seconds is safe for most cases
    }, [listing.id])
  );

  // Fetch seller info
  useEffect(() => {
    const fetchSeller = async () => {
      if (!vendorId) {
        setSeller({ name: "Unknown Seller", avatar: null });
        setLoadingSeller(false);
        return;
      }
      try {
        setLoadingSeller(true);
        if (vendorId === user?.uid || vendorId === user?.id) {
          setSeller({
            name: getFullName(user),
            avatar: user?.photoURL || user?.profileImage || user?.avatar || user?.profilePic,
          });
        } else {
          const sellerData = await getUserById(vendorId);
          setSeller({
            name: getFullName(sellerData),
            avatar: sellerData?.photoURL || sellerData?.profileImage || sellerData?.avatar || sellerData?.profilePic,
          });
        }
      } catch (err) {
        console.log("Error fetching seller:", err);
        setSeller({ name: "Seller", avatar: null });
      } finally {
        setLoadingSeller(false);
      }
    };
    fetchSeller();
  }, [vendorId, user, getUserById]);

  const averageRating = reviews.length
    ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
    : 0;

  const handleAddToCart = async () => {
    if (!user) {
      Alert.alert("Login Required", "Please login to add items to your cart", [
        { text: "Cancel" },
        { text: "Login", onPress: () => navigation.navigate("LoginScreen") }
      ]);
      return;
    }
    if (!isAvailable) {
      Alert.alert("Out of Stock", "This product is currently unavailable");
      return;
    }
    if (isInCart) {
      Alert.alert("Already in Cart", `${listing.title} is already in your cart`, [
        { text: "OK" },
        { text: "View Cart", onPress: () => navigation.navigate("Cart") }
      ]);
      return;
    }
    setAddingToCart(true);
    try {
      await addToCart(listing);
      Alert.alert("Added to Cart!", `${listing.title} has been added to your cart`, [
        { text: "Continue Shopping" },
        { text: `View Cart (${cartItems.length + 1} items)`, onPress: () => navigation.navigate("Cart") }
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to add item to cart. Please try again.");
    } finally {
      setAddingToCart(false);
    }
  };

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
              color={name === "star-outline" ? theme.textSecondary : "#FFD700"}
              style={{ marginRight: 2 }}
            />
          );
        })}
      </View>
    );
  };

  const openChat = () => {
    const ownerId = listing?.posterId || listing?.userId || listing?.ownerId || listing?.author;
    if (!ownerId) {
      Alert.alert("Error", "Cannot message seller");
      return;
    }
    navigation.navigate("HomeTabs", {
      screen: "Messages",
      params: {
        screen: "Message",
        params: {
          listingId: listing.id,
          listingOwnerId: ownerId,
          tenantId: user?.uid || "",
          listingTitle: listing.title,
          listingData: listing,
        },
      },
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
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
                onPress={() => navigation.navigate("GalleryScreen", { images: listing.images, startIndex: idx })}
              >
                <Image source={{ uri: img }} style={styles.image} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </ScrollView>
          {listing?.images?.length > 1 && (
            <View style={[styles.counterBox, { backgroundColor: "rgba(0,0,0,0.7)" }]}>
              <Text style={styles.counterText}>
                {currentIndex + 1}/{listing.images.length}
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.detailsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.text }]}>{listing?.title}</Text>

          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: theme.success }]}>₦{Number(listing.price).toLocaleString()}</Text>
          </View>

          <View style={styles.categoryRow}>
            <Ionicons name="grid-outline" size={16} color={theme.secondary} />
            <Text style={[styles.category, { color: theme.textSecondary }]}>
              {listing?.category}
            </Text>
          </View>

          {listing?.description && (
            <Text style={[styles.description, { color: theme.textSecondary }]}>
              {listing.description}
            </Text>
          )}

          <View style={[
            styles.stockRow,
            {
              backgroundColor: isAvailable ? "rgba(40,167,69,0.05)" : "rgba(220,53,69,0.05)",
              borderColor: isAvailable ? "rgba(40,167,69,0.1)" : "rgba(220,53,69,0.1)"
            }
          ]}>
            <Ionicons
              name={isAvailable ? "checkmark-circle" : "close-circle"}
              size={20}
              color={isAvailable ? theme.success : theme.danger}
            />
            <Text style={[styles.stockText, {
              color: isAvailable ? theme.success : theme.danger
            }]}>
              {isAvailable
                ? stockStatus.quantity
                  ? `In Stock (${stockStatus.quantity})`
                  : "In Stock"
                : "Out of Stock"}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.sellerCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => {
            if (!vendorId) {
              Alert.alert("Oops", "Seller profile not available");
              return;
            }
            navigation.navigate("HomeTabs", { screen: "Profile", params: { userId: vendorId } });
          }}
          activeOpacity={0.9}
        >
          {loadingSeller ? (
            <ActivityIndicator size="small" color={theme.primary} style={{ marginRight: 12 }} />
          ) : (
            <Avatar uri={seller.avatar} size={56} />
          )}
          <View style={styles.sellerInfo}>
            <Text style={[styles.sellerName, { color: theme.text }]}>
              {loadingSeller ? "Loading..." : seller.name}
            </Text>
            <Text style={[styles.sellerSub, { color: theme.textSecondary }]}>
              Seller • {listing?.location || "Nationwide"}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={theme.textSecondary} />
        </TouchableOpacity>

        <View style={[styles.ratingSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.ratingRow}>
            <View style={styles.ratingCol}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Rating</Text>
              <Text style={[styles.ratingValue, { color: theme.text }]}>
                {loadingReviews ? "—" : averageRating.toFixed(1)}
              </Text>
              {loadingReviews ? (
                <ActivityIndicator size="small" color={theme.primary} style={styles.loadingStars} />
              ) : (
                renderStars(averageRating)
              )}
            </View>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <View style={styles.ratingCol}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Reviews</Text>
              <Text style={[styles.ratingValue, { color: theme.text }]}>
                {loadingReviews ? "—" : reviews.length}
              </Text>
              <Text style={[styles.statSub, { color: theme.textSecondary }]}>total</Text>
            </View>
          </View>
        </View>

        {/* Rate Seller Button */}
        <View style={styles.reviewActions}>
          <TouchableOpacity
            style={[styles.reviewButton, { borderColor: theme.primary }]}
            onPress={() => {
              if (!vendorId) {
                Alert.alert("Hold on", "Seller info is still loading, try again in a second.");
                return;
              }
              navigation.navigate("RatingScreen", { targetUserId: vendorId });
            }}
          >
            <Ionicons name="star-outline" size={18} color={theme.primary} />
            <Text style={[styles.reviewText, { color: theme.primary }]}>Rate Seller</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={[styles.bottomActionBar, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        <TouchableOpacity
          style={[
            styles.secondaryButton,
            { backgroundColor: "#999", borderColor: "#999" }
          ]}
          onPress={openChat}
          activeOpacity={0.9}
        >
          <Ionicons name="chatbubble" size={22} color="#fff" />
          <Text style={[styles.secondaryButtonText, { color: "#fff", fontWeight: "700" }]}>
            Message
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.addToCartButton,
            {
              backgroundColor: isAvailable && !isInCart ? theme.primary : theme.danger,
              shadowColor: isAvailable && !isInCart ? theme.primary : theme.danger,
              borderColor: isAvailable && !isInCart ? theme.primary : theme.danger,
              opacity: addingToCart || !isAvailable || isInCart ? 0.7 : 1
            }
          ]}
          onPress={handleAddToCart}
          disabled={addingToCart || !isAvailable || isInCart}
          activeOpacity={0.9}
        >
          {addingToCart ? (
            <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
          ) : isInCart ? (
            <Ionicons name="checkmark-circle" size={24} color="#fff" style={{ marginRight: 8 }} />
          ) : (
            <Ionicons name="cart-outline" size={24} color="#fff" style={{ marginRight: 8 }} />
          )}
          <Text style={styles.addToCartText}>
            {addingToCart
              ? "Adding..."
              : isInCart
                ? "In Cart"
                : isAvailable
                  ? "Add to Cart"
                  : "Out of Stock"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  carouselWrapper: { position: "relative", height: 400 },
  image: { width, height: 400 },
  counterBox: { position: "absolute", top: 16, right: 16, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  counterText: { color: "#fff", fontSize: 14, fontWeight: "600", backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  detailsCard: { margin: 20, marginTop: -30, padding: 20, borderRadius: 24, borderWidth: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  title: { fontSize: 24, fontWeight: "800", marginBottom: 12, lineHeight: 28 },
  priceRow: { fontSize: 28, fontWeight: "900", marginRight: 12 },
  categoryRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  category: { fontSize: 15, marginLeft: 6, fontWeight: "600" },
  description: { fontSize: 16, lineHeight: 24, marginBottom: 16 },
  stockRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1 },
  stockText: { fontSize: 15, fontWeight: "600", marginLeft: 8 },
  sellerCard: { flexDirection: "row", alignItems: "center", margin: 20, padding: 16, borderRadius: 16, borderWidth: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 },
  sellerInfo: { flex: 1, marginLeft: 12 },
  sellerName: { fontSize: 18, fontWeight: "800", marginBottom: 2 },
  sellerSub: { fontSize: 14, fontWeight: "500" },
  ratingSection: { flexDirection: "row", margin: 20, padding: 16, borderRadius: 16, borderWidth: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 },
  ratingRow: { flex: 1, flexDirection: "row", justifyContent: "space-around", alignItems: "center" },
  ratingCol: { alignItems: "center", flex: 1 },
  statLabel: { fontSize: 13, marginBottom: 6, textAlign: "center" },
  ratingValue: { fontSize: 28, fontWeight: "900", marginBottom: 8 },
  statSub: { fontSize: 13, textAlign: "center" },
  starsRow: { flexDirection: "row", marginTop: 4 },
  loadingStars: { marginTop: 8 },
  divider: { width: 1, height: 40, marginHorizontal: 12 },
  reviewActions: { flexDirection: "row", justifyContent: "center", paddingHorizontal: 20, paddingVertical: 16, gap: 12 },
  reviewButton: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 12, borderWidth: 1, borderRadius: 25, backgroundColor: "transparent" },
  reviewText: { marginLeft: 8, fontSize: 15, fontWeight: "700" },
  bottomActionBar: { flexDirection: "row", position: "absolute", bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 20, borderTopWidth: 1, shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10, zIndex: 1000 },
  secondaryButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", borderWidth: 1, borderRadius: 12, paddingVertical: 14, marginRight: 12 },
  secondaryButtonText: { marginLeft: 6, fontSize: 16, fontWeight: "600" },
  addToCartButton: { flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", borderRadius: 12, paddingVertical: 14, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  addToCartText: { color: "#fff", fontSize: 18, fontWeight: "800" }
});