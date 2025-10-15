import React, { useContext, useState } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ListingContext } from "../context/ListingContext";
import { UserContext } from "../context/UserContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function UserListings({ navigation, userId }) {
  const { listings, deleteListing, addListing, updateListing } =
    useContext(ListingContext);
  const { user: currentUser } = useContext(UserContext);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const isOwner = userId === currentUser?.id;
  const userListings = listings.filter((item) => item.authorId === userId);

  const confirmDelete = (itemId) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this listing?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteListing(itemId),
      },
    ]);
  };

  const handleRelist = (item) => {
    const relisted = { ...item, id: Date.now().toString(), rented: false };
    addListing(relisted);
  };

  const handleMarkAsRented = (item) => {
    const updated = { ...item, rented: !item.rented };
    updateListing(updated);
    Alert.alert(
      "Success",
      item.rented
        ? "Listing marked as available again."
        : "Listing marked as rented."
    );
  };

  const openMenu = (item) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const renderCard = ({ item }) => {
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
            backgroundColor: isDarkMode ? "#121212" : "#fff",
            borderBottomColor: isDarkMode ? "#222" : "#d3d3d3",
          },
        ]}
      >
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={{ width: "100%", height: 250 }}
        >
          {images.map((img, idx) => (
            <View key={idx} style={{ position: "relative" }}>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("ListingDetails", { listing: item })
                }
              >
                <Image source={{ uri: img }} style={styles.image} />
              </TouchableOpacity>

              {/* Rented tag */}
              {item.rented && (
                <View style={styles.rentedTag}>
                  <Text style={styles.rentedText}>RENTED</Text>
                </View>
              )}

              {/* 3-dot menu overlay with shield */}
              {isOwner && (
                <TouchableOpacity
                  style={[
                    styles.menuButton,
                    {
                      backgroundColor: isDarkMode
                        ? "rgba(255,255,255,0.15)"
                        : "rgba(0,0,0,0.1)",
                    },
                  ]}
                  onPress={() => openMenu(item)}
                >
                  <Ionicons
                    name="ellipsis-vertical"
                    size={18}
                    color={isDarkMode ? "#fff" : "#333"}
                  />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </ScrollView>

        <View style={styles.cardContent}>
          <Text
            style={[
              styles.title,
              { color: isDarkMode ? "#fff" : "#000" },
            ]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text
            style={[styles.price, { color: isDarkMode ? "#81C784" : "green" }]}
          >
            ₦{Number(item.price).toLocaleString()}
          </Text>
          <Text
            style={[
              styles.location,
              { color: isDarkMode ? "#ccc" : "gray" },
            ]}
            numberOfLines={1}
          >
            {item.location || item.category}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? "#000" : "#fff" },
      ]}
    >
      {userListings.length === 0 ? (
        <View style={styles.emptyState}>
          <Text
            style={{ color: isDarkMode ? "#aaa" : "gray", textAlign: "center" }}
          >
            No listings available.
          </Text>
        </View>
      ) : (
        <FlatList
          data={userListings}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderCard}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      {/* Bottom Sheet Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setModalVisible(false)}
        >
          <View
            style={[
              styles.bottomSheet,
              { backgroundColor: isDarkMode ? "#1c1c1c" : "#fff" },
            ]}
          >
            {isOwner && selectedItem && (
              <>
                {/* Delete */}
                <TouchableOpacity
                  style={[
                    styles.sheetRow,
                    { borderBottomColor: isDarkMode ? "#222" : "#eee" },
                  ]}
                  onPress={() => {
                    setModalVisible(false);
                    confirmDelete(selectedItem.id);
                  }}
                >
                  <Ionicons name="trash-outline" size={20} color="red" />
                  <Text
                    style={[
                      styles.sheetText,
                      { color: isDarkMode ? "#fff" : "#000" },
                    ]}
                  >
                    Delete
                  </Text>
                </TouchableOpacity>

                {/* Relist */}
                <TouchableOpacity
                  style={[
                    styles.sheetRow,
                    { borderBottomColor: isDarkMode ? "#222" : "#eee" },
                  ]}
                  onPress={() => {
                    setModalVisible(false);
                    handleRelist(selectedItem);
                  }}
                >
                  <Ionicons name="repeat-outline" size={20} color="#00796B" />
                  <Text
                    style={[
                      styles.sheetText,
                      { color: isDarkMode ? "#fff" : "#000" },
                    ]}
                  >
                    Relist
                  </Text>
                </TouchableOpacity>

                {/* Mark as Rented */}
                <TouchableOpacity
                  style={[
                    styles.sheetRow,
                    { borderBottomColor: isDarkMode ? "#222" : "#eee" },
                  ]}
                  onPress={() => {
                    setModalVisible(false);
                    handleMarkAsRented(selectedItem);
                  }}
                >
                  <Ionicons
                    name="checkmark-done-circle-outline"
                    size={20}
                    color="#2E7D32"
                  />
                  <Text
                    style={[
                      styles.sheetText,
                      { color: isDarkMode ? "#fff" : "#000" },
                    ]}
                  >
                    {selectedItem?.rented
                      ? "Mark as Available"
                      : "Mark as Rented"}
                  </Text>
                </TouchableOpacity>

                {/* Edit */}
                <TouchableOpacity
                  style={[
                    styles.sheetRow,
                    { borderBottomColor: isDarkMode ? "#222" : "#eee" },
                  ]}
                  onPress={() => {
                    setModalVisible(false);
                    navigation.navigate("EditListing", {
                      listing: selectedItem,
                    });
                  }}
                >
                  <Ionicons name="pencil-outline" size={20} color="#017a6b" />
                  <Text
                    style={[
                      styles.sheetText,
                      { color: isDarkMode ? "#fff" : "#000" },
                    ]}
                  >
                    Edit
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  card: {
    marginBottom: 15,
    borderBottomWidth: 3,
    paddingBottom: 10,
  },
  image: { width: SCREEN_WIDTH, height: 250 },
  cardContent: { padding: 10 },
  title: { fontSize: 16, fontWeight: "bold", marginBottom: 2 },
  price: { fontSize: 16, marginBottom: 2 },
  location: { marginBottom: 10 },
  menuButton: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: 6,
    borderRadius: 20,
  },
  rentedTag: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(229, 57, 53, 0.9)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  rentedText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  bottomSheet: {
    paddingVertical: 10,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  sheetRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
  },
  sheetText: { fontSize: 16, marginLeft: 10, fontWeight: "600" },
});
