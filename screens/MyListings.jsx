// screens/MyListing.jsx — FIXED: Removed "Create Listing" button from empty state
import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  ScrollView,
  Modal,
  useColorScheme,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { ListingContext } from "../context/ListingContext";
import { UserContext } from "../context/UserContext";
import { db } from "../firebaseConfig";
import { doc, collection, onSnapshot, setDoc } from "firebase/firestore";
import { BarChart } from "react-native-gifted-charts";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function MyListing() {
  const navigation = useNavigation();
  const {
    listings,
    deleteListing,
    addListing,
    updateListing,
    markAsRented,
    loading: listingsLoading,
  } = useContext(ListingContext);
  const { user: currentUser } = useContext(UserContext);
  const [menuVisible, setMenuVisible] = useState(false);
  const [analyticsVisible, setAnalyticsVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [viewCounts, setViewCounts] = useState({});
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const resolveUserId = (item) =>
    item?.userId ?? item?.ownerId ?? item?.authorId ?? item?.uid ?? null;

  const myListings = listings.filter(
    (item) => resolveUserId(item) === currentUser?.uid
  );

  const recordView = async (listingId, ownerId) => {
    if (!currentUser) return;
    if (currentUser.uid === ownerId) return;
    try {
      const ref = doc(db, "listings", listingId, "views", currentUser.uid);
      await setDoc(ref, { timestamp: Date.now() }, { merge: true });
    } catch (err) {
      console.log("Error recording view:", err);
    }
  };

  useEffect(() => {
    if (!currentUser || myListings.length === 0) return;
    const unsubscribers = myListings.map((item) => {
      const colRef = collection(db, "listings", item.id, "views");
      return onSnapshot(colRef, (snapshot) => {
        setViewCounts((prev) => ({
          ...prev,
          [item.id]: snapshot.size,
        }));
      });
    });
    return () => unsubscribers.forEach((unsub) => unsub && unsub());
  }, [currentUser, myListings]);

  const openMenu = (item) => {
    setSelectedItem(item);
    setMenuVisible(true);
  };

  const closeMenu = () => {
    setMenuVisible(false);
    setSelectedItem(null);
  };

  const confirmDelete = (id) => {
    Alert.alert("Delete Listing", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteListing(id);
          closeMenu();
        },
      },
    ]);
  };

  const handleRelist = async (item) => {
    const newListing = {
      ...item,
      rented: false,
      createdAt: Date.now(),
    };
    delete newListing.id;
    await addListing(newListing);
    closeMenu();
  };

  const handleMarkAsRented = async (item) => {
    await markAsRented(item.id, !item.rented);
    closeMenu();
  };

  const openAnalytics = (item) => {
    setSelectedItem(item);
    setAnalyticsVisible(true);
  };

  const closeAnalytics = () => {
    setAnalyticsVisible(false);
    setSelectedItem(null);
  };

  const chartData = [
    { value: viewCounts[selectedItem?.id] ?? 0, label: "Today" },
    { value: Math.floor((viewCounts[selectedItem?.id] ?? 0) * 0.6), label: "Week" },
    { value: Math.floor((viewCounts[selectedItem?.id] ?? 0) * 0.3), label: "Month" },
  ];

  const renderCard = ({ item }) => {
    const images =
      Array.isArray(item.images) && item.images.length > 0
        ? item.images
        : item.image
        ? [item.image]
        : [];

    const isBoosted = item.boostedUntil && new Date(item.boostedUntil) > new Date();

    return (
      <View style={styles.card}>
        <ScrollView horizontal pagingEnabled style={{ width: "100%", height: 250 }}>
          {images.map((img, idx) => (
            <View key={idx} style={{ position: "relative" }}>
              <TouchableOpacity
                onPress={() => {
                  recordView(item.id, currentUser.uid);
                  navigation.navigate("ListingDetails", { listing: item });
                }}
              >
                <Image source={{ uri: img }} style={styles.image} />
              </TouchableOpacity>
              {item.rented && (
                <View style={styles.rentedTag}>
                  <Text style={styles.rentedText}>RENTED</Text>
                </View>
              )}
              {isBoosted && (
                <View style={styles.boostedBadge}>
                  <Ionicons name="flame" size={16} color="#FF9500" />
                  <Text style={styles.boostedBadgeText}>Boosted</Text>
                </View>
              )}
              <TouchableOpacity style={styles.menuButton} onPress={() => openMenu(item)}>
                <Ionicons name="ellipsis-vertical" size={18} color="#fff" />
              </TouchableOpacity>
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

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.viewRow} onPress={() => openAnalytics(item)}>
              <Ionicons name="stats-chart-outline" size={18} color={isDarkMode ? "#aaa" : "#555"} />
              <Text style={[styles.viewText, { color: isDarkMode ? "#aaa" : "#555" }]}>
                {viewCounts[item.id] ?? 0} views
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.boostButton}
              onPress={() => navigation.navigate("BoostPost", { listing: item })}
            >
              <Ionicons name="trending-up-outline" size={18} color="#fff" />
              <Text style={styles.boostText}>Boost</Text>
            </TouchableOpacity>

            {isBoosted && (
              <TouchableOpacity
                style={styles.insightsButton}
                onPress={() => {
                  navigation.navigate("BoostInsights", { listing: item });
                }}
              >
                <Ionicons name="bar-chart-outline" size={18} color="#fff" />
                <Text style={styles.insightsText}>Insights</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (!currentUser) {
    return (
      <View style={styles.emptyState}>
        <Text style={{ color: isDarkMode ? "#aaa" : "gray" }}>
          Please log in to view your listings.
        </Text>
      </View>
    );
  }

  if (listingsLoading || !listings) {
    return (
      <View style={styles.emptyState}>
        <ActivityIndicator size="large" color="#017a6b" />
        <Text style={{ color: isDarkMode ? "#aaa" : "gray", marginTop: 20 }}>
          Loading your listings...
        </Text>
      </View>
    );
  }

  if (myListings.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={{ color: isDarkMode ? "#aaa" : "gray", textAlign: "center" }}>
          You have no listings yet.
        </Text>
        {/* Removed the "Create Listing" button as requested */}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? "#000" : "#fff" }]}>
      {/* ========== HEADER - SAME HEIGHT AS EDITPROFILE/WALLET/GETVERIFIED ========== */}
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
          <Ionicons name="arrow-back" size={28} color={isDarkMode ? "#fff" : "#000"} />
        </TouchableOpacity>

        {/* Title */}
        <View style={{ flex: 1, alignItems: "center", marginRight: 48 }}>
          <Text style={[styles.pageTitle, { color: isDarkMode ? "#fff" : "#000" }]}>
            My Listings
          </Text>
        </View>
      </View>
      {/* ========== END HEADER ========== */}

      <FlatList
        data={myListings}
        keyExtractor={(item) => item._key || item.id}
        renderItem={renderCard}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      {/* Menu Modal */}
      <Modal visible={menuVisible} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={closeMenu}>
          <View style={styles.bottomSheet}>
            {selectedItem && (
              <>
                <TouchableOpacity style={styles.sheetRow} onPress={() => confirmDelete(selectedItem.id)}>
                  <Ionicons name="trash-outline" size={20} color="red" />
                  <Text style={styles.sheetText}>Delete</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sheetRow} onPress={() => handleRelist(selectedItem)}>
                  <Ionicons name="repeat-outline" size={20} color="#00796B" />
                  <Text style={styles.sheetText}>Relist</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sheetRow} onPress={() => handleMarkAsRented(selectedItem)}>
                  <Ionicons name="checkmark-done-circle-outline" size={20} color="#2E7D32" />
                  <Text style={styles.sheetText}>
                    {selectedItem.rented ? "Mark Available" : "Mark Rented"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.sheetRow}
                  onPress={() => {
                    closeMenu();
                    navigation.navigate("EditListing", { listing: selectedItem });
                  }}
                >
                  <Ionicons name="pencil-outline" size={20} color="#017a6b" />
                  <Text style={styles.sheetText}>Edit</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Analytics Modal */}
      <Modal visible={analyticsVisible} transparent animationType="slide">
        <TouchableOpacity style={styles.analyticsOverlay} activeOpacity={1} onPressOut={closeAnalytics}>
          <View style={styles.analyticsSheet}>
            <Text style={styles.analyticsHeader}>Listing Analytics</Text>
            <View style={styles.analyticsRow}>
              <Ionicons name="stats-chart-outline" size={22} color="#007AFF" />
              <Text style={styles.analyticsValue}>
                Views: {selectedItem ? viewCounts[selectedItem.id] ?? 0 : 0}
              </Text>
            </View>
            <View style={{ marginTop: 20 }}>
              <BarChart
                data={chartData}
                barWidth={40}
                spacing={30}
                roundedTop
                hideRules
                yAxisThickness={0}
                xAxisThickness={0}
                frontColor="#007AFF"
                width={SCREEN_WIDTH - 40}
                height={200}
              />
            </View>
            <Text style={styles.analyticsPlaceholder}>
              Your listing views and progress will appear here.
            </Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pageTitle: {
    fontSize: 24,
    fontWeight: "800",
  },
  emptyState: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    padding: 20 
  },
  card: {
    marginBottom: 15,
    borderBottomWidth: 3,
    borderBottomColor: "#d3d3d3",
    backgroundColor: "#fff",
  },
  image: { width: SCREEN_WIDTH, height: 250 },
  cardContent: { padding: 10 },
  title: { fontSize: 16, fontWeight: "bold" },
  price: { fontSize: 16, marginTop: 2 },
  location: { marginTop: 5 },
  rentedTag: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(229,57,53,0.9)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  rentedText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  boostedBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,149,0,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  boostedBadgeText: {
    color: "#FF9500",
    fontWeight: "bold",
    fontSize: 13,
    marginLeft: 5,
  },
  menuButton: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: 4,
    borderRadius: 10,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  viewRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewText: {
    marginLeft: 6,
    fontSize: 14,
  },
  boostButton: {
    backgroundColor: "#FF9500",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  boostText: {
    color: "#fff",
    marginLeft: 6,
    fontWeight: "bold",
    fontSize: 14,
  },
  insightsButton: {
    backgroundColor: "#017a6b",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  insightsText: {
    color: "#fff",
    marginLeft: 6,
    fontWeight: "bold",
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  bottomSheet: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  sheetRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  sheetText: {
    fontSize: 16,
    marginLeft: 10,
    fontWeight: "600",
  },
  analyticsOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  analyticsSheet: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: "100%",
  },
  analyticsHeader: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 15,
  },
  analyticsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  analyticsValue: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  analyticsPlaceholder: {
    marginTop: 15,
    fontSize: 14,
    color: "#777",
  },
});