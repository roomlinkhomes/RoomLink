// components/VendorHeader.jsx — Final: Syntax fixed + even spacing + search black border + gap 12
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useTheme, useRoute } from "@react-navigation/native";
import { useCart } from "../context/CartContext";

export default function VendorHeader({ onCategorySelect, selectedCategory: externalSelected }) {
  const navigation = useNavigation();
  const route = useRoute();
  const { dark } = useTheme();
  const isDark = dark === true;
  const { cartCount = 0 } = useCart();

  const hiddenRoutes = ["Cart", "Orders"];
  if (hiddenRoutes.some((name) => route.name?.toLowerCase().includes(name.toLowerCase()))) {
    return null;
  }

  const groups = [
    {
      group: "Home & Room Essentials",
      items: [
        "Bed", "Bed frame", "Wardrobes", "Chair/desk", "Curtains",
        "Bulb/Chandelier", "Rug/Carpet", "Fridge", "Gas cylinder",
        "Blender/Mortar&Pestle", "Paints", "Mattress", "Bed sheets",
        "Pillows", "Duvet/Comforter", "Mosquito net", "Fan",
        "Air conditioner", "Standing fan", "Mirror", "Dressing table",
        "Sofa", "Center table", "TV stand", "Wall clock",
        "Throw pillows", "Table lamp", "Ceiling fan", "Inverter",
        "Generator", "Washing machine", "Microwave", "Electric kettle",
        "Iron/Ironing board", "Dining table & chairs", "Shoe rack", "Hangers",
      ],
    },
    {
      group: "Maintenance & Repairs",
      items: [
        "Electricians", "Plumbers", "Carpenters", "House cleaners",
        "Laundry pickup", "Appliances repair", "Fumigation", "Painters",
        "Wiring/Rewiring", "Generator repair", "Inverter installation",
        "Solar panel installation", "CCTV installation", "DSTV/GOTV setup",
        "Borehole drilling", "Water tank installation", "Pumping machine repair",
        "Leak fixing", "Bathroom/Kitchen plumbing", "Tiling/Flooring",
        "POP ceiling", "Door installation", "Window fixing",
        "Roofing repair", "Aluminum windows/doors", "Deep cleaning",
        "Post-construction cleaning", "Tank cleaning", "Mosquito netting",
        "Rodent control", "Interior painting", "Exterior painting",
        "Screeding", "Wall design/Texture painting", "Fridge/AC repair",
        "Washing machine repair", "TV repair", "Phone repair",
        "Laptop repair", "Fan repair", "Furniture repair", "Locksmith",
        "Welder", "Gate automation",
      ],
    },
    {
      group: "Moving & Logistics",
      items: [
        "Delivery van for packing", "Delivery guy", "House moving (small load)",
        "House moving (full apartment)", "Office relocation", "Furniture moving",
        "Packing & unpacking service", "Truck rental (with driver)", "Pickup van rental",
        "Bus rental (mini)", "Hiace bus rental", "Bike delivery (within city)",
        "Car delivery (inter-state)", "Food/grocery delivery", "Parcel delivery",
        "Document delivery", "Container haulage", "Heavy equipment transport",
        "Warehouse storage (short-term)", "Loading & offloading labor",
        "Lagos to Abuja moving", "Lagos to Port Harcourt moving",
        "Inter-state delivery", "Airport pickup/drop-off",
      ],
    },
    {
      group: "Consumables",
      items: [
        "Cooking gas refills", "Food stuffs", "Toiletries & cleaning supply",
        "Rice (bag)", "Beans", "Garri", "Yam", "Plantain",
        "Palm oil", "Vegetable oil", "Groundnut oil", "Spaghetti",
        "Indomie", "Semovita", "Pounded yam", "Tomatoes", "Pepper",
        "Onions", "Seasonings/Maggi", "Bottled water (pack)", "Soft drinks",
        "Malt", "Energy drinks", "Pure water (sachet)", "Fruit juice",
        "Toilet soap", "Bath soap", "Detergent", "Bleach",
        "Body cream/Lotion", "Shampoo", "Toothpaste", "Sanitary pads",
        "Dishwashing liquid", "Disinfectant", "Insecticide", "Air freshener",
        "Sponge/Scrubber", "Broom", "Mop", "Diapers", "Baby food",
        "Baby wipes", "Multivitamins",
      ],
    },
    {
      group: "Lifestyle",
      items: [
        "TV", "Game/pads", "Gym equipment", "Outdoor chairs", "Phone", "Sound systems",
        "Home theater system", "Bluetooth speaker", "Headphones/Earbuds",
        "Smart watch", "Fitness tracker", "Projector", "Gaming console",
        "PlayStation", "Xbox", "Nintendo Switch", "Drone", "Camera",
        "Ring light", "Tripod", "Wireless charger", "Power bank",
        "Yoga mat", "Dumbbells", "Treadmill", "Exercise bike",
        "Massage gun", "Air purifier", "Humidifier", "Aromatherapy diffuser",
        "Electric scooter", "Bicycle", "Camping tent", "Portable grill", "Cooler box",
        "Wall art/Frames", "Decorative lights", "Laptop stand",
      ],
    },
    {
      group: "Phones",
      items: [
        "Samsung Galaxy S10+", "Samsung Galaxy Note 10+",
        "Samsung Galaxy S20", "Samsung Galaxy S20+", "Samsung Galaxy S20 Ultra",
        "Samsung Galaxy Note 20", "Samsung Galaxy Note 20 Ultra",
        "Samsung Galaxy S21", "Samsung Galaxy S21+", "Samsung Galaxy S21 Ultra",
        "Samsung Galaxy S22", "Samsung Galaxy S22+", "Samsung Galaxy S22 Ultra",
        "Samsung Galaxy S23", "Samsung Galaxy S23+", "Samsung Galaxy S23 Ultra",
        "Samsung Galaxy S24", "Samsung Galaxy S24+", "Samsung Galaxy S24 Ultra",
        "Samsung Galaxy S25", "Samsung Galaxy S25+", "Samsung Galaxy S25 Ultra",
        "Samsung Galaxy Fold", "Samsung Galaxy Z Fold 2", "Samsung Galaxy Z Fold 3",
        "Samsung Galaxy Z Fold 4", "Samsung Galaxy Z Fold 5", "Samsung Galaxy Z Fold 6",
        "Samsung Galaxy Z Fold 7", "Samsung Galaxy Z Flip", "Samsung Galaxy Z Flip 3",
        "Samsung Galaxy Z Flip 4", "Samsung Galaxy Z Flip 5", "Samsung Galaxy Z Flip 6",
        "Samsung Galaxy Z Flip 7",
        "iPhone XS", "iPhone XS Max", "iPhone XR",
        "iPhone 11", "iPhone 11 Pro", "iPhone 11 Pro Max",
        "iPhone 12", "iPhone 12 Mini", "iPhone 12 Pro", "iPhone 12 Pro Max",
        "iPhone 13", "iPhone 13 Mini", "iPhone 13 Pro", "iPhone 13 Pro Max",
        "iPhone 14", "iPhone 14 Plus", "iPhone 14 Pro", "iPhone 14 Pro Max",
        "iPhone 15", "iPhone 15 Plus", "iPhone 15 Pro", "iPhone 15 Pro Max",
        "iPhone 16", "iPhone 16 Plus", "iPhone 16 Pro", "iPhone 16 Pro Max",
        "iPhone 17", "iPhone 17 Plus", "iPhone 17 Pro", "iPhone 17 Pro Max",
        "iPhone 17 Air",
        "Tecno Phantom X", "Tecno Phantom X2", "Tecno Phantom V Fold",
        "Tecno Camon 30 Premier", "Tecno Camon 40 Series",
        "Oppo Find X8", "Oppo Find X8 Pro", "Oppo Reno 12 Series",
        "Vivo X100 Series", "Vivo X Fold 3",
        "Itel S24", "Itel P55 Series",
        "Xiaomi 14", "Xiaomi 14 Ultra", "Xiaomi 15",
        "Redmi Note 13 Pro+", "Redmi Note 14 Pro+",
        "Poco F6", "Poco X7 Pro",
      ],
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
    if (typeof onCategorySelect === "function") onCategorySelect(cat);
    if (typeof global?.applyVendorCategory === "function") {
      try { global.applyVendorCategory(cat); } catch (err) { console.warn("applyVendorCategory failed:", err); }
    }
    navigation.setParams?.({ category: cat });
    if (typeof global?.applyVendorCategory !== "function" && typeof onCategorySelect !== "function") {
      navigation.navigate("VendorSearch", { category: cat });
    }
    requestAnimationFrame(() => scrollToCategory(cat));
  };

  const dynamicStyles = {
    containerBg: { backgroundColor: isDark ? "#1e1e1e" : "#fff" },
    iconColor: isDark ? "#00ff7f" : "#017a6b",
    pillBg: { backgroundColor: isDark ? "#2a2a2a" : "#f0f0f0" },
    pillBorderColor: isDark ? "#ffffff" : "#000000",
    searchBg: { backgroundColor: isDark ? "#2a2a2a" : "#f0f0f0" },
    searchIconColor: isDark ? "#aaa" : "#444",
    categoryActiveColor: isDark ? "#00ff7f" : "#017a6b",
    categoryInactiveColor: isDark ? "#fff" : "#444",
    pillLabelColor: isDark ? "#ccc" : "#555",
  };

  return (
    <View style={[styles.container, dynamicStyles.containerBg]}>
      {/* Top Row */}
      <View style={styles.topRow}>
        <View style={styles.actionsContainer}>
          {/* Orders */}
          <TouchableOpacity
            style={[
              styles.iconPill,
              dynamicStyles.pillBg,
              { borderColor: dynamicStyles.pillBorderColor },
            ]}
            onPress={() => navigation.navigate("Orders")}
          >
            <Ionicons name="receipt-outline" size={20} color={dynamicStyles.iconColor} />
            <Text style={[styles.pillLabel, { color: dynamicStyles.pillLabelColor }]}>Orders</Text>
          </TouchableOpacity>

          {/* Cart WITH BADGE */}
          <TouchableOpacity
            style={[
              styles.iconPill,
              dynamicStyles.pillBg,
              { borderColor: dynamicStyles.pillBorderColor },
            ]}
            onPress={() => navigation.navigate("Cart")}
          >
            <View style={styles.cartIconContainer}>
              <Ionicons name="cart-outline" size={20} color={dynamicStyles.iconColor} />
              {cartCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {cartCount > 99 ? "99+" : cartCount}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.pillLabel, { color: dynamicStyles.pillLabelColor }]}>Cart</Text>
          </TouchableOpacity>

          {/* Sales */}
          <TouchableOpacity
            style={[
              styles.iconPill,
              dynamicStyles.pillBg,
              { borderColor: dynamicStyles.pillBorderColor },
            ]}
            onPress={() => navigation.navigate("VendorSales")}
          >
            <Ionicons name="trending-up-outline" size={20} color={dynamicStyles.iconColor} />
            <Text style={[styles.pillLabel, { color: dynamicStyles.pillLabelColor }]}>Sales</Text>
          </TouchableOpacity>

          {/* Search Icon — black border */}
          <TouchableOpacity
            style={[
              styles.searchIconBtn,
              dynamicStyles.searchBg,
              { borderColor: "#000000" },
            ]}
            onPress={() => navigation.navigate("VendorSearch", { category: selected })}
          >
            <Ionicons name="search" size={24} color={dynamicStyles.searchIconColor} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Categories ScrollView */}
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
                    color: active ? dynamicStyles.categoryActiveColor : dynamicStyles.categoryInactiveColor,
                    borderBottomWidth: active ? 3 : 0,
                    borderBottomColor: active ? dynamicStyles.categoryActiveColor : "transparent",
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
  container: {
    width: "100%",
    paddingTop: 30,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  iconPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  cartIconContainer: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    right: -8,
    top: -8,
    backgroundColor: "red",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  pillLabel: {
    marginLeft: 5,
    fontSize: 12,
    fontWeight: "600",
  },
  searchIconBtn: {
    padding: 6,
    borderRadius: 19,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 2,
  },
  categoriesRow: {
    paddingVertical: 8,
    alignItems: "center",
  },
  categoryWrapper: {
    marginRight: 10, // ← Gap reduced to 12
    paddingBottom: 4,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "700",
    paddingBottom: 8,
    paddingHorizontal: 8,
  },
});