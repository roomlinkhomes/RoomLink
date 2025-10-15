// screens/OrderSummary.jsx
import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  useColorScheme,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";

export default function OrderSummary() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const navigation = useNavigation();
  const route = useRoute();

  // ✅ Receive data passed from Checkout (and Cart)
  const { items = [], address = "" } = route.params || {};

  // ✅ Calculate totals
  const { itemTotal, deliveryFee, serviceFee, total } = useMemo(() => {
    const itemTotal = items.reduce((sum, item) => sum + (item.price || 0), 0);
    const deliveryFee = items.reduce(
      (sum, item) => sum + (item.deliveryFee || 0),
      0
    );
    const serviceFee = parseFloat((itemTotal * 0.02).toFixed(2));
    const total = itemTotal + deliveryFee + serviceFee;
    return { itemTotal, deliveryFee, serviceFee, total };
  }, [items]);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? "#121212" : "#fff" },
      ]}
    >
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <Text
          style={[
            styles.heading,
            { color: isDarkMode ? "#fff" : "#000" },
          ]}
        >
          Order Summary
        </Text>

        {/* 🛍 Ordered Items */}
        {items.length > 0 ? (
          items.map((item, index) => (
            <View
              key={index}
              style={[
                styles.itemCard,
                {
                  backgroundColor: isDarkMode ? "#1e1e1e" : "#f7f7f7",
                  borderColor: isDarkMode ? "#333" : "#ddd",
                },
              ]}
            >
              {item.image && (
                <Image source={{ uri: item.image }} style={styles.image} />
              )}
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.itemName,
                    { color: isDarkMode ? "#fff" : "#000" },
                  ]}
                >
                  {item.name}
                </Text>
                <Text style={{ color: "#888", marginTop: 2 }}>
                  ₦{item.price?.toLocaleString()}
                </Text>
                {item.deliveryFee && (
                  <Text style={{ color: "#888", marginTop: 2 }}>
                    Delivery Fee: ₦{item.deliveryFee?.toLocaleString()}
                  </Text>
                )}
              </View>
            </View>
          ))
        ) : (
          <Text style={{ color: "#888", textAlign: "center", marginTop: 20 }}>
            No items found
          </Text>
        )}

        {/* 📦 Delivery Address */}
        <View
          style={[
            styles.section,
            {
              backgroundColor: isDarkMode ? "#1e1e1e" : "#f7f7f7",
              borderColor: isDarkMode ? "#333" : "#ddd",
            },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              { color: isDarkMode ? "#fff" : "#000" },
            ]}
          >
            Delivery Address
          </Text>
          <Text style={{ color: "#888", marginTop: 5 }}>
            {address || "No address provided"}
          </Text>
        </View>

        {/* 💰 Payment Details */}
        <View
          style={[
            styles.section,
            {
              backgroundColor: isDarkMode ? "#1e1e1e" : "#f7f7f7",
              borderColor: isDarkMode ? "#333" : "#ddd",
            },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              { color: isDarkMode ? "#fff" : "#000" },
            ]}
          >
            Payment Details
          </Text>

          <View style={styles.row}>
            <Text style={styles.label}>Item Total</Text>
            <Text style={styles.value}>₦{itemTotal.toLocaleString()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Delivery Fee</Text>
            <Text style={styles.value}>₦{deliveryFee.toLocaleString()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Service Fee (2%)</Text>
            <Text style={styles.value}>₦{serviceFee.toLocaleString()}</Text>
          </View>
          <View style={styles.rowTotal}>
            <Text
              style={[
                styles.totalLabel,
                { color: isDarkMode ? "#fff" : "#000" },
              ]}
            >
              Total
            </Text>
            <Text style={styles.totalValue}>₦{total.toLocaleString()}</Text>
          </View>
        </View>
      </ScrollView>

      {/* ✅ Proceed Button */}
      <TouchableOpacity
        style={styles.payButton}
        onPress={() =>
          navigation.navigate("FlutterwavePayment", {
            total,
            items,
            address,
          })
        }
      >
        <Text style={styles.payText}>Proceed to Payment</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  heading: {
    fontSize: 22,
    fontWeight: "700",
    marginVertical: 10,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 10,
  },
  section: {
    marginTop: 15,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
  },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 8 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 5,
  },
  label: { color: "#888" },
  value: { fontWeight: "600", color: "#888" },
  rowTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    borderTopWidth: 1,
    borderColor: "#555",
    paddingTop: 10,
  },
  totalLabel: { fontSize: 18, fontWeight: "700" },
  totalValue: { fontSize: 18, fontWeight: "700", color: "#2ecc71" },
  payButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#2ecc71",
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: "center",
  },
  payText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
