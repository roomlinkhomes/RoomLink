import React, { useContext, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NotificationContext } from "../context/NotificationContext";

export default function Notification() {
  const { notifications, markAsRead } = useContext(NotificationContext);
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
    if (expandedId !== id) markAsRead(id); // mark as read when expanded
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => toggleExpand(item.id)}>
      <Ionicons
        name={item.read ? "notifications-outline" : "notifications"}
        size={24}
        color={item.read ? "#888" : "#1A237E"}
      />
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.body}>{item.body}</Text>

        {expandedId === item.id && (
          <View style={styles.detailsContainer}>
            <Text style={styles.details}>{item.details}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {notifications.length > 0 ? (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
        />
      ) : (
        <Text style={styles.empty}>No notifications yet</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    marginBottom: 10,
  },
  textContainer: { marginLeft: 10, flex: 1 },
  title: { fontSize: 16, fontWeight: "600", color: "#333" },
  body: { fontSize: 14, color: "#666", marginTop: 2 },
  detailsContainer: {
    marginTop: 6,
    backgroundColor: "#e8f0fe",
    padding: 8,
    borderRadius: 6,
  },
  details: { fontSize: 13, color: "#111" },
  empty: { textAlign: "center", marginTop: 40, fontSize: 16, color: "#999" },
});
