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

// SVG icons
import BellIcon from "../assets/icons/svg/bell.svg";
import MenuIcon from "../assets/icons/svg/menu.svg";

// Menu item icons
import IdentityIcon from "../assets/icons/svg/identity.svg";
import SettingsIcon from "../assets/icons/svg/settings.svg";
import AdIcon from "../assets/icons/svg/ad.svg";
import HelpIcon from "../assets/icons/svg/help.svg";
import NewsIcon from "../assets/icons/svg/news.svg";

// Notification context
import { NotificationContext } from "../context/NotificationContext";
import Icon from "react-native-vector-icons/MaterialCommunityIcons"; // ✅ added for magnify

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
    "shops",
  ];

  const [selectedCategory, setSelectedCategory] = useState("All");
  const scrollRef = useRef();

  const menuWidth = Math.round(SCREEN_WIDTH * 0.85);
  const slideX = useRef(new Animated.Value(menuWidth)).current;

  const menuItems = [
    {
      id: "1",
      label: "Identity Verification",
      icon: IdentityIcon,
      screen: "IdentityVerification",
    },
    { id: "2", label: "Settings", icon: SettingsIcon, screen: "Settings" },
    { id: "3", label: "Ad Zone", icon: AdIcon, screen: "AdZone" },
    { id: "4", label: "Help / Support", icon: HelpIcon, screen: "HelpSupport" },
    {
      id: "5",
      label: "Announcement / News",
      icon: NewsIcon,
      screen: "Announcements",
    },
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
      cb && cb();
    });
  };

  const handleMenuPress = (item) => {
    closeMenu(() => {
      if (item.screen) navigation.navigate(item.screen);
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
      {/* Top Row */}
      <View
        style={[
          styles.topRow,
          {
            paddingTop: TOP_OFFSET - 15,
            backgroundColor: isDark ? "#1e1e1e" : "#ffffff",
          },
        ]}
      >
        <Text
          style={[
            styles.appTitle,
            { color: isDark ? "#fff" : "#036dd6" },
          ]}
        >
          RoomLink
        </Text>
        <View style={styles.rightIcons}>
          <TouchableOpacity
            onPress={() => navigation.navigate("Notification")}
            style={{ marginRight: 10 }}
          >
            <BellIcon width={24} height={24} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={openMenu}>
            <MenuIcon width={30} height={30} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Row */}
      <TouchableOpacity
        style={[
          styles.searchContainer,
          {
            backgroundColor: isDark ? "#2a2a2a" : "#fff",
            borderColor: isDark ? "#444" : "#e0e0e0",
          },
        ]}
        activeOpacity={0.9}
        onPress={() => navigation.navigate("Search")}
      >
        {/* ✅ exact magnify as in signup */}
        <Icon
          name="magnify"
          size={22}
          color="#036dd6"
          style={{ marginRight: 8 }}
        />
        <TextInput
          style={[styles.searchInput, { color: isDark ? "#fff" : "#111" }]}
          placeholder="Search listings..."
          placeholderTextColor={isDark ? "#888" : "#666"}
          editable={false}
        />
      </TouchableOpacity>

      {/* Categories Row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[
          styles.secondHeaderContainer,
          { backgroundColor: isDark ? "#1e1e1e" : "#fff" },
        ]}
        contentContainerStyle={{ paddingHorizontal: 10 }}
        ref={scrollRef}
      >
        {categories.map((cat, idx) => {
          const isActive = selectedCategory === cat;
          return (
            <TouchableOpacity
              key={cat + idx}
              onPress={() => handleCategoryPress(cat, idx)}
              style={styles.categoryButton}
            >
              <Text
                style={{
                  color: isActive
                    ? "#036dd6"
                    : isDark
                    ? "#fff"
                    : "#000",
                  fontSize: 14,
                  fontWeight: "400",
                }}
              >
                {cat}
              </Text>
              {isActive && (
                <View
                  style={[
                    styles.activeUnderline,
                    { backgroundColor: "#036dd6" },
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Right-side dropdown drawer */}
      {menuVisible && (
        <Modal
          transparent
          visible={menuVisible}
          animationType="none"
          statusBarTranslucent
        >
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
              renderItem={({ item }) => {
                const IconComponent = item.icon;
                return (
                  <TouchableOpacity
                    style={[
                      styles.card,
                      {
                        backgroundColor: isDark ? "#2a2a2a" : "#fff",
                        borderColor: isDark ? "#444" : "#E5E7EB",
                      },
                    ]}
                    onPress={() => handleMenuPress(item)}
                  >
                    <IconComponent
                      width={24}
                      height={24}
                      fill={isDark ? "#ccc" : "#9CA3AF"}
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
                );
              }}
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
    paddingHorizontal: 4,
    paddingBottom: 10,
  },
  appTitle: { fontSize: 20, fontWeight: "700" },
  rightIcons: { flexDirection: "row", alignItems: "center" },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 12,
    marginBottom: 15,
    paddingVertical: 1,
    paddingHorizontal: 14,
    borderRadius: 30,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOpacity: 0.8,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 15 },

  secondHeaderContainer: { flexDirection: "row", marginBottom: 10 },
  categoryButton: { marginRight: 20, alignItems: "center" },
  activeUnderline: { marginTop: 4, height: 2, width: "100%", borderRadius: 1 },

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

  badge: {
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
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
});
