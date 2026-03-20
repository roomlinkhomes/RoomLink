// components/HomeTopHeader.jsx
import React, { useRef, useState, useContext } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  Text,
  Modal,
  Dimensions,
  FlatList,
  Animated,
  ScrollView,
  TextInput,
  useColorScheme,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { NotificationContext } from "../context/NotificationContext";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const TOP_OFFSET =
  Platform.OS === "android" ? StatusBar.currentHeight || 35 : 70;

export default function HomeTopHeader() {
  const navigation = useNavigation();
  const { notifications } = useContext(NotificationContext);
  const [menuVisible, setMenuVisible] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const categories = [
    "All",
    "1 Bedroom flat",
    "2 Bedroom flat",
    "3 Bedroom flat",
    "1 Room apartment",
    "Self-Contain",
    "Land",
    "Bungalow",
    "Studio",
    "Estate",
    "Duplex",
    "Shops",
    "1 plot",
    "2 plots",
    "3 plots",
    "4 plots",
    "5 plots",
    "6 plots",
    "7 plots",
    "10 plots of land",
    "suite",
  ];

  const [selectedCategory, setSelectedCategory] = useState("All");
  const scrollRef = useRef();
  const menuWidth = Math.round(SCREEN_WIDTH * 0.85);
  const slideX = useRef(new Animated.Value(menuWidth)).current;

  const menuItems = [
    { id: "1", label: "Identity Verification", icon: "shield-checkmark-outline", screen: "IdentityVerification" },
    { id: "2", label: "Settings", icon: "settings-outline", screen: "Settings" },
    { id: "3", label: "Post on billboard", icon: "megaphone-outline", screen: "AdsZone" },
    { id: "4", label: "Wallet", icon: "wallet-outline", screen: "Wallet" },
    { id: "8", label: "Refund / Cancellation", icon: "arrow-undo-outline", screen: "RefundScreen" }, // ← FIXED: valid icon
    { id: "5", label: "Host on RoomLink", icon: "business-outline", screen: "BecomeVendor" },
    { id: "6", label: "Help / Support", icon: "help-circle-outline", screen: "HelpSupport" },
    { id: "7", label: "Announcement / News", icon: "newspaper-outline", screen: "Announcements" },
  ];

  const openMenu = () => {
    setMenuVisible(true);
    Animated.timing(slideX, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  const closeMenu = (cb) => {
    Animated.timing(slideX, {
      toValue: menuWidth,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setMenuVisible(false);
      if (cb) cb();
    });
  };

  const handleMenuPress = (item) => {
    closeMenu(() => {
      if (item.screen) {
        navigation.navigate(item.screen);
      }
    });
  };

  const handleCategoryPress = (cat, index) => {
    setSelectedCategory(cat);
    const ITEM_WIDTH = 100;
    scrollRef.current?.scrollTo({ x: index * ITEM_WIDTH, animated: true });
    if (typeof global?.applyCategory === "function") {
      try {
        global.applyCategory(cat);
      } catch (err) {
        console.warn(err);
      }
    } else {
      navigation.navigate("Home", { category: cat });
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      {/* Top Header */}
      <View
        style={[
          styles.topRow,
          {
            paddingTop: TOP_OFFSET - 25,
            paddingBottom: 6,
            backgroundColor: isDark ? "#1e1e1e" : "#ffffff",
          },
        ]}
      >
        {/* Notification Icon */}
        <View style={{ position: "relative" }}>
          <TouchableOpacity
            onPress={() => navigation.navigate("Notification")}
            activeOpacity={0.8}
          >
            <Ionicons
              name={unreadCount > 0 ? "notifications" : "notifications-outline"}
              size={28}
              color={unreadCount > 0 ? "#017a6b" : isDark ? "#fff" : "#666"}
            />
          </TouchableOpacity>
          {unreadCount > 0 && (
            <View
              style={{
                position: "absolute",
                top: -5,
                right: -5,
                minWidth: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: "red",
                justifyContent: "center",
                alignItems: "center",
                paddingHorizontal: 3,
                zIndex: 99,
                elevation: 5,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 10, fontWeight: "bold" }}>
                {unreadCount}
              </Text>
            </View>
          )}
        </View>

        {/* Center Search Box – border now #000 */}
        <TouchableOpacity
          style={[
            styles.inlineSearchContainer,
            {
              backgroundColor: isDark ? "#2a2a2a" : "#f9fafb",
              borderColor: "#000",
              borderWidth: 2,
            },
          ]}
          activeOpacity={0.88}
          onPress={() => navigation.navigate("Search")}
        >
          <Ionicons name="search-outline" size={22} color={isDark ? "#aaa" : "#6b7280"} style={{ marginRight: 6 }} />
          <TextInput
            style={[
              styles.inlineSearchInput,
              { color: isDark ? "#e5e7eb" : "#111827" },
            ]}
            placeholder="Search rooms, hotels..."
            placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
            editable={false}
          />
        </TouchableOpacity>

        {/* Menu Icon */}
        <TouchableOpacity onPress={openMenu}>
          <Ionicons name="menu-outline" size={30} color={isDark ? "#fff" : "#666"} />
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.secondHeaderContainer, { backgroundColor: isDark ? "#1e1e1e" : "#fff" }]}
        contentContainerStyle={{ paddingLeft: 0, paddingRight: 0 }}
        ref={scrollRef}
      >
        {categories.map((cat, idx) => {
          const isActive = selectedCategory === cat;
          return (
            <TouchableOpacity
              key={cat + idx}
              onPress={() => handleCategoryPress(cat, idx)}
              activeOpacity={0.8}
              style={[
                styles.categoryButton,
                {
                  marginLeft: idx === 0 ? 0 : 6,
                  marginRight: idx === categories.length - 1 ? 0 : 6,
                  backgroundColor: isActive
                    ? "rgba(3, 109, 214, 0.25)"
                    : isDark
                    ? "#2a2a2a"
                    : "#f3f4f6",
                  borderColor: isActive ? "#017a6b" : isDark ? "#444" : "#ddd",
                  elevation: isActive ? 2 : 0,
                  shadowColor: "#000",
                  shadowOpacity: isActive ? 0.15 : 0,
                  shadowOffset: { width: 0, height: 2 },
                  shadowRadius: 3,
                },
              ]}
            >
              <Text
                style={{
                  color: isActive
                    ? isDark
                      ? "#fff"
                      : "#00ff7f"
                    : isDark
                    ? "#fff"
                    : "#111",
                  fontSize: 14,
                  fontWeight: isActive ? "600" : "400",
                }}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Right-side Drawer */}
      {menuVisible && (
        <Modal transparent visible={menuVisible} animationType="none" statusBarTranslucent>
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={() => closeMenu()}
          />
          <Animated.View
            style={[
              styles.menuContainer,
              {
                width: menuWidth,
                transform: [{ translateX: slideX }],
                backgroundColor: isDark ? "#1e1e1e" : "#fff",
              },
            ]}
          >
            <FlatList
              data={menuItems}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.card,
                    {
                      backgroundColor: isDark ? "#2a2a2a" : "#fff",
                      borderColor: isDark ? "#444" : "#E5E7EB",
                    },
                  ]}
                  onPress={() => handleMenuPress(item)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={item.icon}
                    size={24}
                    color={isDark ? "#ccc" : "#9CA3AF"}
                    style={{ marginRight: 12 }}
                  />
                  <Text
                    style={[
                      styles.cardText,
                      { color: isDark ? "#fff" : "#111827" },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </Animated.View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 6,
  },
  inlineSearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 2.65,
    marginHorizontal: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 1000,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 3,
  },
  inlineSearchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  secondHeaderContainer: {
    flexDirection: "row",
    marginBottom: 10,
  },
  categoryButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  menuContainer: {
    position: "absolute",
    top: TOP_OFFSET,
    bottom: 0,
    right: 0,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    paddingTop: 12,
  },
  listContent: { paddingHorizontal: 14, paddingBottom: 24 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardText: { fontSize: 16, fontWeight: "600" },
});