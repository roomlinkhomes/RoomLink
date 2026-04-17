// component/HotelFeed.jsx
import React, { useContext, useMemo, useEffect, useState, useRef, useCallback } from "react";
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
  ScrollView,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { ListingContext } from "../context/ListingContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import BlueBadge from "../assets/icons/blue.svg";
import YellowBadge from "../assets/icons/yellow.svg";
import RedBadge from "../assets/icons/red.svg";

// Trust Badge
import Trust from "../component/Trust";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

const formatPricePerNight = (price) => {
  if (!price) return "Price on request";
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

const timeAgo = (dateInput) => {
  if (!dateInput) return "Just now";

  let date;
  if (dateInput?.toDate && typeof dateInput.toDate === "function") {
    date = dateInput.toDate();
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else if (typeof dateInput === "string" || typeof dateInput === "number") {
    date = new Date(dateInput);
  } else {
    return "Just now";
  }

  if (isNaN(date.getTime())) return "Just now";

  const now = new Date();
  const diff = Math.floor((now - date) / 1000);

  if (diff < 5) return "Just now";
  if (diff < 60) return `${diff}s ago`;
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

export default function HotelFeed({ navigation, scrollY }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { listings = [], loading } = useContext(ListingContext) || {};

  const [posts, setPosts] = useState([]);
  const [menuVisible, setMenuVisible] = useState(null);
  const [userInfoMap, setUserInfoMap] = useState({});
  const [hasNewPosts, setHasNewPosts] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);

  const flatListRef = useRef(null);
  const previousPostCount = useRef(0);

  const normalizeCreatedAt = (createdAt) => {
    if (createdAt?.toDate && typeof createdAt.toDate === "function") {
      return createdAt.toDate();
    }
    if (createdAt instanceof Date) {
      return createdAt;
    }
    if (typeof createdAt === "string" || typeof createdAt === "number") {
      const date = new Date(createdAt);
      return isNaN(date.getTime()) ? new Date() : date;
    }
    return new Date();
  };

  const handleHomeTap = useCallback(() => {
    if (!flatListRef.current) return;

    if (isAtTop) {
      const hotelListings = listings
        .filter((l) => l.listingType === "hotels")
        .map((item) => ({
          ...item,
          createdAt: normalizeCreatedAt(item.createdAt),
        }))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      setPosts(hotelListings);
      setHasNewPosts(false);
    } else {
      flatListRef.current.scrollToOffset({
        offset: 0,
        animated: true,
      });
    }
  }, [isAtTop, listings]);

  useEffect(() => {
    global.scrollToTop = handleHomeTap;
  }, [handleHomeTap]);

  useEffect(() => {
    const hotelListings = listings
      .filter((l) => l.listingType === "hotels")
      .map((item) => ({
        ...item,
        createdAt: normalizeCreatedAt(item.createdAt),
      }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    setPosts(hotelListings);
  }, [listings]);

  useEffect(() => {
    if (posts.length > previousPostCount.current && !isAtTop) {
      setHasNewPosts(true);
    }
    previousPostCount.current = posts.length;
  }, [posts.length, isAtTop]);

  useEffect(() => {
    const fetchUserInfo = async () => {
      const uniqueUserIds = [...new Set(posts.map((p) => p.userId).filter(Boolean))];
      const newInfo = { ...userInfoMap };

      await Promise.all(
        uniqueUserIds.map(async (uid) => {
          if (!newInfo[uid]) {
            try {
              const userDoc = await getDoc(doc(db, "users", uid));
              if (userDoc.exists()) {
                const data = userDoc.data();
                newInfo[uid] = {
                  name: getFullName(data),
                  avatar: data.photoURL || data.profileImage || data.avatar || null,
                  isVerified: data.isVerified === true,
                  verificationType: data.verificationType || null,
                  averageRating: data.averageRating || 0,
                  reviewCount: data.reviewCount || 0,
                };
              } else {
                newInfo[uid] = {
                  name: "User",
                  avatar: null,
                  isVerified: false,
                  verificationType: null,
                  averageRating: 0,
                  reviewCount: 0,
                };
              }
            } catch (err) {
              console.warn(`Failed to fetch user ${uid}:`, err);
              newInfo[uid] = {
                name: "User",
                avatar: null,
                isVerified: false,
                verificationType: null,
                averageRating: 0,
                reviewCount: 0,
              };
            }
          }
        })
      );
      setUserInfoMap(newInfo);
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
      priceColor: { color: isDark ? "#aaa" : "#888" },
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
          item.guestPricePerNight || item.pricePerNight
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

    const ownerId = item.userId;
    const userInfo = userInfoMap[ownerId] || {};
    const fullName = userInfo.name || "User";
    const isVerified = userInfo.isVerified === true;
    const verificationType = userInfo.verificationType;
    const hasRating = userInfo.averageRating > 0 || userInfo.reviewCount > 0;

    const avatarUri = userInfo.avatar || null;
    const images = Array.isArray(item.images) && item.images.length > 0 ? item.images : [];
    const hasMultiple = images.length > 1;
    const imageCount = images.length;
    const isBoosted = item.boostedUntil && new Date(item.boostedUntil) > new Date();

    return (
      <TouchableWithoutFeedback onPress={() => menuVisible !== null && setMenuVisible(null)}>
        <View style={[styles.card, dynamicStyles.cardBg, dynamicStyles.cardBorder]}>
          <View style={styles.userRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => ownerId && navigation.navigate("Profile", { userId: ownerId })}
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
                <Text style={[styles.userName, dynamicStyles.textColor]}>{fullName}</Text>
                {isVerified && <Trust text="Verified Host" />}
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
                        name={s <= Math.floor(userInfo.averageRating || 0) ? "star" : s <= (userInfo.averageRating || 0) ? "star-half" : "star-outline"}
                        size={11}
                        color={s <= (userInfo.averageRating || 0) ? "#FFA41C" : "#888"}
                        style={{ marginRight: 1 }}
                      />
                    ))}
                    <Text style={styles.ratingText}>{userInfo.averageRating?.toFixed(1) || "0.0"}</Text>
                  </View>
                )}
                <Text style={[dynamicStyles.secondaryText, styles.timestamp]}>
                  {timeAgo(item.createdAt)}
                  {hasRating && " • "}
                  {hasRating && <Text style={styles.reviewCount}>({userInfo.reviewCount})</Text>}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setMenuVisible(menuVisible === index ? null : index)}
              style={styles.menuButton}
              hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
            >
              <Ionicons name="ellipsis-vertical" size={20} color={isDark ? "#fff" : "#000"} />
            </TouchableOpacity>

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

          <TouchableOpacity
            activeOpacity={0.95}
            onPress={() => navigation.navigate("ListingDetails", { listing: item })}
          >
            {/* Smart Status Badge: BOOKED for hotels with semi-transparent red background */}
            {item.rented && (
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>
                  {item.listingType === "hotels" ? "BOOKED" : "RENTED"}
                </Text>
              </View>
            )}

            {isBoosted && (
              <View style={styles.boostedBadge}>
                <Ionicons name="flame" size={16} color="#FF9500" />
                <Text style={styles.boostedBadgeText}>Boosted</Text>
              </View>
            )}

            {images.length > 0 ? (
              <View style={styles.imagesContainer}>
                <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
                  {images.map((imgUri, imgIndex) => (
                    <View key={imgIndex} style={styles.imageWrapper}>
                      <Image source={{ uri: imgUri }} style={styles.postImage} resizeMode="cover" />
                      {hasMultiple && imgIndex === 0 && (
                        <View style={styles.imageCountBadge}>
                          <Ionicons name="camera-outline" size={14} color="#fff" style={{ marginRight: 4 }} />
                          <Text style={styles.imageCountText}>{imageCount}</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </ScrollView>
              </View>
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
                {formatPricePerNight(item.guestPricePerNight || item.pricePerNight)}
              </Text>

              <View style={styles.locationRow}>
                <Ionicons 
                  name="location-outline" 
                  size={16} 
                  color={isDark ? "#aaa" : "#666"} 
                  style={styles.locationIcon} 
                />
                <Text 
                  style={[dynamicStyles.secondaryText, { flex: 1, flexWrap: "wrap" }]} 
                  numberOfLines={2}
                >
                  {safeString(item.location)}
                </Text>
              </View>

              <TouchableOpacity style={styles.reserveButton} onPress={() => handleReserve(item)}>
                <Ionicons name="calendar-outline" size={18} color="#888" />
                <Text style={styles.reserveText}>Reserve Now</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    );
  };

  const onScrollHandler = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: true,
      listener: (event) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        const currentlyAtTop = offsetY < 60;

        if (currentlyAtTop !== isAtTop) {
          setIsAtTop(currentlyAtTop);
          if (currentlyAtTop) setHasNewPosts(false);
        }
      },
    }
  );

  return (
    <View style={[styles.container, dynamicStyles.containerBg]}>
      <AnimatedFlatList
        ref={flatListRef}
        data={posts}
        keyExtractor={(item) => item.id || `hotel-${Math.random().toString(36).slice(2)}`}
        renderItem={renderPost}
        contentContainerStyle={{ paddingTop: 180, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        onScroll={onScrollHandler}
        scrollEventThrottle={16}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, dynamicStyles.textColor]}>
              {loading ? "Loading hotels..." : "No hotel or short-let listings yet."}
            </Text>
            <Text style={[styles.emptySubtext, dynamicStyles.secondaryText]}>
              {loading ? "Please wait..." : "Be the first to post one!"}
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

  timestamp: { fontSize: 12 },

  menuButton: { padding: 8, marginLeft: 8, borderRadius: 20 },

  imagesContainer: { position: "relative" },
  imageScroll: { width: SCREEN_WIDTH, height: 250 },
  imageWrapper: { width: SCREEN_WIDTH, height: 250 },
  postImage: { width: "100%", height: "100%" },

  imageCountBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.65)",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    zIndex: 10,
  },
  imageCountText: { color: "#fff", fontSize: 13, fontWeight: "600" },

  listingInfo: { padding: 10 },

  listingTitle: { fontSize: 18, fontWeight: "800", lineHeight: 24, marginBottom: 8 },

  price: { fontSize: 14, fontWeight: "500", letterSpacing: 0.2, marginBottom: 8 },

  locationRow: { 
    flexDirection: "row", 
    alignItems: "flex-start", 
    marginBottom: 12 
  },

  locationIcon: { 
    marginRight: 6,
    marginTop: 2,
  },

  reserveButton: {
    backgroundColor: "#e0e0e0",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 12,
  },

  reserveText: { color: "#000", fontWeight: "600", fontSize: 15, marginLeft: 8 },

  dropdownContainer: {
    position: "absolute",
    top: 44,
    right: 12,
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

  dropdownItem: { paddingVertical: 8, fontSize: 16 },

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
    marginTop: 6,
  },

  boostedBadgeText: {
    color: "#FF9500",
    fontWeight: "bold",
    fontSize: 13,
    marginLeft: 5,
  },

  // Semi-transparent lighter red badge (as requested)
  statusBadge: {
    backgroundColor: "rgba(255, 59, 48, 0.85)",   // Nice semi-transparent red
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 6,
    marginLeft: 10,
    marginTop: 6,
  },

  statusText: { 
    color: "#fff", 
    fontWeight: "bold", 
    fontSize: 12 
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