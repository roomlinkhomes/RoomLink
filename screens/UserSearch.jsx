// screens/UserSearch.jsx
import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig"; // 🔹 Your Firestore config
import { ListingContext } from "../context/ListingContext"; // 🔹 Local listing context

const UserSearch = () => {
  const navigation = useNavigation();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const { listings } = useContext(ListingContext); // 🔹 Get all local posts
  const [queryText, setQueryText] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (text) => {
    setQueryText(text);
    if (text.trim() === "") {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      // 🔹 1️⃣ Local filter (fast and offline)
      const localResults = listings.filter((item) =>
        item?.title?.toLowerCase().includes(text.toLowerCase())
      );

      // 🔹 2️⃣ Firestore query (for remote / live data)
      const q = query(
        collection(db, "usersearch"),
        where("title", ">=", text),
        where("title", "<=", text + "\uf8ff")
      );

      const querySnapshot = await getDocs(q);
      const remoteResults = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // 🔹 Combine local + remote (avoid duplicates by id)
      const combined = [...localResults];
      remoteResults.forEach((remote) => {
        if (!combined.some((local) => local.id === remote.id)) {
          combined.push(remote);
        }
      });

      setResults(combined);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: isDark ? "#1e1e1e" : "#f3f3f3" }]}
      onPress={() => navigation.navigate("ListingDetails", { listingId: item.id })}
    >
      <Image
        source={{ uri: item.images?.[0] || "https://via.placeholder.com/150" }}
        style={styles.thumbnail}
      />
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: isDark ? "#fff" : "#111" }]} numberOfLines={1}>
          {item.title}
        </Text>
        {item.price && (
          <Text style={{ color: isDark ? "#bbb" : "#444", fontSize: 13 }}>
            ₦{item.price?.toLocaleString()}
          </Text>
        )}
      </View>
      <Ionicons
        name="chevron-forward-outline"
        size={22}
        color={isDark ? "#fff" : "#333"}
      />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? "#121212" : "#fff" }]}>
      {/* 🔍 Search Bar */}
      <View style={[styles.searchBar, { backgroundColor: isDark ? "#1e1e1e" : "#f2f2f2" }]}>
        <Ionicons
          name="search-outline"
          size={22}
          color={isDark ? "#fff" : "#333"}
          style={{ marginRight: 8 }}
        />
        <TextInput
          style={[styles.input, { color: isDark ? "#fff" : "#111" }]}
          placeholder="Search user posts..."
          placeholderTextColor={isDark ? "#888" : "#666"}
          value={queryText}
          onChangeText={handleSearch}
        />
        {queryText.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch("")}>
            <Ionicons name="close-circle" size={20} color={isDark ? "#ccc" : "#777"} />
          </TouchableOpacity>
        )}
      </View>

      {/* Results */}
      {loading ? (
        <ActivityIndicator size="large" color="#1A237E" style={{ marginTop: 30 }} />
      ) : results.length > 0 ? (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 12 }}
        />
      ) : queryText ? (
        <View style={styles.emptyState}>
          <Ionicons name="search" size={50} color="#999" />
          <Text style={{ color: isDark ? "#bbb" : "#555", marginTop: 10 }}>
            No results found
          </Text>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={50} color="#999" />
          <Text style={{ color: isDark ? "#bbb" : "#555", marginTop: 10 }}>
            Type something to search posts
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    margin: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  input: { flex: 1, fontSize: 16 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    elevation: 1,
  },
  thumbnail: { width: 70, height: 70, borderRadius: 8, marginRight: 10 },
  title: { fontSize: 16, fontWeight: "600" },
  emptyState: { alignItems: "center", marginTop: 80 },
});

export default UserSearch;
	
