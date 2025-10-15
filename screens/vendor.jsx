import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
  BackHandler,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useVendorListing } from "../context/ListingContext";
import { useCart } from "../context/CartContext";

// ✅ Import VendorHeader
import VendorHeader from "../component/VendorHeader";

import Cart from "./Cart";
import Orders from "./orders";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width / 2 - 20;

// --- Vendor Feed ---
function VendorFeed({ navigation }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { vendorListings, addVendorListing } = useVendorListing();

  // ✅ Safe fallback for cart context
  const { addToCart = () => {} } = useCart() || {};

  const flatListRef = useRef(null);
  const lastBackPress = useRef(0);

  useEffect(() => {
    if (vendorListings.length === 0) {
      addVendorListing({
        title: "Modern 2-Bedroom Apartment",
        description: "Spacious, well-furnished flat in Lekki Phase 1.",
        images: ["https://picsum.photos/300/200"],
        price: 450000,
        location: "Lekki, Lagos",
        author: "vendor123",
      });
    }
  }, []);

  const [activeCategory, setActiveCategory] = useState("All");
  const [filteredListings, setFilteredListings] = useState(vendorListings);

  useEffect(() => {
    if (activeCategory === "All") {
      setFilteredListings(vendorListings);
    } else {
      setFilteredListings(
        vendorListings.filter(
          (item) =>
            item.category?.toLowerCase() === activeCategory.toLowerCase() ||
            item.title?.toLowerCase().includes(activeCategory.toLowerCase())
        )
      );
    }
  }, [activeCategory, vendorListings]);

  useEffect(() => {
    global.applyVendorCategory = (category) => {
      setActiveCategory(category);
      if (flatListRef.current) {
        flatListRef.current.scrollToOffset({ offset: 0, animated: true });
      }
    };
    return () => {
      global.applyVendorCategory = null;
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        const now = Date.now();
        if (flatListRef.current) {
          flatListRef.current.scrollToOffset({ offset: 0, animated: true });
        }
        if (now - lastBackPress.current < 2000) {
          BackHandler.exitApp();
          return true;
        }
        lastBackPress.current = now;
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );
      return () => backHandler.remove();
    }, [])
  );

  const renderCard = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: isDark ? "#2a2a2a" : "#fff",
          borderColor: isDark ? "#444" : "#eee",
        },
      ]}
      onPress={() =>
        navigation.navigate("VendorListingDetails", { listing: item })
      }
    >
      <View>
        <Image source={{ uri: item.images?.[0] || "" }} style={styles.image} />
        {/* 🛒 Floating Cart Icon */}
        <TouchableOpacity
          style={styles.cartIcon}
          onPress={() => addToCart(item)}
        >
          <Ionicons name="cart-outline" size={20} color="#fff" />
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
          ₦{Number(item.price).toLocaleString()}
        </Text>
        <Text
          style={[styles.location, { color: isDark ? "#ccc" : "gray" }]}
          numberOfLines={1}
        >
          {item.location || item.category}
        </Text>
        <Text
          style={[styles.description, { color: isDark ? "#ccc" : "gray" }]}
          numberOfLines={2}
        >
          {item.description || "No description available"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#1e1e1e" : "white" },
      ]}
    >
      {/* ✅ VendorHeader appears only here */}
      <VendorHeader />

      {filteredListings.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={{ color: isDark ? "#ccc" : "gray" }}>
            No vendor posts yet.
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={filteredListings}
          keyExtractor={(item, index) =>
            item.id?.toString() || index.toString()
          }
          renderItem={renderCard}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          contentContainerStyle={{ padding: 10 }}
        />
      )}
    </View>
  );
}

// --- Tabs ---
const Tab = createBottomTabNavigator();

export default function Vendor() {
  const { cartItems = [] } = useCart() || {};

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#036dd6",
        tabBarInactiveTintColor: "#888888",
        tabBarLabelStyle: { fontSize: 12 },
        tabBarStyle: { height: 60 },
      }}
    >
      <Tab.Screen
        name="VendorHome"
        component={VendorFeed}
        options={{
          tabBarLabel: "Vendor",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="storefront" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Orders"
        component={Orders}
        options={{
          tabBarLabel: "Orders",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Cart"
        component={Cart}
        options={{
          tabBarLabel: "Cart",
          tabBarBadge: cartItems.length > 0 ? cartItems.length : undefined,
          tabBarBadgeStyle: { backgroundColor: "#036dd6", color: "white" },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="HomeRedirect"
        component={Orders}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate("HomeTabs", { screen: "Home" });
          },
        })}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: {
    width: CARD_WIDTH,
    borderRadius: 10,
    marginBottom: 15,
    overflow: "hidden",
    borderWidth: 1,
  },
  image: { width: "100%", height: 120 },
  cartIcon: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
    padding: 5,
  },
  cardContent: { padding: 8 },
  title: { fontSize: 14, fontWeight: "bold" },
  price: { fontSize: 14, marginVertical: 2 },
  location: { fontSize: 12, marginBottom: 2 },
  description: { fontSize: 12 },
});
