// screens/SearchScreen.jsx — FIXED: Safe keyExtractor + deduplication + dark mode polish
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
} from "react-native";
import { ListingContext } from "../context/ListingContext";
import { useRoute } from "@react-navigation/native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function SearchScreen({ navigation }) {
  const { listings: contextListings } = useContext(ListingContext);
  const route = useRoute();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const searchQuery = route.params?.query || "";

  const [filteredPosts, setFilteredPosts] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);

  const listings = route.params?.listings ?? contextListings ?? [];
  const scope = route.params?.scope ?? "all";
  const userIdFilter = route.params?.userId ?? null;

  // FIXED: Deduplicate listings by ID (prevents duplicate keys)
  const uniqueListings = useMemo(() => {
    const seen = new Map();
    return listings.filter((item) => {
      if (!item?.id) return false; // Skip items with no ID
      if (seen.has(item.id)) return false;
      seen.set(item.id, true);
      return true;
    });
  }, [listings]);

  useEffect(() => {
    if (!searchQuery?.trim()) {
      setFilteredPosts([]);
      return;
    }

    const lowerText = searchQuery.toLowerCase().trim();

    // Add to history only if new
    if (lowerText && !searchHistory.includes(lowerText)) {
      setSearchHistory((prev) => [lowerText, ...prev].slice(0, 5));
    }

    const results = uniqueListings.filter((item) => {
      if (scope === "user" && item.userId !== userIdFilter) return false;

      return (
        item.title?.toLowerCase().includes(lowerText) ||
        item.location?.toLowerCase().includes(lowerText) ||
        String(item.price || "").toLowerCase().includes(lowerText) ||
        item.userName?.toLowerCase().includes(lowerText)
      );
    });

    setFilteredPosts(results);
  }, [searchQuery, uniqueListings, scope, userIdFilter, searchHistory]);

  const useSuggestion = (term) => {
    navigation.setParams({ query: term });
  };

  const renderPost = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.card,
        { borderBottomColor: isDarkMode ? "#333" : "#ccc" },
      ]}
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
        <Text style={[styles.price, { color: isDarkMode ? "#81C784" : "green" }]}>
          ₦{Number(item.price || 0).toLocaleString()}
        </Text>
        <Text style={[styles.location, { color: isDarkMode ? "#ccc" : "gray" }]}>
          {item.location || "Location not specified"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? "#000" : "#fff" }]}>
      {!searchQuery && searchHistory.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <Text style={[styles.suggestionsTitle, { color: isDarkMode ? "#fff" : "gray" }]}>
            Recent searches
          </Text>
          {searchHistory.map((term, index) => (
            <TouchableOpacity
              key={term} // ← Use term itself as key (unique strings)
              style={styles.suggestionItem}
              onPress={() => useSuggestion(term)}
            >
              <Text style={[styles.suggestionText, { color: isDarkMode ? "#ccc" : "#333" }]}>
                {term}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {searchQuery ? (
        filteredPosts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={{ color: isDarkMode ? "#aaa" : "gray" }}>No results found.</Text>
          </View>
        ) : (
          <FlatList
            data={filteredPosts}
            keyExtractor={(item, index) => item.id ? item.id.toString() : `fallback-${index}`} // ← SAFE fallback
            renderItem={renderPost}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={{ color: isDarkMode ? "#aaa" : "gray" }}>No listings match your search.</Text>
              </View>
            }
          />
        )
      ) : (
        !searchHistory.length && (
          <View style={styles.emptyState}>
            <Text style={{ color: isDarkMode ? "#aaa" : "gray" }}>Start typing to search...</Text>
          </View>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  suggestionsContainer: { paddingHorizontal: 15, marginBottom: 10 },
  suggestionsTitle: { fontWeight: "bold", marginBottom: 5 },
  suggestionItem: { paddingVertical: 5 },
  suggestionText: { fontSize: 14 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  card: { margin: 10, borderBottomWidth: 1 },
  postImage: { width: SCREEN_WIDTH - 20, height: 200, borderRadius: 8 },
  listingInfo: { padding: 10 },
  listingTitle: { fontSize: 16, fontWeight: "bold" },
  price: { fontSize: 16, marginVertical: 2 },
  location: {},
});