// screens/Orders.jsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  useColorScheme,
} from "react-native";
import { db, auth } from "../firebaseConfig";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("buyer");
  const isDark = useColorScheme() === "dark";
  const [timeLeftMap, setTimeLeftMap] = useState({});

  // 🕐 Timestamp Formatting
  const formatTimestamp = (timestamp) => {
    if (!timestamp || !timestamp.toDate) return "Unknown time";
    const now = new Date();
    const orderDate = timestamp.toDate();
    const diffMs = now - orderDate;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return `Today at ${orderDate.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })}`;
      }
      return `${diffHours}h ago`;
    } else if (diffDays === 1) {
      return `Yesterday at ${orderDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })}`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else if (diffDays < 30) {
      return `${Math.floor(diffDays / 7)}w ago`;
    } else {
      return `${Math.floor(diffDays / 30)}m ago`;
    }
  };

  const getDateBadge = (timestamp) => {
    if (!timestamp || !timestamp.toDate) return null;
    const orderDate = timestamp.toDate();
    const now = new Date();
    const diffDays = Math.floor((now - orderDate) / (1000 * 60 * 60 * 24));

    let badgeText = "";
    let badgeColor = "";

    if (diffDays === 0) {
      badgeText = "TODAY";
      badgeColor = isDark ? "#00ff7f" : "#017a6b";
    } else if (diffDays === 1) {
      badgeText = "YDAY";
      badgeColor = isDark ? "#ff9800" : "#f57c00";
    } else if (diffDays < 7) {
      badgeText = `${diffDays}D`;
      badgeColor = isDark ? "#4caf50" : "#388e3c";
    } else if (diffDays < 30) {
      badgeText = `${Math.floor(diffDays / 7)}W`;
      badgeColor = isDark ? "#9c27b0" : "#7b1fa2";
    } else {
      badgeText = `${Math.floor(diffDays / 30)}M`;
      badgeColor = isDark ? "#607d8b" : "#455a64";
    }

    return { badgeText, badgeColor };
  };

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const ordersRef = collection(db, "orders");
    const productsRef = collection(db, "products");

    // Check if user is vendor
    const vendorQuery = query(productsRef, where("vendorId", "==", user.uid));
    const unsubscribeVendorCheck = onSnapshot(vendorQuery, (snap) => {
      const isVendor = !snap.empty;
      setRole(isVendor ? "vendor" : "buyer");

      // Orders query
      const ordersQuery = isVendor
        ? query(
            ordersRef,
            where("items", "array-contains-any", [{ vendorId: user.uid }]),
            orderBy("createdAt", "desc")
          )
        : query(ordersRef, where("buyerId", "==", user.uid), orderBy("createdAt", "desc"));

      const unsubscribeOrders = onSnapshot(
        ordersQuery,
        (snapshot) => {
          const fetchedOrders = [];
          snapshot.forEach((doc) => {
            const orderData = doc.data();
            if (isVendor) {
              const vendorItems = orderData.items.filter(
                (item) => item.vendorId === user.uid
              );
              if (vendorItems.length > 0) {
                fetchedOrders.push({ id: doc.id, ...orderData, items: vendorItems });
              }
            } else {
              fetchedOrders.push({ id: doc.id, ...orderData });
            }
          });

          setOrders(fetchedOrders);

          const initialTimeLeft = {};
          fetchedOrders.forEach((o) => {
            initialTimeLeft[o.id] = 24 * 60 * 60;
          });
          setTimeLeftMap(initialTimeLeft);
          setLoading(false);
        },
        (error) => {
          console.error("Error fetching orders:", error);
          setLoading(false);
        }
      );

      return () => unsubscribeOrders();
    });

    return () => unsubscribeVendorCheck();
  }, []);

  // Timer for countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeftMap((prev) => {
        const updated = {};
        for (const key in prev) {
          updated[key] = prev[key] > 0 ? prev[key] - 1 : 0;
        }
        return updated;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "paid":
        return isDark ? "#00ff7f" : "#017a6b";
      case "pending_payment":
        return isDark ? "#ff9800" : "#f57c00";
      case "delivered":
        return isDark ? "#4caf50" : "#388e3c";
      default:
        return isDark ? "#f44336" : "#d32f2f";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "paid":
        return "Paid";
      case "pending_payment":
        return "Pending Payment";
      case "delivered":
        return "Delivered";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: isDark ? "#121212" : "#fafafa" }]}>
        <ActivityIndicator size="large" color={isDark ? "#00ff7f" : "#017a6b"} />
        <Text style={{ marginTop: 16, color: isDark ? "#e0e0e0" : "#666" }}>
          Loading your orders...
        </Text>
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: isDark ? "#121212" : "#fafafa" }]}>
        <Ionicons name="receipt-outline" size={64} color={isDark ? "#666" : "#999"} />
        <Text style={{ marginTop: 16, fontSize: 24, fontWeight: "800", color: isDark ? "#e0e0e0" : "#333" }}>
          No Orders Yet
        </Text>
        <Text style={{ marginTop: 8, fontSize: 16, color: isDark ? "#999" : "#666" }}>
          {role === "vendor" ? "Start receiving orders from buyers" : "Your orders will appear here"}
        </Text>
      </View>
    );
  }

  const renderItem = ({ item }) => {
    const isVendor = role === "vendor";
    const statusColor = getStatusColor(item.status);
    const dateBadge = getDateBadge(item.createdAt);

    return (
      <View style={[
        styles.orderCard,
        { backgroundColor: isDark ? "#1e1e1e" : "#fff", borderColor: isDark ? "#333" : "#e0e6ed" }
      ]}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={[styles.rlBadgeSmall, { borderColor: isDark ? "#333" : "#e0e6ed" }]}>
            <Text style={{ color: isDark ? "#00ff7f" : "#017a6b", fontWeight: "900" }}>RL</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: isDark ? "#e0e0e0" : "#1a1a1a" }}>
              Order #{item.id.slice(-8)}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 4 }}>
              {dateBadge && (
                <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: dateBadge.badgeColor + "15" }}>
                  <Text style={{ color: dateBadge.badgeColor, fontWeight: "800", fontSize: 11 }}>{dateBadge.badgeText}</Text>
                </View>
              )}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Ionicons name="time-outline" size={14} color={isDark ? "#888" : "#666"} />
                <Text style={{ fontSize: 13, color: isDark ? "#b0b0b0" : "#666" }}>
                  {formatTimestamp(item.createdAt)}
                </Text>
              </View>
            </View>
          </View>
          <View style={{ alignItems: "center" }}>
            <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: isDark ? 'rgba(0,255,127,0.1)' : 'rgba(1,122,107,0.1)' }}>
              <Ionicons name="time-outline" size={16} color={isDark ? "#00ff7f" : "#017a6b"} />
              <Text style={{ marginLeft: 4, fontSize: 12, fontWeight: "700", color: isDark ? "#00ff7f" : "#017a6b" }}>
                {formatTime(timeLeftMap[item.id] || 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Status & Amount */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <View style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: statusColor + "15" }}>
            <Text style={{ color: statusColor, fontSize: 13, fontWeight: "700" }}>
              {getStatusText(item.status)}
            </Text>
          </View>
          <Text style={{ fontSize: 22, fontWeight: "900", color: isDark ? "#00ff7f" : "#017a6b" }}>
            ₦{item.totalAmount?.toLocaleString()}
          </Text>
        </View>

        {/* Items */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 12, color: isDark ? "#e0e0e0" : "#1a1a1a" }}>
            Items Ordered
          </Text>
          {item.items?.slice(0, 2).map((i, idx) => (
            <View key={idx} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 }}>
              <Text style={{ flex: 1, fontSize: 15, color: isDark ? "#b0b0b0" : "#555" }}>{i.name}</Text>
              <Text style={{ fontSize: 14, fontWeight: "700", color: isDark ? "#00ff7f" : "#017a6b" }}>
                ₦{i.price?.toLocaleString()} × {i.quantity}
              </Text>
            </View>
          ))}
          {item.items?.length > 2 && (
            <Text style={{ fontSize: 14, textAlign: "center", paddingVertical: 8, color: isDark ? "#999" : "#666" }}>
              +{item.items.length - 2} more items
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? "#121212" : "#fafafa" }}>
      {/* RL My Orders Header */}
      <View style={{ flexDirection: "row", alignItems: "center", padding: 16 }}>
        <View style={[styles.rlBadgeSmall, { borderColor: isDark ? "#333" : "#e0e6ed" }]}>
          <Text style={{ color: isDark ? "#00ff7f" : "#017a6b", fontWeight: "900" }}>RL</Text>
        </View>
        <Text style={{ fontSize: 22, fontWeight: "900", marginLeft: 12, color: isDark ? "#e0e0e0" : "#1a1a1a" }}>
          My Orders ({orders.length})
        </Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 20 },
  orderCard: { marginHorizontal: 16, marginBottom: 20, borderRadius: 20, padding: 20, borderWidth: 1, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 8 },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 16 },
  rlBadgeSmall: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center", marginRight: 12, borderWidth: 1 },
});


