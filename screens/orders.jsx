import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  useColorScheme,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

export default function Orders() {
  const route = useRoute();
  const isDark = useColorScheme() === "dark";

  // Extract order info passed from Checkout
  const { orderInfo } = route.params || {};
  const { cartData = [], deliveryData = {} } = orderInfo || {};

  // 24-hour countdown (in seconds)
  const [timeLeft, setTimeLeft] = useState(24 * 60 * 60);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format HH:MM:SS
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: isDark ? "#1a1a1a" : "#f8f8f8" },
      ]}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <View style={styles.headerContainer}>
        <Text
          style={[styles.header, { color: isDark ? "#fff" : "#111" }]}
        >
          Order Summary
        </Text>
        <View style={styles.timerContainer}>
          <Ionicons
            name="time-outline"
            size={18}
            color={isDark ? "#00ff7f" : "#007bff"}
          />
          <Text
            style={[
              styles.timerText,
              { color: isDark ? "#00ff7f" : "#007bff" },
            ]}
          >
            {formatTime(timeLeft)}
          </Text>
        </View>
      </View>

      {/* Cart Items */}
      <View
        style={[
          styles.section,
          { backgroundColor: isDark ? "#2a2a2a" : "#fff" },
        ]}
      >
        <Text
          style={[styles.sectionTitle, { color: isDark ? "#fff" : "#111" }]}
        >
          Ordered Items
        </Text>

        {cartData.length > 0 ? (
          cartData.map((item, index) => (
            <View
              key={index}
              style={[
                styles.itemContainer,
                { borderColor: isDark ? "#444" : "#ddd" },
              ]}
            >
              <Image source={{ uri: item.images?.[0] }} style={styles.image} />
              <View style={styles.itemDetails}>
                <Text
                  style={[styles.itemTitle, { color: isDark ? "#fff" : "#111" }]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text
                  style={[styles.itemPrice, { color: isDark ? "#00ff7f" : "green" }]}
                >
                  ₦{Number(item.price).toLocaleString()}
                </Text>
                <Text
                  style={[styles.itemLocation, { color: isDark ? "#ccc" : "#555" }]}
                >
                  {item.location}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={{ color: isDark ? "#ccc" : "#777" }}>
            No items found in this order.
          </Text>
        )}
      </View>

      {/* Delivery Info */}
      <View
        style={[
          styles.section,
          { backgroundColor: isDark ? "#2a2a2a" : "#fff" },
        ]}
      >
        <Text
          style={[styles.sectionTitle, { color: isDark ? "#fff" : "#111" }]}
        >
          Delivery Information
        </Text>

        <View style={styles.infoRow}>
          <Text style={[styles.label, { color: isDark ? "#aaa" : "#666" }]}>
            Full Name:
          </Text>
          <Text style={[styles.value, { color: isDark ? "#fff" : "#111" }]}>
            {deliveryData.fullName || "N/A"}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={[styles.label, { color: isDark ? "#aaa" : "#666" }]}>
            Phone:
          </Text>
          <Text style={[styles.value, { color: isDark ? "#fff" : "#111" }]}>
            {deliveryData.phone || "N/A"}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={[styles.label, { color: isDark ? "#aaa" : "#666" }]}>
            State:
          </Text>
          <Text style={[styles.value, { color: isDark ? "#fff" : "#111" }]}>
            {deliveryData.state || "N/A"}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={[styles.label, { color: isDark ? "#aaa" : "#666" }]}>
            City / LGA:
          </Text>
          <Text style={[styles.value, { color: isDark ? "#fff" : "#111" }]}>
            {deliveryData.city || deliveryData.lga || "N/A"}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={[styles.label, { color: isDark ? "#aaa" : "#666" }]}>
            Address:
          </Text>
          <Text
            style={[
              styles.value,
              { color: isDark ? "#fff" : "#111", flex: 1 },
            ]}
            numberOfLines={2}
          >
            {deliveryData.address || "N/A"}
          </Text>
        </View>
      </View>

      {/* Note to Vendor */}
      <View
        style={[
          styles.section,
          { backgroundColor: isDark ? "#222" : "#f1f1f1" },
        ]}
      >
        <Text
          style={[
            styles.noteText,
            { color: isDark ? "#aaa" : "#333" },
          ]}
        >
          Dear vendor by accepting this order I agree to deliver within 24 hours or kindly reject order if not available, failure to adhere, the said fund will be reversed back to buyer.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timerText: {
    fontSize: 16,
    fontWeight: "600",
  },
  section: {
    marginHorizontal: 12,
    marginTop: 20,
    padding: 15,
    borderRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 10,
  },
  itemDetails: { flex: 1 },
  itemTitle: { fontSize: 14, fontWeight: "600" },
  itemPrice: { fontSize: 13, marginTop: 4 },
  itemLocation: { fontSize: 12, marginTop: 2 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: { fontSize: 14 },
  value: { fontSize: 14, fontWeight: "600" },
  noteText: {
    fontSize: 13,
    textAlign: "center",
    fontStyle: "italic",
  },
});
