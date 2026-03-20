// screens/Home.jsx — FIXED: image count badge → top-left + camera icon + count
import React, { useState, useEffect, useContext, useMemo, useRef, useCallback } from "react";
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
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { ListingContext } from "../context/ListingContext";
import { AuthContext } from "../context/AuthContext";
import Filter from "../component/Filter";
import Billboard from "../component/Billboard";
import ListingHeader from "../component/ListingHeader";
import HotelFeed from "../component/HotelFeed";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useListingTab } from "../context/ListingTabContext";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

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
  const { listings = [], loading: contextLoading } = useContext(ListingContext) || {};
  const { user: authUser } = useContext(AuthContext);
  const { activeTab, setActiveTab } = useListingTab();
  const insets = useSafeAreaInsets();

  const [posts, setPosts] = useState([]);
  const [menuVisible, setMenuVisible] = useState(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [userInfoMap, setUserInfoMap] = useState({});
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log('[HOME DEBUG] Auth user:', authUser ? authUser.uid : 'NO USER');
  }, [authUser]);

  useEffect(() => {
    console.log('[HOME] Triggering post update → user:', authUser?.uid || 'none');

    if (!authUser?.uid || contextLoading) {
      console.log('[HOME] No user or loading → clearing posts');
      setPosts([]);
      return;
    }

    let filtered = listings.filter((l) => l.listingType !== "hotels");

    if (activeTab === "hotels") {
      filtered = [];
      console.log('[HOME] Active tab is hotels → cleared posts');
    }

    if (activeCategory !== "All") {
      const search = activeCategory.toString().toLowerCase();
      filtered = filtered.filter((item) => {
        const title = (item.title || "").toLowerCase();
        const desc = (item.description || "").toLowerCase();
        const catName = (item.category?.name || item.category || "").toLowerCase();
        return title.includes(search) || desc.includes(search) || catName === search;
      });
      console.log('[HOME] Applied category filter:', activeCategory, '→', filtered.length, 'posts');
    }

    console.log('[HOME] Final filtered posts count:', filtered.length);
    setPosts(filtered);
  }, [listings, authUser?.uid, activeTab, activeCategory, contextLoading]);

  useEffect(() => {
    const fetchMissingUserInfo = async () => {
      const uniqueUserIds = [...new Set(posts.map((p) => p.userId).filter(Boolean))];
      const missingIds = uniqueUserIds.filter((uid) => !userInfoMap[uid]);

      if (missingIds.length === 0) return;

      const newInfo = { ...userInfoMap };

      await Promise.all(
        missingIds.map(async (uid) => {
          try {
            const userDoc = await getDoc(doc(db, "users", uid));
            if (userDoc.exists()) {
              const data = userDoc.data();
              newInfo[uid] = {
                name: getFullName(data),
                avatar: data.avatar || data.photoURL || data.profileImage || null,
                verificationType: data.verificationType || null,
                averageRating: data.averageRating || 0,
                reviewCount: data.reviewCount || 0,
              };
            } else {
              newInfo[uid] = { name: "User", avatar: null, verificationType: null, averageRating: 0, reviewCount: 0 };
            }
          } catch (err) {
            console.warn(`Failed to fetch user ${uid}:`, err);
            newInfo[uid] = { name: "User", avatar: null, verificationType: null, averageRating: 0, reviewCount: 0 };
          }
        })
      );

      setUserInfoMap((prev) => ({ ...prev, ...newInfo }));
    };

    if (posts.length > 0) {
      fetchMissingUserInfo();
    }
  }, [posts]);

  useEffect(() => {
    const timer = setTimeout(() => setShowSkeleton(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    global.scrollToTop = () => {};
    global.openFilter = () => setFilterVisible(true);
    global.applyCategory = (category) => {
      setActiveCategory(category || "All");
      let filtered = listings.filter((l) => l.listingType !== "hotels");
      if (category && category !== "All") {
        const search = category.toString().toLowerCase();
        filtered = filtered.filter((item) => {
          const title = (item.title || "").toLowerCase();
          const desc = (item.description || "").toLowerCase();
          const catName = (item.category?.name || item.category || "").toLowerCase();
          return title.includes(search) || desc.includes(search) || catName === search;
        });
      }
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
      priceColor: { color: isDark ? "#aaa" : "#888" },
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
          <View style={{ width: 140, height: 16, backgroundColor: dynamicStyles.skeletonBg.backgroundColor, borderRadius: 8 }} />
          <View style={{ width: 80, height: 12, backgroundColor: dynamicStyles.skeletonBg.backgroundColor, borderRadius: 6, marginTop: 6 }} />
        </View>
      </View>
      <View style={{ width: SCREEN_WIDTH, height: 250, backgroundColor: dynamicStyles.skeletonBg.backgroundColor, borderRadius: 12 }} />
      <View style={{ padding: 10 }}>
        <View style={{ height: 20, width: "80%", backgroundColor: dynamicStyles.skeletonBg.backgroundColor, borderRadius: 8, marginBottom: 8 }} />
        <View style={{ height: 24, width: "60%", backgroundColor: dynamicStyles.skeletonBg.backgroundColor, borderRadius: 8, marginBottom: 8 }} />
        <View style={{ height: 16, width: "40%", backgroundColor: dynamicStyles.skeletonBg.backgroundColor, borderRadius: 6 }} />
      </View>
    </View>
  );

  const renderPost = ({ item, index }) => {
    const isMyPost = item.userId === authUser?.uid;
    const ownerId = item.userId || item.user?.id || item.user?._id || item.author;
    const userInfo = userInfoMap[ownerId] || {};

    let avatarUri = item.userAvatar;
    if (!avatarUri) {
      avatarUri = userInfo.avatar || (isMyPost ? authUser?.avatar || authUser?.photoURL : null);
    }
    if (avatarUri) avatarUri = `${avatarUri}?v=${Date.now()}`;

    const fullName = userInfo.name || getFullName(authUser) || "User";
    const verificationType = userInfo.verificationType;

    const images = Array.isArray(item.images) && item.images.length > 0
      ? item.images
      : item.image ? [item.image] : [];
    const hasMultiple = images.length > 1;
    const imageCount = images.length;

    const isBoosted = item.boostedUntil && new Date(item.boostedUntil) > new Date();
    const hasRating = userInfo.averageRating > 0 || userInfo.reviewCount > 0;

    const handlePressListing = () => {
      if (authUser && authUser.uid !== ownerId) {
        const viewRef = doc(db, "listings", item.id, "views", authUser.uid);
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
                <Image source={{ uri: avatarUri }} style={styles.avatar} resizeMode="cover" defaultSource={require('../assets/default-avatar.png')} />
              ) : userInfoMap[ownerId] ? (
                <View style={[styles.avatar, styles.defaultAvatar]}>
                  <Text style={styles.defaultAvatarText}>{getDefaultAvatar(fullName)}</Text>
                </View>
              ) : (
                <View style={[styles.avatar, dynamicStyles.skeletonBg]} />
              )}
            </TouchableOpacity>

            <View style={styles.nameContainer}>
              <View style={styles.nameRow}>
                <Text style={[styles.userName, dynamicStyles.textColor]}>{fullName}</Text>
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
                        color={s <= (userInfo.averageRating || 0) ? "#017a6b" : "#888"}
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

          <TouchableOpacity activeOpacity={0.95} onPress={handlePressListing}>
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

                      {/* ← CHANGED: camera + count badge on first image, top-left, only if 2+ images */}
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
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={16} color={isDark ? "#aaa" : "#666"} style={styles.locationIcon} />
                <Text style={dynamicStyles.secondaryText} numberOfLines={1}>
                  {safeString(item.location)}
                </Text>
              </View>

              <View style={styles.ctaContainer}>
                <TouchableOpacity
                  style={styles.messageHostButton}
                  onPress={() => {
                    if (!ownerId) return Alert.alert("Error", "Cannot message: User not found");
                    navigation.navigate("Messages", {
                      screen: "Message",
                      params: {
                        listingId: item.id,
                        listingOwnerId: ownerId,
                        tenantId: authUser?.uid || "",
                        listingTitle: item.title,
                      },
                    });
                  }}
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={18} color="#888" />
                  <Text style={styles.messageHostText}>Message Host</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.scheduleVisitButton}
                  onPress={() => {
                    navigation.navigate("EventScheduler", {
                      listingId: item.id,
                      listingTitle: item.title,
                      ownerId,
                    });
                  }}
                >
                  <Ionicons name="calendar-outline" size={18} color="#888" />
                  <Text style={styles.scheduleVisitText}>Schedule Visit</Text>
                </TouchableOpacity>
              </View>
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
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 10,
      onPanResponderRelease: (_, gestureState) => {
        const { dx } = gestureState;
        const threshold = SCREEN_WIDTH * 0.2;
        if (Math.abs(dx) > threshold) {
          if (dx < 0) setActiveTab("hotels");
          else setActiveTab("houses");
        }
      },
    })
  ).current;

  const onRefresh = () => {
    setRefreshing(true);
    if (activeTab !== "hotels") {
      const filtered = listings.filter((l) => l.listingType !== "hotels");
      setPosts(filtered);
    }
    setTimeout(() => setRefreshing(false), 1200);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? "#1e1e1e" : "#fff" }]}
      edges={['left', 'right', 'bottom']}
      {...panResponder.panHandlers}
    >
      {contextLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#017a6b" />
          <Text style={{ marginTop: 16, fontSize: 16, color: isDark ? '#ccc' : '#555' }}>
            Loading your feed...
          </Text>
        </View>
      ) : listings.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 }}>
          <Ionicons name="cloud-offline-outline" size={60} color={isDark ? '#666' : '#999'} />
          <Text style={{ fontSize: 18, fontWeight: '600', color: isDark ? '#fff' : '#333', marginTop: 16, textAlign: 'center' }}>
            No listings available yet
          </Text>
          <Text style={{ marginTop: 8, color: isDark ? '#aaa' : '#666', textAlign: 'center' }}>
            Pull down to refresh or check back later
          </Text>
        </View>
      ) : (
        <>
          <Animated.View
            style={[
              styles.stickyHeader,
              { transform: [{ translateY: headerTranslateY }], opacity: headerOpacity, paddingTop: insets.top },
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
              contentContainerStyle={{ paddingTop: insets.top + 180, paddingBottom: insets.bottom + 40 }}
              onScroll={onScroll}
              scrollEventThrottle={16}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={["#017a6b"]}
                  tintColor="#017a6b"
                  title="Pull to refresh"
                  titleColor={isDark ? "#aaa" : "#555"}
                />
              }
            />
          ) : (
            <AnimatedFlatList
              data={posts}
              keyExtractor={(item, index) => `${item.id || "unknown"}-${index}`}
              renderItem={renderPost}
              refreshing={refreshing}
              onRefresh={onRefresh}
              contentContainerStyle={{ paddingTop: insets.top + 180, paddingBottom: insets.bottom + 40 }}
              onScroll={onScroll}
              scrollEventThrottle={16}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={["#017a6b"]}
                  tintColor="#017a6b"
                  title="Pull to refresh"
                  titleColor={isDark ? "#aaa" : "#555"}
                />
              }
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
        </>
      )}
    </SafeAreaView>
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

  nameContainer: {
    marginLeft: 12,
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  userName: {
    fontWeight: "700",
    fontSize: 15.5,
  },
  secondaryRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 2,
    gap: 8,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 11.5,
    fontWeight: "600",
    color: "#333",
  },
  reviewCount: {
    fontSize: 10,
    color: "#777",
    fontWeight: "400",
  },
  timestamp: {
    fontSize: 12,
  },

  menuButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 20,
  },

  listingInfo: { padding: 10 },
  listingTitle: { fontSize: 18, fontWeight: "800", lineHeight: 24, marginBottom: 8 },
  price: { fontSize: 14, fontWeight: "500", letterSpacing: 0.2, marginBottom: 4 },

  imagesContainer: { position: "relative" },
  imageScroll: { width: SCREEN_WIDTH, height: 250 },
  imageWrapper: { width: SCREEN_WIDTH, height: 250 },
  postImage: { width: "100%", height: "100%" },

  // ← CHANGED: position top-left, smaller padding, camera icon added
  imageCountBadge: {
    position: "absolute",
    top: 12,
    left: 12,              // ← moved from right to left
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.65)",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    zIndex: 10,
  },
  imageCountText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  locationIcon: { marginRight: 6 },

  ctaContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    gap: 12,
  },

  messageHostButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e0e0e0",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },

  messageHostText: {
    color: "#000",
    fontWeight: "600",
    fontSize: 15,
  },

  scheduleVisitButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#888",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
    backgroundColor: "transparent",
  },

  scheduleVisitText: {
    color: "#000",
    fontWeight: "600",
    fontSize: 15,
  },

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
  dropdownItem: {
    paddingVertical: 8,
    fontSize: 16,
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