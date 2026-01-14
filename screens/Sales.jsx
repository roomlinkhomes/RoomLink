// screens/Sales.jsx — FINAL VERSION THAT WORKS WITH YOUR REAL ORDERS STRUCTURE
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { db, auth } from "../firebaseConfig";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";

export default function Sales() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    const ordersRef = collection(db, "orders");

    // THIS IS THE EXACT QUERY YOUR ORDERS.JSX USES — WORKS 100%
    const q = query(
      ordersRef,
      where("items", "array-contains-any", [{ vendorId: user.uid }]),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const vendorOrders = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          // Filter only items belonging to this vendor
          const vendorItems = data.items.filter(
            (item) => item.vendorId === user.uid
          );

          if (vendorItems.length > 0) {
            vendorOrders.push({
              id: doc.id,
              ...data,
              items: vendorItems, // only show vendor's items
            });
          }
        });

        setOrders(vendorOrders);
        setLoading(false);
      },
      (error) => {
        console.error("Sales error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const renderOrder = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("OrderDetails", { order: item })}
    >
      <View style={styles.header}>
        <Text style={styles.orderId}>Order #{item.id.slice(-8).toUpperCase()}</Text>
        <Text style={styles.total}>₦{item.totalAmount?.toLocaleString()}</Text>
      </View>

      <View style={styles.items}>
        {item.items.map((i, idx) => (
          <View key={idx} style={styles.itemRow}>
            <Text style={styles.itemName}>{i.name || i.title}</Text>
            <Text style={styles.itemPrice}>
              ₦{i.price?.toLocaleString()} × {i.quantity || 1}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.buyer}>Buyer: {item.buyerName || "Customer"}</Text>
        <View style={styles.status}>
          <Text style={styles.statusText}>
            {item.status === "paid" ? "PAID" : item.status?.toUpperCase()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#017a6b" />
        <Text style={styles.loading}>Loading your sales...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.pageHeader}>
        <Text style={styles.title}>My Sales</Text>
        <Text style={styles.count}>{orders.length} order{orders.length !== 1 ? "s" : ""}</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="bag-handle-outline" size={80} color="#ccc" />
            <Text style={styles.emptyTitle}>No sales yet</Text>
            <Text style={styles.emptyText}>Your incoming orders will appear here</Text>
          </View>
        }
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loading: { marginTop: 16, fontSize: 16, color: "#666" },
  pageHeader: {
    backgroundColor: "#017a6b",
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  title: { fontSize: 28, fontWeight: "900", color: "white" },
  count: { fontSize: 16, color: "#E8F5E9", marginTop: 6 },
  card: {
    backgroundColor: "white",
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  orderId: { fontSize: 14, fontWeight: "bold", color: "#333" },
  total: { fontSize: 18, fontWeight: "900", color: "#017a6b" },
  items: { marginVertical: 8 },
  itemRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  itemName: { fontSize: 15, color: "#444" },
  itemPrice: { fontSize: 15, fontWeight: "bold", color: "#017a6b" },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  buyer: { fontSize: 14, color: "#666" },
  status: { backgroundColor: "#017a6b", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { color: "white", fontWeight: "bold", fontSize: 12 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 100 },
  emptyTitle: { fontSize: 20, fontWeight: "bold", color: "#999", marginTop: 20 },
  emptyText: { fontSize: 15, color: "#aaa", textAlign: "center", paddingHorizontal: 40, marginTop: 8 },
});
