// Vendor.jsx — FIXED: Fast tab load + no lag + back button stable
import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  BackHandler,
  useColorScheme,
  Animated,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { useVendorListing } from "../context/ListingContext";
import { useCart } from "../context/CartContext";
import Billboard from "../component/Billboard";

// Local polyfill for Array.findLastIndex (fixes back button crash on Hermes/Android)
if (!Array.prototype.findLastIndex) {
  Array.prototype.findLastIndex = function (predicate, thisArg) {
    let len = this.length;
    for (let i = len - 1; i >= 0; i--) {
      if (predicate.call(thisArg, this[i], i, this)) {
        return i;
      }
    }
    return -1;
  };
}

const { width } = Dimensions.get("window");
const CARD_WIDTH = width / 2 - 12;

const MemoizedCard = React.memo(({ item, isDark, isAdded, onToggleCart, navigation }) => {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: isDark ? "#2a2a2a" : "#fff",
          borderColor: isDark ? "#444" : "#eee",
        },
      ]}
      onPress={() => navigation.navigate("VendorListingDetails", { listing: item })}
    >
      <View>
        <Image source={{ uri: item.images?.[0] || "" }} style={styles.image} />
        <TouchableOpacity
          style={[
            styles.cartIcon,
            { backgroundColor: isAdded ? "#FFA500" : "rgba(0,0,0,0.6)" },
          ]}
          onPress={() => onToggleCart(item)}
        >
          <Ionicons
            name={isAdded ? "cart" : "cart-outline"}
            size={22}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.cardContent}>
        <Text style={[styles.title, { color: isDark ? "#fff" : "#111" }]} numberOfLines={1}>
          {item.title}
        </Text>

        <Text style={[styles.price, { color: isDark ? "#00ff7f" : "green" }]}>
          ₦{Number(item.price).toLocaleString()}
        </Text>

        <Text style={[styles.location, { color: isDark ? "#ccc" : "gray" }]} numberOfLines={1}>
          {item.location || item.category}
        </Text>

        <Text style={[styles.description, { color: isDark ? "#ccc" : "gray" }]} numberOfLines={2}>
          {item.description || "No description available"}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

export default function Vendor() {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const { vendorListings, addVendorListing } = useVendorListing();
  const { addToCart, removeFromCart, cartItems } = useCart();

  const flatListRef = useRef(null);
  const lastBackPress = useRef(0);
  const scrollY = useRef(new Animated.Value(0)).current;

  const billboardTranslateY = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [0, -80],
    extrapolate: "clamp",
  });

  // Controlled back handler
  useEffect(() => {
    const backAction = () => {
      if (navigation.canGoBack()) {
        navigation.goBack();
        return true;
      }

      const now = Date.now();
      if (now - lastBackPress.current < 2000) {
        BackHandler.exitApp();
        return true;
      }
      lastBackPress.current = now;
      Alert.alert("Press back again to exit");
      return true;
    };

    const subscription = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => subscription.remove();
  }, [navigation]);

  // Seed data only once (run when listings are empty)
  useEffect(() => {
    if (vendorListings.length === 0) {
      addVendorListing({
        id: "seed-1",
        title: "Modern 2-Bedroom Apartment",
        description: "Spacious, well-furnished flat in Lekki Phase 1.",
        images: ["https://picsum.photos/300/200"],
        price: 450000,
        location: "Lekki, Lagos",
        author: "vendor123",
      });
    }
  }, []); // Empty deps → runs only once on mount

  const [activeCategory, setActiveCategory] = useState("All");

  // Memoized filtered listings
  const filteredListings = useMemo(() => {
    if (activeCategory === "All") return vendorListings;
    return vendorListings.filter(
      (item) =>
        item.category?.toLowerCase() === activeCategory.toLowerCase() ||
        item.title?.toLowerCase().includes(activeCategory.toLowerCase())
    );
  }, [activeCategory, vendorListings]);

  // Handle category from global (your original logic)
  useEffect(() => {
    global.applyVendorCategory = (category) => {
      setActiveCategory(category);
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    };
    return () => {
      global.applyVendorCategory = null;
    };
  }, []);

  const handleToggleCart = useCallback(async (item) => {
    const isAdded = cartItems.some((x) => x.id === item.id);
    if (isAdded) {
      removeFromCart(item.id);
    } else {
      addToCart(item);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    }
  }, [cartItems, addToCart, removeFromCart]);

  const renderCard = useCallback(
    ({ item }) => {
      const isAdded = cartItems.some((x) => x.id === item.id);
      return (
        <MemoizedCard
          item={item}
          isDark={isDark}
          isAdded={isAdded}
          onToggleCart={handleToggleCart}
          navigation={navigation}
        />
      );
    },
    [isDark, cartItems, handleToggleCart, navigation]
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? "#1e1e1e" : "white" }]}>
      <Animated.FlatList
        ref={flatListRef}
        data={filteredListings}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderCard}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between", marginBottom: 10 }}
        contentContainerStyle={{
          paddingTop: 30,
          paddingHorizontal: 10,
          paddingBottom: 100,
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10} // ← Faster initial render
        windowSize={9} // ← Reduce offscreen rendering
        ListHeaderComponent={
          <Animated.View style={{ transform: [{ translateY: billboardTranslateY }] }}>
            <Billboard />
          </Animated.View>
        }
      />

      {/* FLOATING CREATE BUTTON */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("VendorListing")}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: {
    width: CARD_WIDTH,
    borderRadius: 12,
    marginBottom: 15,
    overflow: "hidden",
    borderWidth: 1,
  },
  image: { width: "100%", height: 140 },
  cartIcon: {
    position: "absolute",
    top: 8,
    right: 8,
    borderRadius: 20,
    padding: 6,
  },
  cardContent: { padding: 10 },
  title: { fontSize: 15, fontWeight: "bold" },
  price: { fontSize: 15, marginVertical: 2 },
  location: { fontSize: 13, marginBottom: 2 },
  description: { fontSize: 13 },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#017a6b",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
});