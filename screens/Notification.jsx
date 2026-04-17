// screens/Notification.jsx

import React, { useContext, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { NotificationContext } from "../context/NotificationContext";
import { useAuth } from "../context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";

const formatTimeAgo = (ts) => {
  if (!ts) return "Now";
  const sec = Math.floor((Date.now() - ts.toDate()) / 1000);
  if (sec < 60) return "Now";
  if (sec < 3600) return Math.floor(sec / 60) + "m";
  if (sec < 86400) return Math.floor(sec / 3600) + "h";
  if (sec < 2592000) return Math.floor(sec / 86400) + "d";
  return Math.floor(sec / 2592000) + "mo";
};

const formatEventDate = (ts) => {
  try {
    if (!ts) return null;
    if (ts.toDate) return ts.toDate().toLocaleString();
    return new Date(ts).toLocaleString();
  } catch {
    return null;
  }
};

export default function Notification() {
  const {
    notifications,
    markAsRead,
    refreshNotifications,
    loading: notifLoading,
  } = useContext(NotificationContext);

  const { user, loading: authLoading, isAuthenticated } = useAuth();

  const [expandedId, setExpandedId] = useState(null);
  const [list, setList] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Load sender details + event data
  useEffect(() => {
    const loadSenderDetails = async () => {
      if (notifications.length === 0) {
        setList([]);
        return;
      }

      const items = await Promise.all(
        notifications.map(async (n) => {
          let senderName = "System";
          let senderPhoto = null;
          let eventData = null;

          // Fetch event details if related to an event
          if (n.relatedType === "event" && n.relatedId) {
            try {
              const eventSnap = await getDoc(doc(db, "events", n.relatedId));
              if (eventSnap.exists()) {
                eventData = eventSnap.data();
              }
            } catch (e) {
              console.warn("Failed to fetch event:", e);
            }
          }

          // Fetch sender info for messages/chats
          if ((n.type === "message" || n.type === "chat") && n.senderId) {
            try {
              const snap = await getDoc(doc(db, "users", n.senderId));
              if (snap.exists()) {
                const d = snap.data();
                senderName =
                  d.name || d.businessName || d.displayName || "User";
                senderPhoto = d.photoURL || d.avatar;
              }
            } catch (e) {
              console.warn(`Failed to load sender ${n.senderId}:`, e);
            }
          } else if (n.type === "event_request" || n.type === "event_scheduled") {
            senderName = "Viewing Request";
          } else if (n.type === "order") {
            senderName = "New Order";
          }

          return {
            ...n,
            senderName,
            senderPhoto,
            // Attach enriched event data with fallback
            eventTitle: eventData?.title || n.eventTitle,
            eventDateTime: eventData?.dateTime || n.eventDateTime,
            eventNotes: eventData?.notes || n.eventNotes,
            eventPhone: eventData?.phoneNumber || n.eventPhone,
            tenantName: eventData?.tenantName || n.tenantName,
          };
        })
      );

      setList(items);
    };

    loadSenderDetails();
  }, [notifications]);

  const onRefresh = useCallback(async () => {
    if (!refreshNotifications) return;

    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await refreshNotifications();
    } catch (e) {
      console.error("Refresh failed", e);
    } finally {
      setRefreshing(false);
    }
  }, [refreshNotifications]);

  const toggle = (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedId((prev) => (prev === id ? null : id));
    markAsRead(id);
  };

  const renderItem = ({ item }) => {
    const expanded = expandedId === item.id;
    const hasPropertyImage = !!item.imageUrl;

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => toggle(item.id)}
      >
        <View style={[styles.row, expanded && styles.rowExpanded]}>
          {/* Image / Avatar */}
          <View style={styles.imageContainer}>
            {hasPropertyImage ? (
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.propertyImage}
              />
            ) : item.senderPhoto ? (
              <Image
                source={{ uri: item.senderPhoto }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {item.senderName?.[0]?.toUpperCase() || "N"}
                </Text>
              </View>
            )}

            {(item.type === "event_request" || item.type === "event_scheduled") && (
              <View style={styles.eventBadge}>
                <Ionicons name="calendar" size={14} color="#fff" />
              </View>
            )}
          </View>

          {/* Main Content */}
          <View style={styles.text}>
            <Text style={styles.name}>
              {item.title || item.senderName || "Notification"}
            </Text>

            <Text
              numberOfLines={expanded ? undefined : 2}
              style={styles.message}
            >
              {item.body || item.message || "New notification"}
            </Text>

            {/* Expanded Event Details */}
            {expanded && item.eventTitle && (
              <View style={{ marginTop: 12 }}>
                <Text style={{ fontWeight: "600", fontSize: 15 }}>
                  {item.eventTitle}
                </Text>

                {item.eventDateTime && (
                  <Text style={{ color: "#666", marginTop: 4, fontSize: 13.5 }}>
                    {formatEventDate(item.eventDateTime)}
                  </Text>
                )}

                {item.eventNotes && (
                  <Text style={{ marginTop: 8, color: "#444", lineHeight: 20 }}>
                    {item.eventNotes}
                  </Text>
                )}

                {item.eventPhone && (
                  <Text style={{ marginTop: 8, color: "#017a6b", fontWeight: "500" }}>
                    📞 {item.eventPhone}
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Time & Unread Indicator */}
          <View style={styles.right}>
            <Text style={styles.time}>{formatTimeAgo(item.createdAt)}</Text>
            {!item.read && <View style={styles.dot} />}
          </View>
        </View>

        {/* Divider - only show when not expanded */}
        {!expanded && <View style={styles.border} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {authLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#017a6b" />
          <Text style={styles.loadingText}>Checking authentication...</Text>
        </View>
      ) : !isAuthenticated ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyText}>
            Please log in to view notifications
          </Text>
        </View>
      ) : notifLoading && list.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#017a6b" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#017a6b"]}
              tintColor="#017a6b"
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No notifications yet</Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={styles.border} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },

  row: {
    flexDirection: "row",
    padding: 16,
    minHeight: 82,
  },
  rowExpanded: {
    paddingBottom: 28,
    backgroundColor: "#fafafa",
  },

  imageContainer: {
    marginRight: 14,
    position: "relative",
  },
  propertyImage: {
    width: 58,
    height: 58,
    borderRadius: 10,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },

  avatarPlaceholder: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#017a6b",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },

  eventBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: "#017a6b",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },

  text: {
    flex: 1,
    paddingRight: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  message: {
    fontSize: 14.5,
    color: "#444",
    lineHeight: 20,
  },

  right: {
    alignItems: "flex-end",
    justifyContent: "flex-start",
    minWidth: 50,
  },
  time: {
    fontSize: 13,
    color: "#888",
  },

  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#ff8c00",
    marginTop: 6,
  },

  border: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#eee",
    marginLeft: 72,
  },

  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },

  emptyText: {
    fontSize: 17,
    color: "#aaa",
    textAlign: "center",
  },
});