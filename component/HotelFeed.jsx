// component/HotelFeed.jsx — FIXED: Removed Intl, used manual formatter + location icon + safe rendering
import React, { useContext, useMemo, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
  FlatList,
  useColorScheme,
  Alert,
  Share,
  Dimensions,
  Animated,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { ListingContext } from "../context/ListingContext";
import { UserContext } from "../context/UserContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import BlueBadge from "../assets/icons/blue.svg";
import YellowBadge from "../assets/icons/yellow.svg";
import RedBadge from "../assets/icons/red.svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

// Manual formatter (no Intl dependency - fixes Android/Hermes crash)
const formatPricePerNight = (price) => {
  if (!price) return "Price on request";

  // Add commas + ₦ prefix
  const formatted = price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return "₦" + formatted + " / night";
};

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

const safeString = (value, fallback = "Not specified") => {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  return value?.name || fallback;
};

export default function HotelFeed({ navigation, scrollY, onScroll }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const { listings = [] } = useContext(ListingContext) || {};
  const { user: currentUser } = useContext(UserContext) || {};

  const [posts, setPosts] = useState([]);
  const [menuVisible, setMenuVisible] = useState(null);
  const [userInfoMap, setUserInfoMap] = useState({});

  useEffect(() => {
    const hotelListings = listings.filter((l) => l.listingType === "hotels");
    setPosts(hotelListings);
  }, [listings]);

  useEffect(() => {
    const fetchUserInfo = async () => {
      const uniqueUserIds = [...new Set(posts.map((p) => p.userId).filter(Boolean))];
      const newInfo = {};
      await Promise.all(
        uniqueUserIds.map(async (uid) => {
          if (!userInfoMap[uid]) {
            try {
              const userDoc = await getDoc(doc(db, "users", uid));
              if (userDoc.exists()) {
                const data = userDoc.data();
                newInfo[uid] = {
                  name: getFullName(data),
                  avatar: data.photoURL || data.profileImage || data.avatar || null,
                  verificationType: data.verificationType || null,
                };
              } else {
                newInfo[uid] = { name: "User", avatar: null, verificationType: null };
              }
            } catch (err) {
              newInfo[uid] = { name: "User", avatar: null, verificationType: null };
            }
          }
        })
      );
      setUserInfoMap((prev) => ({ ...prev, ...newInfo }));
    };
    if (posts.length > 0) fetchUserInfo();
  }, [posts]);

  const dynamicStyles = useMemo(
    () => ({
      containerBg: { backgroundColor: isDark ? "#1e1e1e" : "#fff" },
      cardBg: { backgroundColor: isDark ? "#2a2a2a" : "#fff" },
      cardBorder: { borderBottomColor: isDark ? "#444" : "#ddd" },
      textColor: { color: isDark ? "#fff" : "#000" },
      secondaryText: { color: isDark ? "#aaa" : "gray" },
      priceColor: { color: "#00ff7f" },
      noImageBg: { backgroundColor: isDark ? "#3a3a3a" : "#eee" },
      dropdownBg: { backgroundColor: isDark ? "#333" : "#fff" },
      dropdownText: { color: isDark ? "#fff" : "#111" },
    }),
    [isDark]
  );

  const getDefaultAvatar = (name) => (!name ? "U" : name.charAt(0).toUpperCase());

  const handleShare = async (item) => {
    try {
      await Share.share({
        message: `Check out this hotel/short-let:\n${item.title}\n${formatPricePerNight(
          item.pricePerNight
        )}\nhttps://roomlink.homes/listing/${item.id}`,
      });
    } catch (err) {}
    setMenuVisible(null);
  };

  const handleCopy = async (item) => {
    await Clipboard.setStringAsync(`https://roomlink.homes/listing/${item.id || ""}`);
    Alert.alert("Copied!", "Listing link copied to clipboard.");
    setMenuVisible(null);
  };

  const handleReserve = (item) => {
    if (!item?.id) {
      Alert.alert("Error", "Cannot reserve this listing.");
      return;
    }
    navigation.navigate("HotelBookingScreen", { listing: item });
  };

  const renderPost = ({ item, index }) => {
    if (!item) return null;
    const isMyPost = item.userId === currentUser?.uid;
    const ownerId = item.userId;
    const userInfo = userInfoMap[ownerId] || {};
    const fullName = userInfo.name || "User";
    const avatarUri = userInfo.avatar || (isMyPost ? currentUser?.photoURL || currentUser?.avatar : null);
    const verificationType = userInfo.verificationType;
    const images = Array.isArray(item.images) && item.images.length > 0 ? item.images : [];
    const isBoosted = item.boostedUntil && new Date(item.boostedUntil) > new Date();

    return (
      <TouchableWithoutFeedback onPress={() => menuVisible !== null && setMenuVisible(null)}>
        <View style={[styles.card, dynamicStyles.cardBg, dynamicStyles.cardBorder]}>
          <View style={styles.userRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                if (!ownerId) return;
                navigation.navigate("Profile", { userId: ownerId });
              }}
            >
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.defaultAvatar]}>
                  <Text style={styles.defaultAvatarText}>{getDefaultAvatar(fullName)}</Text>
                </View>
              )}
            </TouchableOpacity>
            <View style={{ marginLeft: 10, flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={[styles.userName, dynamicStyles.textColor]}>{fullName}</Text>
                {verificationType === "vendor" && <YellowBadge width={24} height={24} style={{ marginLeft: 6 }} />}
                {verificationType === "studentLandlord" && <BlueBadge width={24} height={24} style={{ marginLeft: 6 }} />}
                {verificationType === "realEstate" && <RedBadge width={24} height={24} style={{ marginLeft: 6 }} />}
              </View>
              <Text style={dynamicStyles.secondaryText}>{timeAgo(item.createdAt)}</Text>
            </View>
          </View>

          <TouchableOpacity activeOpacity={0.95} onPress={() => navigation.navigate("ListingDetails", { listing: item })}>
            {isBoosted && (
              <View style={styles.boostedBadge}>
                <Ionicons name="flame" size={16} color="#FF9500" />
                <Text style={styles.boostedBadgeText}>Boosted</Text>
              </View>
            )}

            {images.length > 0 ? (
              <Image source={{ uri: images[0] }} style={styles.postImage} resizeMode="cover" />
            ) : (
              <View style={[styles.postImage, dynamicStyles.noImageBg, { justifyContent: "center", alignItems: "center" }]}>
                <Text style={{ color: isDark ? "#ccc" : "#888" }}>No Photos</Text>
              </View>
            )}

            <View style={styles.listingInfo}>
              <Text style={[styles.listingTitle, dynamicStyles.textColor]} numberOfLines={2}>
                {item.title || "Untitled Listing"}
              </Text>

              <Text style={[styles.price, dynamicStyles.priceColor]}>
                {formatPricePerNight(item.pricePerNight)}
              </Text>

              {/* Location with icon */}
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={16} color={isDark ? "#aaa" : "#666"} style={styles.locationIcon} />
                <Text style={dynamicStyles.secondaryText} numberOfLines={1}>
                  {safeString(item.location)}
                </Text>
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.reserveButton} onPress={() => handleReserve(item)}>
                  <Ionicons name="calendar-outline" size={18} color="#fff" />
                  <Text style={styles.reserveText}>Reserve Now</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setMenuVisible(menuVisible === index ? null : index)}
                  style={styles.menuShield}
                >
                  <Ionicons name="ellipsis-vertical" size={20} color={isDark ? "#fff" : "#000"} />
                </TouchableOpacity>
              </View>

              {menuVisible === index && (
                <View style={[styles.dropdownContainer, dynamicStyles.dropdownBg]}>
                  <TouchableOpacity onPress={() => handleShare(item)}>
                    <Text style={[styles.dropdownItem, dynamicStyles.dropdownText]}>Share</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleCopy(item)}>
                    <Text style={[styles.dropdownItem, dynamicStyles.dropdownText]}>Copy Link</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    );
  };

  return (
    <View style={[styles.container, dynamicStyles.containerBg]}>
      <AnimatedFlatList
        data={posts}
        keyExtractor={(item, index) => `${item.id || 'hotel-unknown'}-${index}`}
        renderItem={renderPost}
        contentContainerStyle={{ paddingTop: 180, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, dynamicStyles.textColor]}>
              No hotel or short-let listings yet.
            </Text>
            <Text style={[styles.emptySubtext, dynamicStyles.secondaryText]}>
              Be the first to post one!
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: {
    marginBottom: 15,
    borderBottomWidth: 3,
    paddingBottom: 10,
    borderRadius: 12,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    marginBottom: 6,
  },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  defaultAvatar: {
    backgroundColor: "#017a6b",
    justifyContent: "center",
    alignItems: "center",
  },
  defaultAvatarText: { color: "#fff", fontWeight: "bold", fontSize: 18 },
  userName: { fontWeight: "700", fontSize: 15 },
  postImage: { width: SCREEN_WIDTH, height: 250 },
  listingInfo: { padding: 10 },
  listingTitle: { fontSize: 18, fontWeight: "800", lineHeight: 24, marginBottom: 8 },
  price: { fontSize: 20, fontWeight: "900", letterSpacing: 0.5, marginBottom: 4 },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  locationIcon: {
    marginRight: 6,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  reserveButton: {
    flex: 1,
    backgroundColor: "#017a6b",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 10,
  },
  reserveText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
    marginLeft: 8,
  },
  menuShield: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(1,122,107,0.2)",
    borderColor: "#888",
    borderWidth: 1,
  },
  dropdownContainer: {
    position: "absolute",
    top: 40,
    right: 10,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    minWidth: 140,
    zIndex: 10,
  },
  dropdownItem: { paddingVertical: 10, fontSize: 15 },
  boostedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,149,0,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 8,
    marginLeft: 10,
    marginTop: 10,
  },
  boostedBadgeText: {
    color: "#FF9500",
    fontWeight: "bold",
    fontSize: 13,
    marginLeft: 5,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: { fontSize: 18, fontWeight: "600", marginBottom: 8 },
  emptySubtext: { fontSize: 14 },
});