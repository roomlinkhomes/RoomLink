// screens/VendorUserListing.jsx — Header EXACTLY like MyListing.jsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  useColorScheme,
  Dimensions,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useVendorListing } from "../context/ListingContext";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width / 2 - 20;

const VendorUserListing = ({ route }) => {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const { vendorListings, deleteVendorListing, addVendorListing } = useVendorListing();

  const loggedInVendor = route?.params?.vendorId || "vendor123";
  const [myListings, setMyListings] = useState([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);

  useEffect(() => {
    if (!vendorListings || vendorListings.length === 0) {
      setMyListings([]);
      return;
    }
    const filtered =
      vendorListings.some((item) => item.author)
        ? vendorListings.filter((item) => item.author === loggedInVendor)
        : vendorListings;
    setMyListings(filtered);
  }, [vendorListings]);

  const handleDelete = (id) => {
    Alert.alert("Delete Listing", "Are you sure you want to delete this listing?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteVendorListing(id),
      },
    ]);
    setMenuVisible(false);
  };

  const handleRelist = (listing) => {
    const relisted = {
      ...listing,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    addVendorListing(relisted);
    Alert.alert("Relisted!", "This listing has been relisted successfully.");
    setMenuVisible(false);
  };

  const openMenu = (listing) => {
    setSelectedListing(listing);
    setMenuVisible(true);
  };

  const closeMenu = () => {
    setMenuVisible(false);
    setSelectedListing(null);
  };

  const handleCardPress = (item) => {
    navigation.navigate("VendorListingDetails", { listing: item });
  };

  const renderCard = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => handleCardPress(item)}
      style={{ marginBottom: 15 }}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark ? "#2a2a2a" : "#fff",
            borderColor: isDark ? "#444" : "#eee",
          },
        ]}
      >
        <View style={{ position: "relative" }}>
          <Image source={{ uri: item.images?.[0] || "" }} style={styles.image} />

          {item.sold && (
            <View style={styles.soldOverlay}>
              <Text style={styles.soldText}>SOLD</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.menuButton}
            onPress={(e) => {
              e.stopPropagation();
              openMenu(item);
            }}
          >
            <Ionicons name="ellipsis-vertical" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.cardContent}>
          <Text
            style={[styles.title, { color: isDark ? "#fff" : "#111" }]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text style={[styles.price, { color: isDark ? "#00ff7f" : "green" }]}>
            ₦{Number(item.price || 0).toLocaleString()}
          </Text>
          <Text
            style={[styles.location, { color: isDark ? "#ccc" : "gray" }]}
            numberOfLines={1}
          >
            {item.location || "Unknown location"}
          </Text>
          <Text
            style={[styles.description, { color: isDark ? "#ccc" : "gray" }]}
            numberOfLines={2}
          >
            {item.description || "No description available"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? "#1e1e1e" : "#f9f9f9" }]}>
      {/* ========== HEADER — EXACTLY LIKE MYLISTING.JSX ========== */}
      <View style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-start",
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 32,
      }}>
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: 10 }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={28} color="#000000" />
        </TouchableOpacity>

        {/* Title */}
        <View style={{ flex: 1, alignItems: "center", marginRight: 48 }}>
          <Text style={[styles.pageTitle, { color: isDark ? "#fff" : "#000" }]}>
            Vendor store
          </Text>
        </View>
      </View>
      {/* ========== END HEADER ========== */}

      {myListings.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={{ color: isDark ? "#ccc" : "gray" }}>
            No vendor listings yet.
          </Text>
        </View>
      ) : (
        <FlatList
          data={myListings}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderCard}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          contentContainerStyle={{ padding: 10, paddingBottom: 100 }}
        />
      )}

      {/* MENU MODAL */}
      <Modal
        transparent
        visible={menuVisible}
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <TouchableOpacity style={styles.modalOverlay} onPress={closeMenu}>
          <View style={[styles.menuContainer, { backgroundColor: isDark ? "#333" : "#fff" }]}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleRelist(selectedListing)}
            >
              <Ionicons name="refresh-outline" size={16} color="#036dd6" />
              <Text style={styles.menuText}>Relist</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleDelete(selectedListing?.id)}
            >
              <Ionicons name="trash-outline" size={16} color="#ff4444" />
              <Text style={[styles.menuText, { color: "#ff4444" }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  pageTitle: {
    fontSize: 24,
    fontWeight: "800",
  },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    width: CARD_WIDTH,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
  },
  image: { width: "100%", height: 120 },
  soldOverlay: {
    position: "absolute",
    top: 5,
    left: 5,
    backgroundColor: "red",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  soldText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  menuButton: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 4,
    borderRadius: 10,
  },
  cardContent: { padding: 8 },
  title: { fontSize: 14, fontWeight: "bold" },
  price: { fontSize: 13, marginVertical: 2 },
  location: { fontSize: 12, marginBottom: 2 },
  description: { fontSize: 12, marginBottom: 8 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuContainer: {
    width: 180,
    borderRadius: 10,
    paddingVertical: 8,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  menuText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#036dd6",
    fontWeight: "500",
  },
});

export default VendorUserListing;