import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  useColorScheme,
  Alert,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useCart } from "../context/CartContext";
import { useNavigation } from "@react-navigation/native";

export default function Cart() {
  const { cartItems, removeFromCart, clearCart } = useCart();
  const isDark = useColorScheme() === "dark";
  const navigation = useNavigation();

  // ✅ Calculate total price
  const totalPrice = cartItems.reduce(
    (sum, item) => sum + Number(item.price || 0),
    0
  );

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert("Cart is empty", "Add some items before checking out.");
      return;
    }

    // ✅ Navigate to Checkout screen
    navigation.navigate("Checkout", { cartItems, totalPrice });
  };

  const renderCartItem = ({ item }) => (
    <View
      style={[
        styles.itemContainer,
        {
          backgroundColor: isDark ? "#2a2a2a" : "#fff",
          borderColor: isDark ? "#444" : "#eee",
        },
      ]}
    >
      <Image source={{ uri: item.images?.[0] }} style={styles.image} />
      <View style={styles.itemDetails}>
        <Text
          style={[styles.title, { color: isDark ? "#fff" : "#111" }]}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        <Text style={[styles.price, { color: isDark ? "#00ff7f" : "green" }]}>
          ₦{Number(item.price).toLocaleString()}
        </Text>
        <Text style={[styles.location, { color: isDark ? "#ccc" : "gray" }]}>
          {item.location}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => removeFromCart(item.id)}
        style={styles.removeButton}
      >
        <MaterialCommunityIcons
          name="close-circle-outline"
          size={22}
          color="#d9534f"
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#1e1e1e" : "white" },
      ]}
    >
      <Text style={[styles.header, { color: isDark ? "#fff" : "#111" }]}>
        My Cart
      </Text>

      {cartItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="cart-outline" size={60} color="#aaa" />
          <Text style={{ color: isDark ? "#ccc" : "#777", marginTop: 10 }}>
            Your cart is empty
          </Text>
        </View>
      ) : (
        <>
          <FlatList
            data={cartItems}
            keyExtractor={(item, index) =>
              item.id?.toString() || index.toString()
            }
            renderItem={renderCartItem}
            contentContainerStyle={{ paddingBottom: 100 }}
          />

          <View
            style={[
              styles.footer,
              { backgroundColor: isDark ? "#2a2a2a" : "#fff" },
            ]}
          >
            <TouchableOpacity
              style={[styles.clearButton, { backgroundColor: "#f8d7da" }]}
              onPress={clearCart}
            >
              <MaterialCommunityIcons name="cart-off" size={20} color="#d9534f" />
              <Text style={[styles.footerText, { color: "#d9534f" }]}>
                Clear Cart
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.checkoutButton, { backgroundColor: "#036dd6" }]}
              onPress={handleCheckout}
            >
              <Ionicons name="cash-outline" size={18} color="#fff" />
              <Text style={styles.footerText}>
                Checkout (₦{totalPrice.toLocaleString()})
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    padding: 16,
    textAlign: "center",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 10,
    marginVertical: 6,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 10,
  },
  itemDetails: { flex: 1 },
  title: { fontSize: 14, fontWeight: "bold" },
  price: { fontSize: 13, marginTop: 3 },
  location: { fontSize: 12, marginTop: 2 },
  removeButton: {
    padding: 6,
    borderRadius: 20,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderTopWidth: 1,
    borderColor: "#ccc",
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  checkoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  footerText: {
    fontWeight: "600",
    marginLeft: 6,
    color: "#fff",
  },
});
