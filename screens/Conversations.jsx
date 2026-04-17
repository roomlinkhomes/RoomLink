// screens/Conversation.jsx
import React, { useState, useEffect, useCallback, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  useColorScheme,
  Modal,
  TouchableWithoutFeedback,
  Alert,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { AuthContext } from "../context/AuthContext";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  doc,
  getDoc,
  getDocs,
  writeBatch,
  updateDoc,
  arrayUnion,
  arrayRemove,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase";

// SVG Badges
import BlueBadge from "../assets/icons/blue.svg";
import YellowBadge from "../assets/icons/yellow.svg";
import RedBadge from "../assets/icons/red.svg";

import Trust from "../component/Trust";
import { Ionicons } from "@expo/vector-icons";

// ── HELPERS ─────────────────────────────────────────────
const getFullName = (userData) => {
  if (!userData) return "User";
  if (userData.displayName?.trim()) return userData.displayName.trim();
  if (userData.firstName && userData.lastName)
    return `${userData.firstName} ${userData.lastName}`.trim();
  if (userData.name?.trim()) return userData.name.trim();
  if (userData.username) return userData.username;
  return "User";
};

const formatTimeAgo = (timestamp) => {
  if (!timestamp) return "";
  try {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
    return `${Math.floor(seconds / 604800)}w`;
  } catch (e) {
    return "";
  }
};

const userCache = new Map();

const fetchRealUser = async (uid) => {
  if (!uid) return { name: "User", photo: null, verificationType: null, isVerified: false };
  if (userCache.has(uid)) return userCache.get(uid);

  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) {
      const data = snap.data();
      const profile = {
        name: getFullName(data),
        photo: data.photoURL || data.profileImage || data.avatar || null,
        verificationType: data.verificationType || null,
        isVerified: data.isVerified === true,        // ← Clean & Reliable
      };
      userCache.set(uid, profile);
      return profile;
    }
  } catch (err) {
    console.error("Error fetching user:", err);
  }

  const fallback = { name: "User", photo: null, verificationType: null, isVerified: false };
  userCache.set(uid, fallback);
  return fallback;
};

const VerificationBadge = ({ type }) => {
  if (!type) return null;
  const badgeStyle = { marginLeft: 6 };
  if (type === "vendor") return <YellowBadge width={22} height={22} style={badgeStyle} />;
  if (type === "studentLandlord") return <BlueBadge width={22} height={22} style={badgeStyle} />;
  if (type === "realEstate") return <RedBadge width={22} height={22} style={badgeStyle} />;
  return null;
};

