// screens/VisitorListings.jsx
import React, { useContext, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
  useColorScheme,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { ListingContext } from "../context/ListingContext";
import { UserContext } from "../context/UserContext";
import BlueBadge from "../assets/icons/blue.svg";
import YellowBadge from "../assets/icons/yellow.svg";
import RedBadge from "../assets/icons/red.svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function VisitorListings({ userId }) {
  const navigation = useNavigation();
  const { listings } = useContext(ListingContext);
  const { user: currentUser } = useContext(UserContext) || {};
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  // Helper to safely get owner ID
  const resolveUserId = (item) =>
    item?.authorId ?? item?.ownerId ?? item?.userId ?? item?.uid ?? null;

  const visitorListings = listings.filter(
    (item) => resolveUserId(item) === userId
  );

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
    return `${Math.floor(diff / 604800)}w ago`;
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
    const ownerId = resolveUserId(item);

    // ─── Avatar & user info ───
    let avatarUri = item.userAvatar || null;
    if (!avatarUri && ownerId === currentUser?.uid) {
      avatarUri = currentUser?.avatar || currentUser?.photoURL || currentUser?.profileImage;
    }
    if (avatarUri) avatarUri = `${avatarUri}?v=${Date.now()}`;

    const fullName = item.userName || getFullName(currentUser) || "User"; // fallback
    const verificationType = item.verificationType || null; // ideally fetched, but using placeholder

    const images =
      Array.isArray(item.images) && item.images.length > 0
        ? item.images
        : item.image
        ? [item.image]
        : [];
    const hasMultiple = images.length > 1;
    const imageCount = images.length;

    const isBoosted = item.boostedUntil && new Date(item.boostedUntil) > new Date();

    return (
      <View
        style={[
          styles.card,
          { backgroundColor: isDarkMode ? "#2a2a2a" : "#fff" },
          { borderBottomColor: isDarkMode ? "#444" : "#ddd" },
        ]}
      >
        {/* User row – same as Home */}
        <View style={styles.userRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              if (!ownerId) {
                Alert.alert("Error", "User profile not available");
                return;
              }
              navigation.navigate("Profile", { userId: ownerId });
            }}
          >
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={styles.avatar}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.avatar, styles.defaultAvatar]}>
                <Text style={styles.defaultAvatarText}>
                  {getDefaultAvatar(fullName)}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.nameContainer}>
            <View style={styles.nameRow}>
              <Text
                style={[styles.userName, { color: isDarkMode ? "#fff" : "#000" }]}
              >
                {fullName}
              </Text>
              {verificationType === "vendor" && (
                <YellowBadge width={24} height={24} style={{ marginLeft: 6 }} />
              )}
              {verificationType === "studentLandlord" && (
                <BlueBadge width={24} height={24} style={{ marginLeft: 6 }} />
              )}
              {verificationType === "realEstate" && (
                <RedBadge width={24} height={24} style={{ marginLeft: 6 }} />
              )}
            </View>

            <Text style={{ color: isDarkMode ? "#aaa" : "#666", fontSize: 12 }}>
              {timeAgo(item.createdAt)}
            </Text>
          </View>
        </View>

        {/* Images + badges */}
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
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                style={styles.imageScroll}
              >
                {images.map((imgUri, idx) => (
                  <View key={idx} style={styles.imageWrapper}>
                    <Image
                      source={{ uri: imgUri }}
                      style={styles.postImage}
                      resizeMode="cover"
                    />
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
            <View
              style={[
                styles.postImage,
                { backgroundColor: isDarkMode ? "#3a3a3a" : "#eee" },
                { justifyContent: "center", alignItems: "center" },
              ]}
            >
              <Text style={{ color: isDarkMode ? "#ccc" : "gray" }}>
                No Media
              </Text>
            </View>
          )}

          {/* Info + buttons */}
          <View style={styles.listingInfo}>
            {item.rented && (
              <View style={styles.rentedBadge}>
                <Text style={styles.rentedText}>RENTED</Text>
              </View>
            )}

            <Text
              style={[styles.listingTitle, { color: isDarkMode ? "#fff" : "#000" }]}
            >
              {item.title}
            </Text>

            <Text style={[styles.price, { color: isDarkMode ? "#aaa" : "#888" }]}>
              {formatPrice(item.priceMonthly, item.priceYearly)}
            </Text>

            <View style={styles.locationRow}>
              <Ionicons
                name="location-outline"
                size={16}
                color={isDarkMode ? "#aaa" : "#666"}
                style={styles.locationIcon}
              />
              <Text
                style={{ color: isDarkMode ? "#aaa" : "gray" }}
                numberOfLines={1}
              >
                {safeString(item.location)}
              </Text>
            </View>

            {/* Message host + Event scheduler buttons – same as Home */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.chatButton}
                onPress={() => {
                  if (!ownerId) {
                    Alert.alert("Error", "Cannot message: User not found");
                    return;
                  }
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
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  if (visitorListings.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={{ color: isDarkMode ? "#aaa" : "gray", textAlign: "center" }}>
          No listings yet.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? "#000" : "#fff" }]}>
      <FlatList
        data={visitorListings}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        renderItem={renderCard}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  card: {
    marginBottom: 15,
    borderBottomWidth: 3,
    paddingBottom: 10,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    paddingRight: 8,
    marginBottom: 4,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  defaultAvatar: {
    backgroundColor: "#017a6b",
    justifyContent: "center",
    alignItems: "center",
  },
  defaultAvatarText: { color: "#fff", fontWeight: "bold", fontSize: 20 },
  nameContainer: { marginLeft: 12, flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap" },
  userName: { fontWeight: "700", fontSize: 15.5 },
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
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
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
});