// screens/Favorite.jsx
import React, { useEffect, useState, useContext, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ListingContext } from "../context/ListingContext"; // your backend/context
import Svg, { Rect, Text as SvgText } from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// 💵 Naira Note Icon (reuse from Home.jsx)
const MoneyIcon = ({ size = 22 }) => (
  <Svg
    width={size}
    height={size * 0.7}
    viewBox="0 0 24 16"
    fill="none"
    stroke="green"
    strokeWidth="1.5"
  >
    <Rect x="1" y="2" width="22" height="12" rx="2" ry="2" stroke="green" />
    <SvgText
      x="12"
      y="12"
      textAnchor="middle"
      fontSize="10"
      fontWeight="bold"
      fill="green"
    >
      ₦
    </SvgText>
  </Svg>
);

export default function Favorite({ navigation }) {
  const { listings, loading } = useContext(ListingContext); // assume you store favorites in backend
  const [favorites, setFavorites] = useState([]);
  const listRef = useRef(null);

  useEffect(() => {
    // Filter only favorited posts
    const favPosts = listings.filter((item) => item.isFavorite); // backend should provide this flag
    setFavorites(favPosts);
  }, [listings]);

  const getDefaultAvatar = (name) =>
    !name ? "U" : name.charAt(0).toUpperCase();

  const renderFavorite = ({ item }) => {
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
      <View style={styles.card}>
        {/* 👤 User info */}
        <View style={styles.userRow}>
          <TouchableOpacity
            style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
            onPress={() =>
              navigation.navigate("UserProfile", { userId: item.userId })
            }
          >
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.defaultAvatar]}>
                <Text style={styles.defaultAvatarText}>
                  {getDefaultAvatar(userName)}
                </Text>
              </View>
            )}
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.userName}>{userName}</Text>
              <Text style={styles.userHandle}>{userHandle}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 🖼 Listing images */}
        {images.length > 0 ? (
          <View>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
            >
              {images.map((img, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() =>
                    navigation.navigate("ListingDetails", { listing: item })
                  }
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
              { justifyContent: "center", alignItems: "center", backgroundColor: "#eee" },
            ]}
          >
            <Text style={{ color: "gray" }}>No Image Available</Text>
          </View>
        )}

        {/* Listing info */}
        <View style={styles.listingInfo}>
          <Text style={styles.listingTitle}>{item.title}</Text>
          <Text style={styles.price}>₦{item.price}</Text>
          <Text style={styles.location}>{item.location}</Text>

          <TouchableOpacity
            style={styles.chatButton}
            onPress={() =>
              navigation.navigate("Chat", { landlordId: item.userId })
            }
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="chatbubble-ellipses" size={16} color="white" />
              <Text style={[styles.chatText, { marginLeft: 6 }]}>Message lister</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.helpButton}
            onPress={() =>
              navigation.navigate("RentHelp", { listingId: item.id })
            }
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
              <MoneyIcon size={20} />
              <Text style={[styles.helpText, { marginLeft: 6 }]}>Need Help Paying Rent?</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#036dd6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {favorites.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={{ color: "gray" }}>You have no favorite listings yet.</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={favorites}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderFavorite}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: { backgroundColor: "white", marginBottom: 15, borderBottomWidth: 3, borderBottomColor: "#d3d3d3", paddingBottom: 10 },
  userRow: { flexDirection: "row", alignItems: "center", padding: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  defaultAvatar: { backgroundColor: "#036dd6", justifyContent: "center", alignItems: "center" },
  defaultAvatarText: { color: "white", fontWeight: "bold", fontSize: 18 },
  userName: { fontWeight: "bold", flexWrap: "wrap" },
  userHandle: { color: "gray", fontSize: 12, flexWrap: "wrap" },
  postImage: { width: SCREEN_WIDTH, height: 250 },
  badge: { position: "absolute", top: 10, right: 10, backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 12 },
  badgeText: { color: "white", fontSize: 12, fontWeight: "bold" },
  listingInfo: { padding: 10 },
  listingTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 2 },
  price: { fontSize: 16, color: "green", marginBottom: 2 },
  location: { color: "gray", marginBottom: 10 },
  chatButton: { flexDirection: "row", justifyContent: "center", backgroundColor: "#017a6b", padding: 6, borderRadius: 6, marginBottom: 6, alignItems: "center" },
  chatText: { color: "white", fontWeight: "bold" },
  helpButton: { backgroundColor: "#eaf6f6", padding: 6, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  helpText: { color: "#017a6b", fontWeight: "bold" },
});
