// screens/Notification.jsx
import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from "react-native";
import { NotificationContext } from "../context/NotificationContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import * as Haptics from "expo-haptics";

const formatTimeAgo = (ts) => {
  if (!ts) return "Now";
  const sec = Math.floor((Date.now() - ts.toDate()) / 1000);
  if (sec < 60) return "Now";
  if (sec < 3600) return Math.floor(sec / 60) + "m";
  if (sec < 86400) return Math.floor(sec / 3600) + "h";
  if (sec < 2592000) return Math.floor(sec / 86400) + "d";
  return Math.floor(sec / 2592000) + "mo";
};

export default function Notification() {
  const { notifications, markAsRead } = useContext(NotificationContext);
  const [expandedId, setExpandedId] = useState(null);
  const [list, setList] = useState([]);

  useEffect(() => {
    const load = async () => {
      const items = await Promise.all(
        notifications.map(async (n) => {
          let name = "System";
          let photo = null;

          if ((n.type === "message" || n.type === "chat") && n.senderId) {
            try {
              const snap = await getDoc(doc(db, "users", n.senderId));
              if (snap.exists()) {
                const d = snap.data();
                name = d.name || d.businessName || "User";
                photo = d.photoURL;
              }
            } catch (e) {}
          } else if (n.type === "order") {
            name = "New Order";
          } else if (n.type === "vendor_approved") {
            name = "Vendor Approved!";
          } else if (n.type === "vendor_rejected") {
            name = "Application Update";
          }

          return { ...n, senderName: name, senderPhoto: photo };
        })
      );
      setList(items);
    };
    load();
  }, [notifications]);

  const toggle = (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedId(expandedId === id ? null : id);
    markAsRead(id);
  };

  const renderItem = ({ item }) => {
    const expanded = expandedId === item.id;

    return (
      <TouchableOpacity activeOpacity={0.7} onPress={() => toggle(item.id)}>
        <View style={[styles.row, expanded && styles.rowExpanded]}>
          {/* Avatar */}
          {item.senderPhoto ? (
            <Image source={{ uri: item.senderPhoto }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {item.senderName?.[0]?.toUpperCase() || "?"}
              </Text>
            </View>
          )}

          {/* Text */}
          <View style={styles.text}>
            <Text style={styles.name}>{item.senderName}</Text>
            <Text
              style={styles.message}
              numberOfLines={expanded ? undefined : 2}
            >
              {item.body || item.message || "New notification"}
            </Text>
          </View>

          {/* Right: time + unread dot */}
          <View style={styles.right}>
            <Text style={styles.time}>{formatTimeAgo(item.createdAt)}</Text>
            {!item.read && <View style={styles.dot} />}
          </View>
        </View>

        {/* Bottom border only when collapsed */}
        {!expanded && <View style={styles.border} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={list}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  row: {
    flexDirection: "row",
    padding: 16,
    minHeight: 78,
  },
  rowExpanded: {
    paddingBottom: 24,
    backgroundColor: "#fafafa",
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginRight: 14,
  },
  avatarPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#017a6b",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  avatarText: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  text: { flex: 1 },
  name: { fontSize: 16, fontWeight: "600", color: "#111" },
  message: { fontSize: 14.5, color: "#444", marginTop: 4, lineHeight: 21 },
  right: { alignItems: "flex-end", justifyContent: "center" },
  time: { fontSize: 13, color: "#888", marginBottom: 6 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: "#ff8c00" },
  border: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#eee",
    marginLeft: 82,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: { fontSize: 17, color: "#aaa" },
});