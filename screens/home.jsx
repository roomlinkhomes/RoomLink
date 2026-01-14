// screens/Home.jsx — FIXED: Replaced Intl with manual formatter (no polyfill needed)
import React, { useState, useEffect, useContext, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
  FlatList,
  Dimensions,
  Share,
  useColorScheme,
  Alert,
  Animated,
  PanResponder,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { ListingContext } from "../context/ListingContext";
import { UserContext } from "../context/UserContext";
import Filter from "../component/Filter";
import Billboard from "../component/Billboard";
import ListingHeader from "../component/ListingHeader";
import HotelFeed from "../component/HotelFeed";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useListingTab } from "../context/ListingTabContext";
// SVG badges
import BlueBadge from "../assets/icons/blue.svg";
import YellowBadge from "../assets/icons/yellow.svg";
import RedBadge from "../assets/icons/red.svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

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

// FIXED: Manual formatter (no Intl dependency - works on Hermes/Android)
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

export default function Home({ navigation }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const { listings = [], loading } = useContext(ListingContext) || {};
  const { user: currentUser } = useContext(UserContext) || {};
  const { activeTab, setActiveTab } = useListingTab();

  const [posts, setPosts] = useState([]);
  const [menuVisible, setMenuVisible] = useState(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [userInfoMap, setUserInfoMap] = useState({});
  const [showSkeleton, setShowSkeleton] = useState(true);

  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => setShowSkeleton(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (activeTab !== "hotels") {
      setPosts(listings.filter((l) => l.listingType !== "hotels"));
    }
  }, [listings, activeTab]);

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
    if (posts.length > 0 && activeTab !== "hotels") fetchUserInfo();
  }, [posts, activeTab]);

  useEffect(() => {
    global.scrollToTop = () => {};
    global.openFilter = () => setFilterVisible(true);
    global.applyCategory = (category) => {
      setActiveCategory(category || "All");
      if (!category || category === "All") {
        setPosts(listings.filter((l) => l.listingType !== "hotels"));
        return;
      }
      const search = category.toString().toLowerCase();
      const filtered = listings.filter((item) => {
        if (item.listingType === "hotels") return false;
        const title = (item.title || "").toLowerCase();
        const desc = (item.description || "").toLowerCase();
        const catName = (item.category?.name || item.category || "").toLowerCase();
        return title.includes(search) || desc.includes(search) || catName === search;
      });
      setPosts(filtered);
    };
    return () => {
      delete global.applyCategory;
      delete global.openFilter;
      delete global.scrollToTop;
    };
  }, [listings, activeTab]);

  const dynamicStyles = useMemo(
    () => ({
      containerBg: { backgroundColor: isDark ? "#1e1e1e" : "#fff" },
      cardBg: { backgroundColor: isDark ? "#2a2a2a" : "#fff" },
      cardBorder: { borderBottomColor: isDark ? "#444" : "#ddd" },
      textColor: { color: isDark ? "#fff" : "#000" },
      secondaryText: { color: isDark ? "#aaa" : "gray" },
      priceColor: { color: isDark ? "#00ff7f" : "green" },
      noImageBg: { backgroundColor: isDark ? "#3a3a3a" : "#eee" },
      dropdownBg: { backgroundColor: isDark ? "#333" : "#fff" },
      dropdownText: { color: isDark ? "#fff" : "#111" },
      skeletonBg: { backgroundColor: isDark ? "#333" : "#eee" },
    }),
    [isDark]
  );

  const getDefaultAvatar = (name) => (!name ? "U" : name.charAt(0).toUpperCase());

  const handleShare = async (item) => {
    try {
      await Share.share({
        message: `Check this listing: ${item.title}\nhttps://roomlink.homes/listing/${item.id || ""}`,
      });
    } catch (err) {}
    setMenuVisible(null);
  };

  const handleCopy = async (item) => {
    await Clipboard.setStringAsync(`https://roomlink.homes/listing/${item.id || ""}`);
    Alert.alert("Link copied!");
    setMenuVisible(null);
  };

  const SkeletonPost = () => (
    <View style={[styles.card, dynamicStyles.cardBg, dynamicStyles.cardBorder]}>
      <View style={styles.userRow}>
        <View style={[styles.avatar, dynamicStyles.skeletonBg]} />
        <View style={{ marginLeft: 10, flex: 1 }}>
          <View
            style={{
              width: 140,
              height: 16,
              backgroundColor: dynamicStyles.skeletonBg.backgroundColor,
              borderRadius: 8,
            }}
          />
          <View
            style={{
              width: 80,
              height: 12,
              backgroundColor: dynamicStyles.skeletonBg.backgroundColor,
              borderRadius: 6,
              marginTop: 6,
            }}
          />
        </View>
      </View>
      <View
        style={{
          width: SCREEN_WIDTH,
          height: 250,
          backgroundColor: dynamicStyles.skeletonBg.backgroundColor,
          borderRadius: 12,
        }}
      />
      <View style={{ padding: 10 }}>
        <View
          style={{
            height: 20,
            width: "80%",
            backgroundColor: dynamicStyles.skeletonBg.backgroundColor,
            borderRadius: 8,
            marginBottom: 8,
          }}
        />
        <View
          style={{
            height: 24,
            width: "60%",
            backgroundColor: dynamicStyles.skeletonBg.backgroundColor,
            borderRadius: 8,
            marginBottom: 8,
          }}
        />
        <View
          style={{
            height: 16,
            width: "40%",
            backgroundColor: dynamicStyles.skeletonBg.backgroundColor,
            borderRadius: 6,
          }}
        />
      </View>
    </View>
  );

  const renderPost = ({ item, index }) => {
    const isMyPost = item.userId === currentUser?.uid;
    const ownerId = item.userId || item.user?.id || item.user?._id || item.author;
    const userInfo = userInfoMap[ownerId] || {};
    const fullName = userInfo.name || "User";
    const avatarUri = userInfo.avatar || (isMyPost ? currentUser?.photoURL || currentUser?.avatar : null);
    const verificationType = userInfo.verificationType;

    const images = Array.isArray(item.images) && item.images.length > 0
      ? item.images
      : item.image
      ? [item.image]
      : [];

    const isBoosted = item.boostedUntil && new Date(item.boostedUntil) > new Date();

    const handlePressListing = () => {
      if (currentUser && currentUser.uid !== ownerId) {
        const viewRef = doc(db, "listings", item.id, "views", currentUser.uid);
        setDoc(viewRef, { timestamp: Date.now() }, { merge: true }).catch(() => {});
      }
      navigation.navigate("ListingDetails", { listing: item });
    };

    return (
      <TouchableWithoutFeedback onPress={() => menuVisible !== null && setMenuVisible(null)}>
        <View style={[styles.card, dynamicStyles.cardBg, dynamicStyles.cardBorder]}>
          <View style={styles.userRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                if (!ownerId) return Alert.alert("Error", "User profile not available");
                if (global.lastProfileTap && Date.now() - global.lastProfileTap < 500) return;
                global.lastProfileTap = Date.now();
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

          <TouchableOpacity activeOpacity={0.95} onPress={handlePressListing}>
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
                <Text style={{ color: isDark ? "#ccc" : "gray" }}>No Media</Text>
              </View>
            )}

            <View style={styles.listingInfo}>
              {item.rented && (
                <View style={styles.rentedBadge}>
                  <Text style={styles.rentedText}>RENTED</Text>
                </View>
              )}

              <Text style={[styles.listingTitle, dynamicStyles.textColor]}>{item.title}</Text>

              <Text style={[styles.price, dynamicStyles.priceColor]}>
                {formatPrice(item.priceMonthly, item.priceYearly)}
              </Text>

              {/* Location with icon */}
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={16} color={isDark ? "#aaa" : "#666"} style={styles.locationIcon} />
                <Text style={dynamicStyles.secondaryText} numberOfLines={1}>
                  {safeString(item.location)}
                </Text>
              </View>

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
                    <Text style={styles.chatText}>Message Lister</Text>
                  </View>
                </TouchableOpacity>

                {isMyPost && (
                  <TouchableOpacity
                    style={styles.boostButton}
                    onPress={() => navigation.navigate("BoostPost", { listing: item })}
                  >
                    <Ionicons name="trending-up-outline" size={18} color="#fff" />
                    <Text style={styles.boostText}>Boost</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={() => setMenuVisible(menuVisible === index ? null : index)}
                  style={styles.menuShield}
                >
                  <Ionicons name="ellipsis-vertical" size={18} color={isDark ? "#fff" : "#000"} />
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

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 180],
    outputRange: [0, -180],
    extrapolate: "clamp",
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: true }
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10;
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dx } = gestureState;
        const threshold = SCREEN_WIDTH * 0.2;
        if (Math.abs(dx) > threshold) {
          if (dx < 0) {
            setActiveTab("hotels");
          } else {
            setActiveTab("houses");
          }
        }
      },
    })
  ).current;

  return (
    <View style={[styles.container, dynamicStyles.containerBg]} {...panResponder.panHandlers}>
      <Animated.View
        style={[
          styles.stickyHeader,
          {
            transform: [{ translateY: headerTranslateY }],
            opacity: headerOpacity,
          },
        ]}
      >
        <ListingHeader />
        <View style={styles.billboardWrapper}>
          <Billboard />
        </View>
      </Animated.View>

      {activeTab === "hotels" ? (
        <HotelFeed navigation={navigation} scrollY={scrollY} onScroll={onScroll} />
      ) : showSkeleton ? (
        <AnimatedFlatList
          data={Array(6).fill({})}
          keyExtractor={(_, i) => `skeleton-${i}`}
          renderItem={() => <SkeletonPost />}
          contentContainerStyle={{ paddingTop: 180, paddingBottom: 40 }}
          onScroll={onScroll}
          scrollEventThrottle={16}
        />
      ) : (
        <AnimatedFlatList
          data={posts}
          keyExtractor={(item, index) => `${item.id || "unknown"}-${index}`}
          renderItem={renderPost}
          refreshing={loading}
          onRefresh={() => setPosts(listings.filter((l) => l.listingType !== "hotels"))}
          contentContainerStyle={{ paddingTop: 180, paddingBottom: 40 }}
          onScroll={onScroll}
          scrollEventThrottle={16}
        />
      )}

      <Filter
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onSelect={(category) => {
          global.applyCategory(category);
          setFilterVisible(false);
        }}
        theme={isDark ? "dark" : "light"}
        activeCategory={activeCategory}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  stickyHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: "#fff",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  billboardWrapper: { marginHorizontal: 16, marginVertical: 10 },
  card: { marginBottom: 15, borderBottomWidth: 3, paddingBottom: 10, borderRadius: 12 },
  userRow: { flexDirection: "row", alignItems: "center", padding: 10, marginBottom: 6 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  defaultAvatar: { backgroundColor: "#017a6b", justifyContent: "center", alignItems: "center" },
  defaultAvatarText: { color: "#fff", fontWeight: "bold", fontSize: 18 },
  userName: { fontWeight: "700", fontSize: 15 },
  listingInfo: { padding: 10 },
  listingTitle: { fontSize: 18, fontWeight: "800", lineHeight: 24, marginBottom: 8 },
  price: { fontSize: 20, fontWeight: "900", letterSpacing: 0.5, marginBottom: 4 },
  postImage: { width: SCREEN_WIDTH, height: 250 },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  chatButton: {
    flex: 1,
    backgroundColor: "rgba(1,122,107,0.2)",
    borderColor: "#888",
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    marginRight: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  chatText: { color: "#017a6b", marginLeft: 6, fontWeight: "bold", fontSize: 14 },
  boostButton: {
    backgroundColor: "#FF9500",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 10,
  },
  boostText: { color: "#fff", marginLeft: 6, fontWeight: "bold", fontSize: 14 },
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