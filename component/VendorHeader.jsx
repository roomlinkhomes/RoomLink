// components/VendorHeader.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useTheme, useRoute } from "@react-navigation/native";
import { TextInput } from "react-native-paper";

export default function VendorHeader({ onCategorySelect, selectedCategory: externalSelected }) {
  const navigation = useNavigation();
  const route = useRoute(); // 👈 detect current route
  const { dark } = useTheme();
  const isDark = !!dark;
  const { width: windowWidth } = useWindowDimensions();

  // ✅ hide header on Cart or Orders screen
  const hiddenRoutes = ["Cart", "Orders"];
  if (hiddenRoutes.some((name) => route.name?.toLowerCase().includes(name.toLowerCase()))) {
    return null;
  }

  const groups = [
    {
      group: "Home & Room Essentials",
      items: [
        "Bed",
        "Bed frame",
        "Wardrobes",
        "Chair/desk",
        "Curtains",
        "Bulb/Chandelier",
        "Rug/Carpet",
        "Fridge",
        "Gas cylinder",
        "Blender/Mortar&Pestle",
        "Paints",
      ],
    },
    {
      group: "Maintenance & Repairs",
      items: [
        "Electricians",
        "Plumbers",
        "Carpenters",
        "House cleaners",
        "Laundry pickup",
        "Appliances repair",
        "Fumigation",
        "Painters",
      ],
    },
    {
      group: "Moving & Logistics",
      items: ["Delivery van for packing", "Delivery guy"],
    },
    {
      group: "Consumables",
      items: ["Cooking gas refills", "Food stuffs", "Toiletries & cleaning supply"],
    },
    {
      group: "Lifestyle",
      items: ["TV", "Game/pads", "Gym equipment", "Outdoor chairs", "Phone", "Sound systems"],
    },
  ];

  const items = ["All", ...groups.flatMap((g) => g.items)];
  const [selected, setSelected] = useState(externalSelected || "All");
  const scrollRef = useRef(null);
  const pillLayouts = useRef({});
  const CONTENT_PADDING = 10;

  useEffect(() => {
    if (externalSelected && externalSelected !== selected) {
      setSelected(externalSelected);
      requestAnimationFrame(() => scrollToCategory(externalSelected));
    }
  }, [externalSelected]);

  const scrollToCategory = (cat) => {
    if (!scrollRef.current) return;
    const layout = pillLayouts.current[cat];
    if (!layout) return;

    let desiredX = Math.max(0, layout.x - CONTENT_PADDING);
    scrollRef.current.scrollTo({ x: desiredX, animated: true });
  };

  const performSelect = (cat) => {
    setSelected(cat);

    if (typeof onCategorySelect === "function") {
      onCategorySelect(cat);
    }

    if (typeof global?.applyVendorCategory === "function") {
      try {
        global.applyVendorCategory(cat);
      } catch (err) {
        console.warn("applyVendorCategory failed:", err);
      }
    }

    navigation.setParams?.({ category: cat });
    if (typeof global?.applyVendorCategory !== "function" && typeof onCategorySelect !== "function") {
      navigation.navigate("VendorSearch", { category: cat });
    }

    requestAnimationFrame(() => scrollToCategory(cat));
  };

  return (
    <View style={styles.container}>
      {/* Line 1: Title */}
      <Text style={[styles.headerTitle, { color: isDark ? "#00ff7f" : "#017a6b" }]}>
        RoomLink Market
      </Text>

      {/* Line 2: Top row */}
      <View style={styles.topRow}>
        <TouchableOpacity
          style={[styles.pillButton, { backgroundColor: "#00796B" }]}
          onPress={() => navigation.navigate("VendorListing")}
        >
          <Ionicons name="add-circle" size={20} color="white" />
          <Text style={styles.pillText}>Create</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.searchPill, { backgroundColor: isDark ? "#2a2a2a" : "#f0f0f0" }]}
          onPress={() => navigation.navigate("VendorSearch", { category: selected })}
          activeOpacity={0.8}
        >
          <View style={styles.magnifyWrapper}>
            <TextInput.Icon icon="magnify" color="#036dd6" size={22} />
          </View>
          <Text style={[styles.searchPlaceholder, { color: isDark ? "#aaa" : "gray" }]}>
            Search vendor posts...
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: isDark ? "#2a2a2a" : "#f5f5f5" }]}
          onPress={() => navigation.navigate("VendorUserListing")}
        >
          <Ionicons name="list-outline" size={22} color={isDark ? "#fff" : "#1A237E"} />
        </TouchableOpacity>
      </View>

      {/* Line 3: Categories row */}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.categoriesRow, { paddingHorizontal: CONTENT_PADDING }]}
      >
        {items.map((cat) => {
          const active = selected === cat;
          return (
            <TouchableOpacity
              key={cat}
              onPress={() => performSelect(cat)}
              onLayout={(e) => {
                const { x, width } = e.nativeEvent.layout;
                pillLayouts.current[cat] = { x, width };
              }}
              style={styles.categoryWrapper}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.categoryText,
                  {
                    color: active ? (isDark ? "#00ff7f" : "#017a6b") : isDark ? "#fff" : "#444",
                    borderBottomWidth: active ? 3 : 0,
                    borderBottomColor: active ? (isDark ? "#00ff7f" : "#017a6b") : "transparent",
                  },
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%" },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginVertical: 8,
    letterSpacing: 0.5,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    gap: 10,
    marginVertical: 6,
  },
  pillButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 25,
    minWidth: 80,
    justifyContent: "center",
  },
  pillText: { color: "white", fontWeight: "bold", marginLeft: 6 },
  searchPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 50,
    marginHorizontal: 1,
  },
  magnifyWrapper: {
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
    marginLeft: 5,
  },
  searchPlaceholder: { marginLeft: 2, fontSize: 14 },
  iconButton: {
    padding: 8,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  categoriesRow: { paddingVertical: 8, alignItems: "center" },
  categoryWrapper: { marginRight: 16 },
  categoryText: { fontSize: 13, fontWeight: "600", paddingBottom: 6 },
});
