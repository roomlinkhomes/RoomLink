// screens/MyListing.jsx
import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  ScrollView,
  Modal,
  useColorScheme,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { ListingContext } from "../context/ListingContext";
import { UserContext } from "../context/UserContext";
import { db } from "../firebaseConfig";
import { doc, collection, onSnapshot, setDoc } from "firebase/firestore";
import { BarChart } from "react-native-gifted-charts";

// SVG badges – same as Home
import BlueBadge from "../assets/icons/blue.svg";
import YellowBadge from "../assets/icons/yellow.svg";
import RedBadge from "../assets/icons/red.svg";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function MyListing() {
  const navigation = useNavigation();
  const {
    listings,
    deleteListing,
    addListing,
    updateListing,
    markAsRented,
    loading: listingsLoading,
  } = useContext(ListingContext);
  const { user: currentUser } = useContext(UserContext);

  const [menuVisible, setMenuVisible] = useState(false);
  const [analyticsVisible, setAnalyticsVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [viewCounts, setViewCounts] = useState({});

  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const resolveUserId = (item) =>
    item?.userId ?? item?.ownerId ?? item?.authorId ?? item?.uid ?? null;

  const myListings = listings.filter(
    (item) => resolveUserId(item) === currentUser?.uid
  );

  useEffect(() => {
    if (!currentUser || myListings.length === 0) return;
    const unsubscribers = myListings.map((item) => {
      const colRef = collection(db, "listings", item.id, "views");
      return onSnapshot(colRef, (snapshot) => {
        setViewCounts((prev) => ({
          ...prev,
          [item.id]: snapshot.size,
        }));
      });
    });
    return () => unsubscribers.forEach((unsub) => unsub && unsub());
  }, [currentUser, myListings]);

  const openMenu = (item) => {
    setSelectedItem(item);
    setMenuVisible(true);
  };

  const closeMenu = () => {
    setMenuVisible(false);
    setSelectedItem(null);
  };

  const confirmDelete = (id) => {
    Alert.alert("Delete Listing", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteListing(id);
          closeMenu();
        },
      },
    ]);
  };

  const handleRelist = async (item) => {
    const newListing = {
      ...item,
      rented: false,
      createdAt: Date.now(),
    };
    delete newListing.id;
    await addListing(newListing);
    closeMenu();
  };

  const handleMarkAsRented = async (item) => {
    await markAsRented(item.id, !item.rented);
    closeMenu();
  };

  const openAnalytics = (item) => {
    setSelectedItem(item);
    setAnalyticsVisible(true);
  };

  const closeAnalytics = () => {
    setAnalyticsVisible(false);
    setSelectedItem(null);
  };

  const chartData = [
    { value: viewCounts[selectedItem?.id] ?? 0, label: "Today" },
    { value: Math.floor((viewCounts[selectedItem?.id] ?? 0) * 0.6), label: "Week" },
    { value: Math.floor((viewCounts[selectedItem?.id] ?? 0) * 0.3), label: "Month" },
  ];

  // ─── Helpers copied from Home.jsx ───
  const getFullName = (userData) => {
    if (!userData) return "User";
    if (userData.displayName?.trim()) return userData.displayName.trim();
    if (userData.firstName && userData.lastName)
      return `${userData.firstName.trim()} ${userData.lastName.trim()}`;
    if (userData.name?.trim()) return userData.name.trim();
    if (userData.username) return userData.username;
    return "User";
  };

  const timeAgo = (date) => {
    if (!date) return "";
    const now = new Date();
    const past = new Date(date);
    const diff = (now - past) / 1000;
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    if (diff < 2592000) return `${Math.floor(diff / 604800)}w ago`;
    return `${Math.floor(diff / 2592000)}mo ago`;
  };

  const formatNum = (num) => {
    if (!num) return null;
    return '₦' + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const formatPrice = (monthly, yearly) => {
    const monthlyText = monthly ? formatNum(monthly) + "/month" : null;
    const yearlyText = yearly ? formatNum(yearly) + "/year" : null;
    if (monthlyText && yearlyText) return `${monthlyText} • ${yearlyText}`;
    if (monthlyText) return monthlyText;
    if (yearlyText) return yearlyText;
    return "Price on request";
  };

  const safeString = (value, fallback = "Not specified") => {
    if (!value) return fallback;
    if (typeof value === "string") return value;
    return value?.name || fallback;
  };

  const getDefaultAvatar = (name) => (!name ? "U" : name.charAt(0).toUpperCase());

  const renderCard = ({ item }) => {
    const images =
      Array.isArray(item.images) && item.images.length > 0
        ? item.images
        : item.image
        ? [item.image]
        : [];
    const hasMultiple = images.length > 1;
    const imageCount = images.length;
    const isBoosted = item.boostedUntil && new Date(item.boostedUntil) > new Date();

    // Mirror Home's avatar logic (using currentUser since it's own listing)
    let avatarUri = currentUser?.avatar || currentUser?.photoURL || currentUser?.profileImage;
    if (avatarUri) avatarUri = `${avatarUri}?v=${Date.now()}`;

    const fullName = getFullName(currentUser);
    const verificationType = currentUser?.verificationType;
    const averageRating = currentUser?.averageRating || 0;
    const reviewCount = currentUser?.reviewCount || 0;
    const hasRating = averageRating > 0 || reviewCount > 0;

    const ownerId = currentUser?.uid;

    return (
      <View style={[styles.card, { backgroundColor: isDarkMode ? "#2a2a2a" : "#fff", borderBottomColor: isDarkMode ? "#444" : "#ddd" }]}>
        {/* User row - exact match to Home */}
        <View style={styles.userRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              if (!ownerId) return Alert.alert("Error", "User profile not available");
              navigation.navigate("Profile", { userId: ownerId });
            }}
          >
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} resizeMode="cover" />
            ) : (
              <View style={[styles.avatar, styles.defaultAvatar]}>
                <Text style={styles.defaultAvatarText}>{getDefaultAvatar(fullName)}</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.nameContainer}>
            <View style={styles.nameRow}>
              <Text style={[styles.userName, { color: isDarkMode ? "#fff" : "#000" }]}>{fullName}</Text>
              {verificationType === "vendor" && <YellowBadge width={24} height={24} style={{ marginLeft: 6 }} />}
              {verificationType === "studentLandlord" && <BlueBadge width={24} height={24} style={{ marginLeft: 6 }} />}
              {verificationType === "realEstate" && <RedBadge width={24} height={24} style={{ marginLeft: 6 }} />}
            </View>

            <View style={styles.secondaryRow}>
              {hasRating && (
                <View style={styles.ratingRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Ionicons
                      key={s}
                      name={s <= Math.floor(averageRating) ? "star" : s <= averageRating ? "star-half" : "star-outline"}
                      size={11}
                      color={s <= averageRating ? "#FFA41C" : "#888"}
                      style={{ marginRight: 1 }}
                    />
                  ))}
                  <Text style={styles.ratingText}>{averageRating.toFixed(1)}</Text>
                </View>
              )}
              <Text style={{ color: isDarkMode ? "#aaa" : "gray", fontSize: 12 }}>
                {timeAgo(item.createdAt)}
                {hasRating && " • "}
                {hasRating && <Text style={styles.reviewCount}>({reviewCount})</Text>}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.menuButton} onPress={() => openMenu(item)}>
            <Ionicons name="ellipsis-vertical" size={20} color={isDarkMode ? "#fff" : "#000"} />
          </TouchableOpacity>
        </View>

        {/* Images section - exact match */}
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={() => navigation.navigate("ListingDetails", { listing: item })}
        >
          {isBoosted && (
            <View style={styles.boostedBadge}>
              <Ionicons name="flame" size={16} color="#FF9500" />
              <Text style={styles.boostedBadgeText}>Boosted</Text>
            </View>
          )}

          {images.length > 0 ? (
            <View style={styles.imagesContainer}>
              <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
                {images.map((imgUri, idx) => (
                  <View key={idx} style={styles.imageWrapper}>
                    <Image source={{ uri: imgUri }} style={styles.postImage} resizeMode="cover" />
                    {hasMultiple && idx === 0 && (
                      <View style={styles.imageCountBadge}>
                        <Text style={styles.imageCountText}>1/{imageCount}</Text>
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : (
            <View style={{ width: SCREEN_WIDTH, height: 250, backgroundColor: isDarkMode ? "#3a3a3a" : "#eee", justifyContent: "center", alignItems: "center" }}>
              <Text style={{ color: isDarkMode ? "#ccc" : "gray" }}>No Media</Text>
            </View>
          )}

          {/* Info section */}
          <View style={styles.listingInfo}>
            {item.rented && (
              <View style={styles.rentedBadge}>
                <Text style={styles.rentedText}>RENTED</Text>
              </View>
            )}
            <Text style={[styles.listingTitle, { color: isDarkMode ? "#fff" : "#000" }]}>{item.title}</Text>
            <Text style={[styles.price, { color: isDarkMode ? "#aaa" : "#888" }]}>
              {formatPrice(item.priceMonthly, item.priceYearly)}
            </Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={16} color={isDarkMode ? "#aaa" : "#666"} style={styles.locationIcon} />
              <Text style={{ color: isDarkMode ? "#aaa" : "gray" }} numberOfLines={1}>
                {safeString(item.location)}
              </Text>
            </View>

            {/* Buttons - mirroring Home's Message host + Event scheduler */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.chatButton}
                onPress={() => {
                  if (!ownerId) return Alert.alert("Error", "Cannot message: User not found");
                  navigation.navigate("Messages", {
                    screen: "Message",
                    params: {
                      listingId: item.id,
                      listingOwnerId: ownerId,
                      tenantId: currentUser?.uid || "",
                      listingTitle: item.title,
                    },
                  });
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="chatbubble-ellipses" size={16} color="#017a6b" />
                  <Text style={styles.chatText}>Message host</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.eventButton}
                onPress={() => {
                  navigation.navigate("EventScheduler", {
                    listingId: item.id,
                    listingTitle: item.title,
                    ownerId,
                  });
                }}
              >
                <Ionicons name="calendar-outline" size={18} color="#017a6b" />
              </TouchableOpacity>

              {/* Your extra analytics trigger */}
              <TouchableOpacity
                style={{ marginLeft: 12 }}
                onPress={() => openAnalytics(item)}
              >
                <Ionicons name="stats-chart-outline" size={22} color={isDarkMode ? "#aaa" : "#555"} />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  if (!currentUser) {
    return (
      <View style={styles.emptyState}>
        <Text style={{ color: isDarkMode ? "#aaa" : "gray" }}>
          Please log in to view your listings.
        </Text>
      </View>
    );
  }

  if (listingsLoading || !listings) {
    return (
      <View style={styles.emptyState}>
        <ActivityIndicator size="large" color="#017a6b" />
        <Text style={{ color: isDarkMode ? "#aaa" : "gray", marginTop: 20 }}>
          Loading your listings...
        </Text>
      </View>
    );
  }

  if (myListings.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={{ color: isDarkMode ? "#aaa" : "gray", textAlign: "center" }}>
          You have no listings yet.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? "#000" : "#fff" }]}>
      {/* Header */}
      <View style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-start",
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 32,
      }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 10 }}>
          <Ionicons name="arrow-back" size={28} color={isDarkMode ? "#fff" : "#000"} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center", marginRight: 48 }}>
          <Text style={[styles.pageTitle, { color: isDarkMode ? "#fff" : "#000" }]}>
            My Listings
          </Text>
        </View>
      </View>

      <FlatList
        data={myListings}
        keyExtractor={(item) => item.id || item._key}
        renderItem={renderCard}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      {/* Bottom menu modal */}
      <Modal visible={menuVisible} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={closeMenu}>
          <View style={styles.bottomSheet}>
            {selectedItem && (
              <>
                <TouchableOpacity style={styles.sheetRow} onPress={() => confirmDelete(selectedItem.id)}>
                  <Ionicons name="trash-outline" size={20} color="red" />
                  <Text style={styles.sheetText}>Delete</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sheetRow} onPress={() => handleRelist(selectedItem)}>
                  <Ionicons name="repeat-outline" size={20} color="#00796B" />
                  <Text style={styles.sheetText}>Relist</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sheetRow} onPress={() => handleMarkAsRented(selectedItem)}>
                  <Ionicons name="checkmark-done-circle-outline" size={20} color="#2E7D32" />
                  <Text style={styles.sheetText}>
                    {selectedItem.rented ? "Mark Available" : "Mark Rented"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.sheetRow}
                  onPress={() => {
                    closeMenu();
                    navigation.navigate("EditListing", { listing: selectedItem });
                  }}
                >
                  <Ionicons name="pencil-outline" size={20} color="#017a6b" />
                  <Text style={styles.sheetText}>Edit</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Analytics modal */}
      <Modal visible={analyticsVisible} transparent animationType="slide">
        <TouchableOpacity style={styles.analyticsOverlay} activeOpacity={1} onPressOut={closeAnalytics}>
          <View style={styles.analyticsSheet}>
            <Text style={styles.analyticsHeader}>Listing Analytics</Text>
            <View style={styles.analyticsRow}>
              <Ionicons name="stats-chart-outline" size={22} color="#007AFF" />
              <Text style={styles.analyticsValue}>
                Views: {selectedItem ? viewCounts[selectedItem.id] ?? 0 : 0}
              </Text>
            </View>
            <View style={{ marginTop: 20 }}>
              <BarChart
                data={chartData}
                barWidth={40}
                spacing={30}
                roundedTop
                hideRules
                yAxisThickness={0}
                xAxisThickness={0}
                frontColor="#007AFF"
                width={SCREEN_WIDTH - 40}
                height={200}
              />
            </View>
            <Text style={styles.analyticsPlaceholder}>
              Your listing views and progress will appear here.
            </Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pageTitle: { fontSize: 24, fontWeight: "800" },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  card: { marginBottom: 15, borderBottomWidth: 3, paddingBottom: 10 },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    paddingRight: 8,
    marginBottom: 4,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  defaultAvatar: { backgroundColor: "#017a6b", justifyContent: "center", alignItems: "center" },
  defaultAvatarText: { color: "#fff", fontWeight: "bold", fontSize: 20 },
  nameContainer: { marginLeft: 12, flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap" },
  userName: { fontWeight: "700", fontSize: 15.5 },
  secondaryRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 2,
    gap: 8,
  },
  ratingRow: { flexDirection: "row", alignItems: "center" },
  ratingText: { marginLeft: 4, fontSize: 11.5, fontWeight: "600", color: "#333" },
  reviewCount: { fontSize: 10, color: "#777", fontWeight: "400" },
  menuButton: { padding: 8, marginLeft: 8, borderRadius: 20 },
  imagesContainer: { position: "relative" },
  imageScroll: { width: SCREEN_WIDTH, height: 250 },
  imageWrapper: { width: SCREEN_WIDTH, height: 250 },
  postImage: { width: "100%", height: "100%" },
  imageCountBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.65)",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    zIndex: 10,
  },
  imageCountText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  listingInfo: { padding: 10 },
  listingTitle: { fontSize: 18, fontWeight: "800", lineHeight: 24, marginBottom: 8 },
  price: { fontSize: 14, fontWeight: "500", letterSpacing: 0.2, marginBottom: 4 },
  locationRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  locationIcon: { marginRight: 6 },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingHorizontal: 2,
  },
  chatButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#000",
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    marginRight: 10,
  },
  chatText: {
    color: "#000000",
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 8,
  },
  eventButton: {
    width: 45,
    height: 36,
    borderWidth: 1.5,
    borderColor: "#000",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  rentedBadge: {
    backgroundColor: "red",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 6,
  },
  rentedText: { color: "#fff", fontWeight: "bold", fontSize: 12 },
  boostedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,149,0,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  boostedBadgeText: {
    color: "#FF9500",
    fontWeight: "bold",
    fontSize: 13,
    marginLeft: 5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  bottomSheet: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  sheetRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  sheetText: {
    fontSize: 16,
    marginLeft: 10,
    fontWeight: "600",
  },
  analyticsOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  analyticsSheet: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: "100%",
  },
  analyticsHeader: { fontSize: 18, fontWeight: "700", marginBottom: 15 },
  analyticsRow: { flexDirection: "row", alignItems: "center" },
  analyticsValue: { fontSize: 16, fontWeight: "600", marginLeft: 8 },
  analyticsPlaceholder: { marginTop: 15, fontSize: 14, color: "#777" },
});