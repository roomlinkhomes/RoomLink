// screens/VisitorListings.jsx
import React, { useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
  useColorScheme,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ListingContext } from "../context/ListingContext"; // FIXED: ../ not ./

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function VisitorListings({ userId }) {
  const navigation = useNavigation();
  const { listings } = useContext(ListingContext);
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const resolveUserId = (item) =>
    item?.authorId ?? item?.ownerId ?? item?.userId ?? item?.uid ?? null;

  const visitorListings = listings.filter(
    (item) => resolveUserId(item) === userId
  );

  const renderCard = ({ item }) => {
    const images =
      Array.isArray(item.images) && item.images.length > 0
        ? item.images
        : item.image
        ? [item.image]
        : [];

    return (
      <View style={styles.card}>
        <ScrollView horizontal pagingEnabled style={{ width: "100%", height: 250 }}>
          {images.map((img, idx) => (
            <View key={idx} style={{ position: "relative" }}>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("ListingDetails", { listing: item })
                }
              >
                <Image source={{ uri: img }} style={styles.image} />
              </TouchableOpacity>

              {item.rented && (
                <View style={styles.rentedTag}>
                  <Text style={styles.rentedText}>RENTED</Text>
                </View>
              )}
              {/* NO 3-DOT MENU */}
            </View>
          ))}
        </ScrollView>

        <View style={styles.cardContent}>
          <Text style={[styles.title, { color: isDarkMode ? "#fff" : "#000" }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.price, { color: isDarkMode ? "#81C784" : "green" }]}>
            ₦{Number(item.price).toLocaleString()}
          </Text>
          <Text style={[styles.location, { color: isDarkMode ? "#ccc" : "gray" }]} numberOfLines={1}>
            {item.location || item.category}
          </Text>
        </View>
      </View>
    );
  };

  if (visitorListings.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={{ color: isDarkMode ? "#aaa" : "gray", textAlign: "center" }}>
          No listings yet.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? "#000" : "#fff" }]}>
      <FlatList
        data={visitorListings}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderCard}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  card: { marginBottom: 15, borderBottomWidth: 3, borderBottomColor: "#d3d3d3", backgroundColor: "#fff" },
  image: { width: SCREEN_WIDTH, height: 250 },
  cardContent: { padding: 10 },
  title: { fontSize: 16, fontWeight: "bold", marginBottom: 2 },
  price: { fontSize: 16, marginBottom: 2 },
  location: { marginBottom: 10 },
  rentedTag: { position: "absolute", top: 10, left: 10, backgroundColor: "rgba(229,57,53,0.9)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  rentedText: { color: "#fff", fontWeight: "700", fontSize: 12 },
});