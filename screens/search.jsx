// screens/Search.jsx — Persistent Search History with Thumbnails
import React, { useState, useContext, useEffect, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  useColorScheme,
  Alert,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ListingContext } from "../context/ListingContext";
import { useRoute } from "@react-navigation/native";
import { AuthContext } from "../context/AuthContext";

import SearchHeader from "../component/SearchHeader";
import Ionicons from "react-native-vector-icons/Ionicons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SEARCH_HISTORY_KEY = '@app_search_history';

export default function SearchScreen({ navigation }) {
  const { listings: contextListings } = useContext(ListingContext);
  const { user: authUser } = useContext(AuthContext);
  const route = useRoute();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const searchQuery = route.params?.query || "";

  const [searchHistory, setSearchHistory] = useState([]);

  const listings = route.params?.listings ?? contextListings ?? [];

  const uniqueListings = useMemo(() => {
    const seen = new Map();
    return listings.filter((item) => {
      if (!item?.id) return false;
      if (seen.has(item.id)) return false;
      seen.set(item.id, true);
      return true;
    });
  }, [listings]);

  const filteredPosts = useMemo(() => {
    if (!searchQuery?.trim()) return [];

    const lowerText = searchQuery.toLowerCase().trim();

    return uniqueListings.filter((item) =>
      item.title?.toLowerCase().includes(lowerText) ||
      item.location?.toLowerCase().includes(lowerText) ||
      String(item.price || "").includes(lowerText) ||
      item.userName?.toLowerCase().includes(lowerText)
    );
  }, [searchQuery, uniqueListings]);

  // Load history from AsyncStorage when screen mounts
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const savedHistory = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
        if (savedHistory) {
          setSearchHistory(JSON.parse(savedHistory));
        }
      } catch (error) {
        console.log("Failed to load search history", error);
      }
    };

    loadHistory();
  }, []);

  // Save history to AsyncStorage whenever it changes
  useEffect(() => {
    const saveHistory = async () => {
      try {
        await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(searchHistory));
      } catch (error) {
        console.log("Failed to save search history", error);
      }
    };

    if (searchHistory.length > 0) {
      saveHistory();
    }
  }, [searchHistory]);

  // Save new search with thumbnail
  useEffect(() => {
    if (!searchQuery?.trim()) return;

    const term = searchQuery.toLowerCase().trim();
    const firstResult = filteredPosts[0];
    const thumbnail = firstResult 
      ? (firstResult.images?.[0] || firstResult.image) 
      : null;

    setSearchHistory((prev) => {
      const filtered = prev.filter((h) => h.term !== term);
      const newEntry = { term, image: thumbnail };
      return [newEntry, ...filtered].slice(0, 8);
    });
  }, [searchQuery, filteredPosts]);

  const clearSearchHistory = () => {
    Alert.alert("Clear Recent Searches", "Are you sure you want to clear all history?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Clear", 
        style: "destructive", 
        onPress: async () => {
          setSearchHistory([]);
          try {
            await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
          } catch (e) {
            console.log("Failed to clear storage", e);
          }
        } 
      },
    ]);
  };

  const selectFromHistory = (historyItem) => {
    navigation.setParams({ query: historyItem.term });
  };

  // ==================== Your Original Functions (Untouched) ====================
  const openChat = (item) => {
    if (!authUser?.uid) {
      Alert.alert("Error", "You must be logged in to message the host");
      return;
    }

    const ownerId = item.userId || item.user?.id || item.user?._id || item.author;

    if (!ownerId) {
      Alert.alert("Error", "Cannot message: Host information not found");
      return;
    }

    const serializableListing = {
      id: item.id,
      title: item.title || "Property Listing",
      images: Array.isArray(item.images) && item.images.length > 0
        ? item.images
        : item.image ? [item.image] : [],
      priceMonthly: item.priceMonthly,
      priceYearly: item.priceYearly,
      location: item.location || "Location not specified",
      description: item.description || "",
      category: item.category?.name || item.category || null,
      rented: item.rented || false,
      userId: ownerId,
      createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : null,
    };

    const fullName = item.userName || item.ownerName || "Host";

    navigation.navigate("HomeTabs", {
      screen: "Messages",
      params: {
        screen: "Message",
        params: {
          listingId: item.id,
          listingOwnerId: ownerId,
          tenantId: authUser?.uid || "",
          listingTitle: item.title || "Listing",
          listing: serializableListing,
          ownerInfo: {
            uid: ownerId,
            name: fullName,
            avatar: item.userAvatar || item.avatar || null,
            isVerified: item.isVerified || false,
            verificationType: item.verificationType || null,
          }
        },
      },
    });
  };

  const goToBooking = (item) => {
    navigation.navigate("HotelBookingScreen", { listing: item });
  };

  const renderPost = ({ item }) => {
    const listingType = (item.listingType || "").toString().toLowerCase();
    const stayType = (item.stayType || "").toString().toLowerCase();
    const category = (item.category || "").toString().toLowerCase();

    const isLongStay = 
      listingType === "houses" || 
      stayType === "long-stay" ||
      category === "houses" ||
      item.isLongStay === true;

    const isShortStay = !isLongStay;

    return (
      <TouchableOpacity
        style={[styles.card, { borderBottomColor: isDarkMode ? "#333" : "#ccc" }]}
        onPress={() => navigation.navigate("ListingDetails", { listing: item })}
      >
        <Image
          source={{ uri: item.images?.[0] || item.image }}
          style={styles.postImage}
        />

        <View style={styles.listingInfo}>
          <Text style={[styles.listingTitle, { color: isDarkMode ? "#fff" : "#000" }]}>
            {item.title || "Untitled Listing"}
          </Text>
          <Text style={[styles.price, { color: isDarkMode ? "#81C784" : "#2e8b57" }]}>
            ₦{Number(item.price || 0).toLocaleString()}
          </Text>
          <Text style={[styles.location, { color: isDarkMode ? "#ccc" : "#666" }]}>
            {item.location || "Location not specified"}
          </Text>

          <View style={styles.buttonRow}>
            {isLongStay && (
              <TouchableOpacity
                style={styles.messageButton}
                onPress={(e) => {
                  e.stopPropagation();
                  openChat(item);
                }}
              >
                <Text style={styles.messageButtonText}>Message Host</Text>
              </TouchableOpacity>
            )}

            {isShortStay && (
              <TouchableOpacity
                style={styles.reserveButton}
                onPress={(e) => {
                  e.stopPropagation();
                  goToBooking(item);
                }}
              >
                <Text style={styles.reserveButtonText}>Reserve Now</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHistoryItem = ({ item: historyItem }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => selectFromHistory(historyItem)}
      activeOpacity={0.7}
    >
      {historyItem.image ? (
        <Image
          source={{ uri: historyItem.image }}
          style={styles.historyThumbnail}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.historyThumbnail, styles.noImagePlaceholder]}>
          <Ionicons name="search" size={18} color={isDarkMode ? "#666" : "#999"} />
        </View>
      )}

      <Text style={[styles.suggestionText, { color: isDarkMode ? "#ccc" : "#333" }]}>
        {historyItem.term}
      </Text>

      <Ionicons 
        name="chevron-forward" 
        size={18} 
        color={isDarkMode ? "#666" : "#999"} 
      />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? "#000" : "#fff" }]}>
      <SearchHeader />

      {!searchQuery ? (
        <View style={styles.suggestionsContainer}>
          <View style={styles.historyHeader}>
            <Text style={[styles.suggestionsTitle, { color: isDarkMode ? "#fff" : "#333" }]}>
              Recent Searches
            </Text>
            {searchHistory.length > 0 && (
              <TouchableOpacity onPress={clearSearchHistory}>
                <Text style={styles.clearButton}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          {searchHistory.length > 0 ? (
            <FlatList
              data={searchHistory}
              keyExtractor={(item, index) => `hist-${index}`}
              renderItem={renderHistoryItem}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={{ color: isDarkMode ? "#aaa" : "gray", textAlign: "center" }}>
                No recent searches yet.{'\n'}Your searches will appear here with previews.
              </Text>
            </View>
          )}
        </View>
      ) : (
        filteredPosts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={{ color: isDarkMode ? "#aaa" : "gray" }}>
              No results found for "{searchQuery}"
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredPosts}
            keyExtractor={(item) => item.id?.toString() || `item-${Math.random()}`}
            renderItem={renderPost}
            contentContainerStyle={{ paddingBottom: 30 }}
            showsVerticalScrollIndicator={false}
          />
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  suggestionsContainer: { flex: 1, paddingHorizontal: 16, paddingTop: 10 },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  suggestionsTitle: { fontWeight: "700", fontSize: 17 },
  clearButton: { color: "#ef4444", fontWeight: "600", fontSize: 15 },
  suggestionItem: { 
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#3333",
  },
  historyThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  noImagePlaceholder: {
    backgroundColor: "#3333",
    alignItems: "center",
    justifyContent: "center",
  },
  suggestionText: { fontSize: 16.5, flex: 1 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },

  // Your original card styles remain untouched
  card: { marginHorizontal: 12, marginVertical: 8, borderBottomWidth: 1 },
  postImage: { width: SCREEN_WIDTH - 24, height: 200, borderRadius: 12 },
  listingInfo: { padding: 14 },
  listingTitle: { fontSize: 17, fontWeight: "600", marginBottom: 6 },
  price: { fontSize: 16.5, fontWeight: "700", marginVertical: 4 },
  location: { fontSize: 14, marginBottom: 12 },
  buttonRow: { flexDirection: "row", marginTop: 12, gap: 10 },
  messageButton: { flex: 1, backgroundColor: "#017a6b", paddingVertical: 12, borderRadius: 8, alignItems: "center" },
  messageButtonText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  reserveButton: { flex: 1, backgroundColor: "#FF9500", paddingVertical: 12, borderRadius: 8, alignItems: "center" },
  reserveButtonText: { color: "#fff", fontWeight: "600", fontSize: 15 },
});