// ── MAIN COMPONENT ─────────────────────────────────────
export default function Conversation() {
  const navigation = useNavigation();
  const { user: authUser } = useContext(AuthContext);
  const userId = authUser?.uid;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pinnedConvos, setPinnedConvos] = useState([]);
  const [archivedConvos, setArchivedConvos] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedConvo, setSelectedConvo] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Pinned/Archived listener
  useEffect(() => {
    if (!userId) {
      setPinnedConvos([]);
      setArchivedConvos([]);
      return;
    }
    const settingsRef = doc(db, "users", userId, "settings", "conversations");
    const unsub = onSnapshot(settingsRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setPinnedConvos(data.pinned || []);
        setArchivedConvos(data.archived || []);
      } else {
        setPinnedConvos([]);
        setArchivedConvos([]);
      }
    });
    return unsub;
  }, [userId]);

  const updateConvoSettings = async (field, convoKey, add = true) => {
    if (!userId) return;
    const settingsRef = doc(db, "users", userId, "settings", "conversations");
    try {
      if (add) {
        await updateDoc(settingsRef, { [field]: arrayUnion(convoKey) });
      } else {
        await updateDoc(settingsRef, { [field]: arrayRemove(convoKey) });
      }
    } catch (err) {
      await setDoc(settingsRef, { [field]: add ? [convoKey] : [] }, { merge: true });
    }
  };

  const handlePin = async () => {
    if (!selectedConvo) return;
    const isPinned = pinnedConvos.includes(selectedConvo.convoKey);
    await updateConvoSettings("pinned", selectedConvo.convoKey, !isPinned);
    setModalVisible(false);
  };

  const handleMarkUnread = () => {
    if (!selectedConvo) return;
    setConversations((prev) =>
      prev.map((c) =>
        c.convoKey === selectedConvo.convoKey ? { ...c, unreadCount: 1 } : c
      )
    );
    setModalVisible(false);
  };

  const handleDelete = async () => {
    if (!selectedConvo) return;
    Alert.alert(
      "Delete Conversation",
      "This will delete the conversation for you only. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const q = query(collection(db, "messages"), where("listingId", "==", selectedConvo.listingId));
              const snap = await getDocs(q);
              const batch = writeBatch(db);
              snap.forEach((d) => batch.delete(d.ref));
              await batch.commit();
              setConversations((prev) => prev.filter((c) => c.convoKey !== selectedConvo.convoKey));
            } catch (err) {
              console.error("Delete error:", err);
              Alert.alert("Error", "Failed to delete conversation");
            }
            setModalVisible(false);
          },
        },
      ]
    );
  };

  const handleLongPress = (item) => {
    setSelectedConvo(item);
    setModalVisible(true);
  };

  const openChat = useCallback((item) => {
    if (!item?.listingId || !item?.otherUserId) {
      Alert.alert("Error", "Missing conversation data");
      return;
    }

    setConversations((prev) =>
      prev.map((c) =>
        c.convoKey === item.convoKey ? { ...c, unreadCount: 0 } : c
      )
    );

    const serializableListing = {
      id: item.listingId,
      title: item.listingTitle || "Property Listing",
      images: Array.isArray(item.listingImages) && item.listingImages.length > 0
        ? item.listingImages
        : [],
      priceMonthly: item.priceMonthly || null,
      priceYearly: item.priceYearly || null,
      location: item.location || "Location not specified",
      description: "",
      category: null,
      rented: false,
      userId: item.otherUserId,
    };

    navigation.navigate("HomeTabs", {
      screen: "Messages",
      params: {
        screen: "Message",
        params: {
          listingId: item.listingId,
          listingOwnerId: item.otherUserId,
          tenantId: userId || "",
          listingTitle: item.listingTitle || "Listing",
          listing: serializableListing,
          ownerInfo: {
            uid: item.otherUserId,
            name: item.otherUserName || "User",
            avatar: item.otherUserPhoto,
            isVerified: item.isVerified,
            verificationType: item.verificationType,
          },
        },
      },
    });
  }, [navigation, userId]);

  // Load conversations
  const loadConversations = useCallback(() => {
    if (!userId) {
      setConversations([]);
      setLoading(false);
      return () => {};
    }

    const convoMap = new Map();

    const processSnapshot = async (snapshot) => {
      snapshot.docs.forEach((docSnap) => {
        const msg = docSnap.data();
        if (!msg.listingId) return;

        const isSender = msg.senderId === userId;
        const otherUserId = isSender ? msg.receiverId : msg.senderId;
        if (!otherUserId) return;

        const convoKey = `${msg.listingId}_${otherUserId}`;
        const readBy = msg.readBy || [];
        const isUnread = !isSender && !readBy.includes(userId);

        if (!convoMap.has(convoKey)) {
          convoMap.set(convoKey, {
            convoKey,
            listingId: msg.listingId,
            otherUserId,
            lastMessage: msg.imageUrl ? "Photo" : msg.content || "Start chatting...",
            lastMessageTime: msg.createdAt,
            unreadCount: isUnread ? 1 : 0,
            listingTitle: msg.listingTitle,
            priceMonthly: msg.priceMonthly,
            priceYearly: msg.priceYearly,
            location: msg.location,
            listingImages: msg.images || msg.listingImages || [],
          });
        } else {
          const existing = convoMap.get(convoKey);
          const newTime = msg.createdAt?.toMillis?.() || 0;
          const existingTime = existing.lastMessageTime?.toMillis?.() || 0;

          if (newTime > existingTime) {
            existing.lastMessageTime = msg.createdAt;
            existing.lastMessage = msg.imageUrl ? "Photo" : msg.content || "Start chatting...";
          }
          if (isUnread) existing.unreadCount += 1;
        }
      });

      const convos = await Promise.all(
        Array.from(convoMap.values()).map(async (c) => {
          const { name, photo, verificationType, isVerified } = await fetchRealUser(c.otherUserId);
          return {
            ...c,
            otherUserName: name,
            otherUserPhoto: photo,
            verificationType,
            isVerified,
          };
        })
      );

      let filtered = convos.filter((c) => !archivedConvos.includes(c.convoKey));
      filtered.sort((a, b) => (b.lastMessageTime?.toMillis?.() || 0) - (a.lastMessageTime?.toMillis?.() || 0));

      const pinned = filtered.filter((c) => pinnedConvos.includes(c.convoKey));
      const unpinned = filtered.filter((c) => !pinnedConvos.includes(c.convoKey));

      setConversations([...pinned, ...unpinned]);
      setLoading(false);
    };

    const sentQuery = query(collection(db, "messages"), where("senderId", "==", userId), orderBy("createdAt", "desc"));
    const receivedQuery = query(collection(db, "messages"), where("receiverId", "==", userId), orderBy("createdAt", "desc"));

    const unsubSent = onSnapshot(sentQuery, processSnapshot);
    const unsubReceived = onSnapshot(receivedQuery, processSnapshot);

    return () => {
      unsubSent();
      unsubReceived();
    };
  }, [userId, pinnedConvos, archivedConvos]);

  useEffect(() => {
    const cleanup = loadConversations();
    return cleanup;
  }, [loadConversations]);

  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
    setTimeout(() => setRefreshing(false), 1200);
  };

  const renderItem = ({ item }) => {
    const hasUnread = item.unreadCount > 0;
    const isPinned = pinnedConvos.includes(item.convoKey);

    return (
      <TouchableOpacity
        style={styles.thread}
        onPress={() => openChat(item)}
        onLongPress={() => handleLongPress(item)}
        delayLongPress={400}
        activeOpacity={0.7}
      >
        <Image
          source={{
            uri: item.otherUserPhoto ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(item.otherUserName)}&background=${isDark ? "1a1a1a" : "f5f5f5"}&color=${isDark ? "0df9a0" : "017a6b"}&bold=true&size=100`,
          }}
          style={styles.avatar}
        />

        <View style={styles.content}>
          <View style={styles.nameRow}>
            <Text 
              style={[styles.name, { color: isDark ? "#fff" : "#000" }]}
              numberOfLines={1}
            >
              {item.otherUserName}
            </Text>

            {/* FIXED: Correct Trust Badge Usage */}
            {item.isVerified && <Trust text="Verified Host" />}

            <VerificationBadge type={item.verificationType} />
          </View>

          <Text
            style={[
              styles.preview,
              hasUnread && styles.previewBold,
              { color: hasUnread ? (isDark ? "#fff" : "#000") : (isDark ? "#aaa" : "#666") },
            ]}
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
        </View>

        <View style={styles.right}>
          {isPinned && (
            <Ionicons 
              name="pin" 
              size={16} 
              color="#0df9a0" 
              style={{ transform: [{ rotate: "45deg" }], marginBottom: 4 }} 
            />
          )}
          <Text style={[styles.time, { color: isDark ? "#888" : "#777" }]}>
            {formatTimeAgo(item.lastMessageTime)}
          </Text>
          {hasUnread && (
            <View style={styles.unreadBadge}>
              <Text style={styles.badgeText}>
                {item.unreadCount > 99 ? "99+" : item.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#000" : "#fff" }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View style={styles.header}>
        <Text style={[styles.title, { color: isDark ? "#fff" : "#000" }]}>Messages</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center" }}>
          <ActivityIndicator size="large" color={isDark ? "#0df9a0" : "#017a6b"} />
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyTitle, { color: isDark ? "#888" : "#666" }]}>No messages yet</Text>
          <Text style={[styles.emptySubtitle, { color: isDark ? "#555" : "#888" }]}>Start a conversation!</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.convoKey}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 8 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}

      {/* Options Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: isDark ? "#111" : "#fff" }]}>
              <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
              <View style={styles.modalHandle} />

              <TouchableOpacity style={styles.modalItem} onPress={handlePin}>
                <Text style={[styles.modalText, { color: isDark ? "#fff" : "#000" }]}>
                  {pinnedConvos.includes(selectedConvo?.convoKey) ? "Unpin" : "Pin"} Conversation
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalItem} onPress={handleMarkUnread}>
                <Text style={[styles.modalText, { color: isDark ? "#fff" : "#000" }]}>Mark as unread</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.modalItem, styles.deleteItem]} onPress={handleDelete}>
                <Text style={{ color: "#ef4444", fontWeight: "600", fontSize: 16 }}>
                  Delete Conversation
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

// ── STYLES ─────────────────────────────────────────────
const styles = StyleSheet.create({
  header: { 
    paddingHorizontal: 20, 
    paddingTop: 10, 
    paddingBottom: 12 
  },
  title: { 
    fontSize: 34, 
    fontWeight: "800" 
  },
  thread: { 
    flexDirection: "row", 
    paddingHorizontal: 16, 
    paddingVertical: 14, 
    alignItems: "center" 
  },
  avatar: { 
    width: 56, 
    height: 56, 
    borderRadius: 28 
  },
  content: { 
    flex: 1, 
    marginLeft: 14 
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 5,
  },
  name: { 
    fontSize: 16.5, 
    fontWeight: "600",
    flexShrink: 1,
  },
  preview: { 
    fontSize: 14.5, 
    marginTop: 3 
  },
  previewBold: { 
    fontWeight: "600" 
  },
  right: { 
    alignItems: "flex-end", 
    justifyContent: "center", 
    width: 72 
  },
  time: { 
    fontSize: 12.5 
  },
  unreadBadge: { 
    backgroundColor: "#0df9a0", 
    minWidth: 21, 
    height: 21, 
    borderRadius: 10.5, 
    justifyContent: "center", 
    alignItems: "center", 
    marginTop: 4 
  },
  badgeText: { 
    color: "#000", 
    fontWeight: "bold", 
    fontSize: 11 
  },
  empty: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    paddingHorizontal: 40 
  },
  emptyTitle: { 
    fontSize: 18, 
    fontWeight: "600", 
    marginBottom: 8 
  },
  emptySubtitle: { 
    fontSize: 14 
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: "rgba(0,0,0,0.5)", 
    justifyContent: "flex-end" 
  },
  modalContent: { 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    paddingHorizontal: 20, 
    paddingTop: 20, 
    paddingBottom: 30 
  },
  modalHandle: { 
    width: 40, 
    height: 5, 
    backgroundColor: "#666", 
    borderRadius: 3, 
    alignSelf: "center", 
    marginBottom: 20 
  },
  closeButton: { 
    position: "absolute", 
    top: 16, 
    right: 20, 
    zIndex: 10, 
    padding: 8 
  },
  closeText: { 
    fontSize: 16, 
    color: "#888" 
  },
  modalItem: { 
    paddingVertical: 16, 
    borderBottomWidth: StyleSheet.hairlineWidth, 
    borderBottomColor: "#333" 
  },
  modalText: { 
    fontSize: 17 
  },
  deleteItem: { 
    marginTop: 10 
  },
});