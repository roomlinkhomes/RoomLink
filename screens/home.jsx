// screens/Home.jsx
import React, { useState, useEffect, useRef, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  ScrollView,
  Dimensions,
  Share,
  useColorScheme,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { ListingContext } from "../context/ListingContext";
import { UserContext } from "../context/UserContext";
import Svg, { Rect, Text as SvgText } from "react-native-svg";
import Filter from "../component/Filter";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const MoneyIcon = ({ size = 22, color = "green" }) => (
  <Svg
    width={size}
    height={size * 0.7}
    viewBox="0 0 24 16"
    fill="none"
    stroke={color}
    strokeWidth="1.5"
  >
    <Rect x="1" y="2" width="22" height="12" rx="2" ry="2" stroke={color} />
    <SvgText
      x="12"
      y="12"
      textAnchor="middle"
      fontSize="10"
      fontWeight="bold"
      fill={color}
    >
      ₦
    </SvgText>
  </Svg>
);

// Helper function to format "time ago"
const timeAgo = (date) => {
  const now = new Date();
  const past = new Date(date);
  const diff = (now - past) / 1000; // seconds

  if (diff < 60) return `${Math.floor(diff)} sec${Math.floor(diff) !== 1 ? "s" : ""} ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min${Math.floor(diff / 60) !== 1 ? "s" : ""} ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hour${Math.floor(diff / 3600) !== 1 ? "s" : ""} ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) !== 1 ? "s" : ""} ago`;
  if (diff < 2592000) return `${Math.floor(diff / 604800)} week${Math.floor(diff / 604800) !== 1 ? "s" : ""} ago`;
  return `${Math.floor(diff / 2592000)} month${Math.floor(diff / 2592000) !== 1 ? "s" : ""} ago`;
};

export default function Home({ navigation }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const { listings, loading } = useContext(ListingContext);
  const { currentUser } = useContext(UserContext);
  const [posts, setPosts] = useState([]);
  const [menuVisible, setMenuVisible] = useState(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const listRef = useRef(null);

  useEffect(() => {
    setPosts(listings);
  }, [listings]);

  useEffect(() => {
    global.scrollToTop = () => {
      if (listRef.current) listRef.current.scrollToOffset({ offset: 0, animated: true });
    };
    global.openFilter = () => setFilterVisible(true);

    global.applyCategory = (category) => {
      setActiveCategory(category);
      if (category === "All") setPosts(listings);
      else {
        const filtered = listings.filter((item) => {
          const title = item.title?.toLowerCase() || "";
          const desc = item.description?.toLowerCase() || "";
          const cat = item.category?.name?.toLowerCase() || "";
          return (
            title.includes(category.toLowerCase()) ||
            desc.includes(category.toLowerCase()) ||
            cat === category.toLowerCase()
          );
        });
        setPosts(filtered);
      }
    };
  }, [listings]);

  const getDefaultAvatar = (name) => (!name ? "U" : name.charAt(0).toUpperCase());

  // ✅ Share with deep link
  const handleShare = async (item) => {
    try {
      const url = `https://roomlink.homes/listing/${item.id || ""}`;
      await Share.share({
        message: `Check out this listing: ${item.title} - ₦${item.price}\n\n${url}`,
      });
    } catch (err) {
      console.error("Share failed:", err);
    }
    setMenuVisible(null);
  };

  // ✅ Copy deep link
  const handleCopy = async (item) => {
    await Clipboard.setStringAsync(`https://roomlink.homes/listing/${item.id || ""}`);
    alert("Link copied to clipboard!");
    setMenuVisible(null);
  };

  const handleMenuToggle = (index) => {
    setMenuVisible((prev) => (prev === index ? null : index));
  };

  const applyFilter = (value) => {
    let filtered = [...listings];
    switch (value) {
      case "newest":
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case "mostContacted":
        filtered.sort((a, b) => (b.contacts || 0) - (a.contacts || 0));
        break;
      case "location":
        filtered.sort((a, b) => (a.location || "").localeCompare(b.location || ""));
        break;
      default:
        break;
    }
    setPosts(filtered);
    setFilterVisible(false);
  };

  const renderPost = ({ item, index }) => {
    const avatarUri = item.userAvatar || null;
    const userName = item.userName || "Unknown";
    const userHandle = item.userHandle || "";
    const images =
      Array.isArray(item.images) && item.images.length > 0
        ? item.images
        : item.image
        ? [item.image]
        : [];

    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark ? "#2a2a2a" : "white",
            borderBottomColor: isDark ? "#444" : "#d3d3d3",
          },
        ]}
      >
        {/* 👤 User info */}
        <View style={styles.userRow}>
          <TouchableOpacity
            style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
            onPress={() => navigation.navigate("UserProfile", { userId: item.userId })}
          >
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.defaultAvatar]}>
                <Text style={styles.defaultAvatarText}>{getDefaultAvatar(userName)}</Text>
              </View>
            )}
            <View style={{ marginLeft: 10 }}>
              <Text style={[styles.userName, { color: isDark ? "#fff" : "#111" }]}>{userName}</Text>
              <Text style={[styles.userHandle, { color: isDark ? "#ccc" : "gray" }]}>{userHandle}</Text>
              <Text style={{ color: isDark ? "#aaa" : "gray", fontSize: 12 }}>
                {timeAgo(item.createdAt)}
              </Text>
            </View>
          </TouchableOpacity>

          {/* ⋮ Menu button */}
          <TouchableOpacity onPress={() => handleMenuToggle(index)}>
            <Ionicons name="ellipsis-vertical" size={20} color={isDark ? "#fff" : "black"} />
          </TouchableOpacity>
        </View>

        {/* Dropdown menu */}
        {menuVisible === index && (
          <View style={[styles.dropdown, { backgroundColor: isDark ? "#1e1e1e" : "white" }]}>
            <TouchableOpacity onPress={() => handleShare(item)}>
              <Text style={[styles.dropdownItem, { color: isDark ? "#fff" : "black" }]}>
                Share
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleCopy(item)}>
              <Text style={[styles.dropdownItem, { color: isDark ? "#fff" : "black" }]}>
                Copy Link
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Listing images */}
        {images.length > 0 ? (
          <View>
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
              {images.map((img, imgIndex) => (
                <TouchableOpacity
                  key={imgIndex}
                  onPress={() => navigation.navigate("ListingDetails", { listing: item })}
                >
                  <Image source={{ uri: img }} style={styles.postImage} />
                </TouchableOpacity>
              ))}
            </ScrollView>
            {images.length > 1 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{images.length}+</Text>
              </View>
            )}
          </View>
        ) : (
          <View
            style={[
              styles.postImage,
              {
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: isDark ? "#3a3a3a" : "#eee",
              },
            ]}
          >
            <Text style={{ color: isDark ? "#ccc" : "gray" }}>No Image Available</Text>
          </View>
        )}

        {/* Listing info */}
        <View style={styles.listingInfo}>
          {/* ✅ RENTED BADGE */}
          {item.rented && (
            <View style={styles.rentedBadge}>
              <Text style={styles.rentedText}>RENTED</Text>
            </View>
          )}

          <Text style={[styles.listingTitle, { color: isDark ? "#fff" : "#111" }]}>
            {item.title}
          </Text>
          <Text style={[styles.price, { color: isDark ? "#00ff7f" : "green" }]}>
            ₦{item.price}
          </Text>
          <Text style={[styles.location, { color: isDark ? "#ccc" : "gray" }]}>
            {item.location}
          </Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.chatButton, { backgroundColor: "#017a6b" }]}
              onPress={() =>
                navigation.navigate("Messages", {
                  screen: "Message",
                  params: {
                    listingId: item.id,
                    listingOwnerId: item.userId,
                    tenantId: currentUser?._id || "",
                    listingTitle: item.title,
                  },
                })
              }
            >
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="chatbubble-ellipses" size={16} color="white" />
                <Text style={[styles.chatText, { marginLeft: 6 }]}>Message Lister</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.helpButton, { backgroundColor: isDark ? "#264f4f" : "#eaf6f6" }]}
              onPress={() => navigation.navigate("RentHelp", { listingId: item.id })}
            >
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
                <MoneyIcon size={20} color={isDark ? "#00ff7f" : "green"} />
                <Text
                  style={[
                    styles.helpText,
                    { marginLeft: 6, color: isDark ? "#00ff7f" : "#017a6b" },
                  ]}
                >
                  Need Help Paying Rent?
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? "#1e1e1e" : "white" }]}>
      {posts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={{ color: isDark ? "#ccc" : "gray" }}>
            No listings yet. Post something to see it here.
          </Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={posts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderPost}
          refreshing={loading}
          onRefresh={() => setPosts(listings)}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      <Filter
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onSelect={applyFilter}
        theme={isDark ? "dark" : "light"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: { marginBottom: 15, borderBottomWidth: 3, paddingBottom: 10, borderRadius: 12 },
  userRow: { flexDirection: "row", alignItems: "center", padding: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  defaultAvatar: { backgroundColor: "#036dd6", justifyContent: "center", alignItems: "center" },
  defaultAvatarText: { color: "white", fontWeight: "bold", fontSize: 18 },
  userName: { fontWeight: "bold", flexWrap: "wrap" },
  userHandle: { fontSize: 12, flexWrap: "wrap" },
  postImage: { width: SCREEN_WIDTH, height: 250 },
  badge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: { color: "white", fontSize: 12, fontWeight: "bold" },
  listingInfo: { padding: 10 },
  listingTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 2 },
  price: { fontSize: 16, marginBottom: 2 },
  location: { marginBottom: 2 },
  timestamp: { marginBottom: 6 },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginTop: 6,
  },
  chatButton: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 50,
    marginRight: 10,
    alignItems: "center",
  },
  chatText: { color: "white", fontWeight: "bold" },
  helpButton: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 50,
    alignItems: "center",
  },
  helpText: { fontWeight: "bold" },
  dropdown: {
    position: "absolute",
    top: 50,
    right: 15,
    borderRadius: 6,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    padding: 8,
    zIndex: 999,
  },
  dropdownItem: { paddingVertical: 6, paddingHorizontal: 12, fontSize: 14 },
  rentedBadge: {
    backgroundColor: "red",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 6,
  },
  rentedText: { color: "#fff", fontWeight: "bold", fontSize: 12 },
});
