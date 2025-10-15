import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  useColorScheme,
} from "react-native";
import { VendorListingContext } from "../context/ListingContext";
import { useRoute, useNavigation } from "@react-navigation/native";

export default function VendorSearch() {
  const { vendorListings } = useContext(VendorListingContext);
  const route = useRoute();
  const navigation = useNavigation();

  const colorScheme = useColorScheme();       // ✅ detect system theme
  const isDarkMode = colorScheme === "dark";  // ✅ true if dark mode

  const searchQuery = route.params?.query || "";

  const [filteredPosts, setFilteredPosts] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredPosts([]);
      return;
    }

    const lower = searchQuery.toLowerCase();

    if (searchQuery.trim() && !searchHistory.includes(searchQuery.trim())) {
      setSearchHistory((prev) => [searchQuery.trim(), ...prev].slice(0, 5));
    }

    const results = vendorListings.filter((item) => {
      return (
        item.title?.toLowerCase().includes(lower) ||
        item.category?.toLowerCase().includes(lower) ||
        item.price?.toString().toLowerCase().includes(lower) ||
        item.author?.toLowerCase().includes(lower)
      );
    });

    setFilteredPosts(results);
  }, [searchQuery, vendorListings]);

  const useSuggestion = (term) => {
    navigation.setParams({ query: term });
  };

  const renderVendor = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.resultItem,
        {
          backgroundColor: isDarkMode ? "#1e1e1e" : "#fff",
          borderColor: isDarkMode ? "#333" : "#ddd",
        },
      ]}
      onPress={() =>
        navigation.navigate("VendorListingDetails", { listing: item })
      }
    >
      {item.image && (
        <Image source={{ uri: item.image }} style={styles.vendorImage} />
      )}
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: isDarkMode ? "#fff" : "#000" }]}>
          {item.title}
        </Text>
        <Text style={[styles.price, { color: isDarkMode ? "#81C784" : "green" }]}>
          ₦{item.price}
        </Text>
        <Text style={[styles.category, { color: isDarkMode ? "#ccc" : "gray" }]}>
          {item.category}
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
              key={index}
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
            <Text style={{ color: isDarkMode ? "#aaa" : "gray" }}>
              No vendor results found.
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredPosts}
            keyExtractor={(item, index) => item.id?.toString() || index.toString()}
            renderItem={renderVendor}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )
      ) : (
        !searchHistory.length && (
          <View style={styles.emptyState}>
            <Text style={{ color: isDarkMode ? "#aaa" : "gray" }}>
              Start typing to search vendors...
            </Text>
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
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center" },
  resultItem: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  vendorImage: { width: 60, height: 60, borderRadius: 6, marginRight: 10 },
  title: { fontSize: 16, fontWeight: "bold", marginBottom: 2 },
  price: { fontSize: 14, marginBottom: 2 },
  category: { fontSize: 13 },
});
