// screens/Message.jsx — FIXED: REAL blocking logic + read-only UI when blocked + improved input bar
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  useColorScheme,
  StatusBar,
  Alert,
  Image,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  arrayUnion,
  getDoc,
} from "firebase/firestore";
import { db, storage } from "../firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useUser } from "../context/UserContext";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import MessageHeader from "../component/MessageHeader";

const SUPPORT_UID = "PdEzQK2PxUccxbJLJo67lRi21NR2";

const formatMessageTime = (timestamp) => {
  if (!timestamp) return "";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  const days = Math.floor(diff / 86400);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  const sameYear = now.getFullYear() === date.getFullYear();
  if (sameYear) return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

export default function Message() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user: currentUser } = useUser();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const {
    listingId: routeListingId,
    listingOwnerId: routeListingOwnerId,
    recipientUID,
    otherUserName: initialName = "User",
    otherUserPhoto: initialPhoto,
  } = route.params || {};

  const isSupportChat = !!recipientUID && recipientUID === SUPPORT_UID && !routeListingId && !routeListingOwnerId;
  const effectiveListingId = isSupportChat
    ? `support_${[currentUser?.uid, SUPPORT_UID].sort().join("_")}`
    : routeListingId;
  const effectiveListingOwnerId = isSupportChat ? SUPPORT_UID : routeListingOwnerId;

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [fullImage, setFullImage] = useState(null);
  const [otherUser, setOtherUser] = useState({ name: initialName, photoURL: initialPhoto || null });
  const [verificationType, setVerificationType] = useState(null);
  const [mediaMenuVisible, setMediaMenuVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);

  const flatListRef = useRef();
  const inputRef = useRef(null); // ← Added this (fixes "Can't find variable: inputRef")

  const currentUserId = currentUser?.uid || currentUser?._id;
  const hasText = inputText.trim().length > 0;

  const quickSuggestions = [
    "Is your apartment still available?",
    "What's the current rent price?",
    "Can I schedule a viewing this weekend?",
    "Are pets allowed?",
    "Are utilities included in the rent?",
    "Any agent or legal fees?",
    "When is the earliest move-in date?",
  ];

  const handleQuickReply = (text) => {
    setInputText(text);
    setShowSuggestions(false);
  };

  const heavyVibrate = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 60);
  };

  // Fetch other user info
  useEffect(() => {
    if (!effectiveListingOwnerId) return;
    const unsub = onSnapshot(doc(db, "users", effectiveListingOwnerId), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        const name =
          d.displayName?.trim() ||
          `${d.firstName || ""} ${d.lastName || ""}`.trim() ||
          d.username ||
          (isSupportChat ? "RoomLink Support" : "User");
        const photo = d.photoURL || d.profileImage || d.avatar || null;
        setOtherUser({ name, photoURL: photo });
      } else if (isSupportChat) {
        setOtherUser({ name: "RoomLink Support", photoURL: null });
      }
    });
    return unsub;
  }, [effectiveListingOwnerId, isSupportChat]);

  // Fetch verification (skip for support)
  useEffect(() => {
    if (!effectiveListingOwnerId || isSupportChat) return;
    const fetchVerification = async () => {
      try {
        const snap = await getDoc(doc(db, "users", effectiveListingOwnerId));
        if (snap.exists()) {
          setVerificationType(snap.data().verificationType || null);
        }
      } catch (e) {
        console.log("Verification fetch error:", e);
      }
    };
    fetchVerification();
  }, [effectiveListingOwnerId, isSupportChat]);

  // REAL BLOCKING CHECK
  useEffect(() => {
    if (!currentUserId || !effectiveListingOwnerId || isSupportChat) {
      setIsBlocked(false);
      return;
    }
    const userRef = doc(db, "users", currentUserId);
    const unsub = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const blocked = snap.data().blocked || [];
        setIsBlocked(blocked.includes(effectiveListingOwnerId));
      } else {
        setIsBlocked(false);
      }
    });
    return unsub;
  }, [currentUserId, effectiveListingOwnerId, isSupportChat]);

  // Messages listener
  useEffect(() => {
    if (!currentUserId || !effectiveListingId) return;
    const q = query(
      collection(db, "messages"),
      where("listingId", "==", effectiveListingId),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter(
          (m) =>
            (m.senderId === currentUserId && (!m.receiverId || m.receiverId === effectiveListingOwnerId)) ||
            (m.receiverId === currentUserId && m.senderId === effectiveListingOwnerId)
        );
      setMessages(msgs);
      setLoading(false);
      // Mark as read
      const toMark = msgs.filter(
        (m) =>
          m.receiverId === currentUserId &&
          !(Array.isArray(m.readBy) && m.readBy.includes(currentUserId))
      );
      toMark.forEach((m) => {
        updateDoc(doc(db, "messages", m.id), { readBy: arrayUnion(currentUserId) }).catch(() => {});
      });
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });
    return unsub;
  }, [currentUserId, effectiveListingId, effectiveListingOwnerId]);

  useEffect(() => {
    if (messages.length > 3) {
      setShowSuggestions(false);
    }
  }, [messages.length]);

  const uploadImage = async (uri) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const filename = uri.substring(uri.lastIndexOf("/") + 1);
    const storageRef = ref(storage, `chat_images/${effectiveListingId}/${Date.now()}_${filename}`);
    const uploadTask = uploadBytesResumable(storageRef, blob);
    return new Promise((resolve, reject) => {
      uploadTask.on("state_changed", null, reject, async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(url);
      });
    });
  };

  const sendImage = async (uri) => {
    if (!uri || uploading || isBlocked) return;
    setUploading(true);
    heavyVibrate();
    const tempId = Date.now().toString();
    const optimisticImg = {
      id: tempId,
      imageUrl: uri,
      senderId: currentUserId,
      receiverId: effectiveListingOwnerId || null,
      listingId: effectiveListingId,
      createdAt: { toDate: () => new Date() },
      type: "image",
      _optimistic: true,
    };
    setMessages((prev) => [...prev, optimisticImg]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    try {
      const imageUrl = await uploadImage(uri);
      const docRef = await addDoc(collection(db, "messages"), {
        imageUrl,
        senderId: currentUserId,
        receiverId: effectiveListingOwnerId || null,
        listingId: effectiveListingId,
        createdAt: serverTimestamp(),
        readBy: [],
        type: "image",
      });
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, id: docRef.id, _optimistic: false } : m))
      );
    } catch (e) {
      Alert.alert("Error", "Image upload failed");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setUploading(false);
    }
  };

  const pickImage = async () => {
    heavyVibrate();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled) sendImage(result.assets[0].uri);
    setMediaMenuVisible(false);
  };

  const openCamera = async () => {
    heavyVibrate();
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Camera access required");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: true });
    if (!result.canceled) sendImage(result.assets[0].uri);
    setMediaMenuVisible(false);
  };

  const sendMessage = async () => {
    if (!inputText.trim() || uploading || isBlocked) return;
    const textToSend = inputText.trim();
    setInputText("");
    heavyVibrate();
    const tempId = Date.now().toString();
    const optimisticMsg = {
      id: tempId,
      content: textToSend,
      senderId: currentUserId,
      receiverId: effectiveListingOwnerId || null,
      listingId: effectiveListingId,
      createdAt: { toDate: () => new Date() },
      readBy: [],
      type: "text",
      _optimistic: true,
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    try {
      const docRef = await addDoc(collection(db, "messages"), {
        content: textToSend,
        senderId: currentUserId,
        receiverId: effectiveListingOwnerId || null,
        listingId: effectiveListingId,
        createdAt: serverTimestamp(),
        readBy: [],
        type: "text",
      });
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, id: docRef.id, _optimistic: false } : m))
      );
    } catch (error) {
      Alert.alert("Failed", "Message not sent");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInputText(textToSend);
    }
  };

  const renderMessage = ({ item }) => {
    const isMe = item.senderId === currentUserId;
    const receiverId = item.receiverId || effectiveListingOwnerId;
    let tickIcon = null;
    let tickColor = "#aaa";
    if (isMe) {
      if (item._optimistic) {
        tickIcon = "checkmark";
      } else if (item._failed) {
        tickIcon = "alert-circle";
        tickColor = "#ff4444";
      } else {
        tickIcon = "checkmark-done";
        const isRead = Array.isArray(item.readBy) && item.readBy.includes(receiverId);
        tickColor = isRead ? "#0df9a0" : "#aaa";
      }
    }
    if (item.type === "image") {
      return (
        <View style={[styles.messageContainer, isMe ? styles.sent : styles.received]}>
          <TouchableWithoutFeedback onPress={() => setFullImage(item.imageUrl)}>
            <Image
              source={{ uri: item.imageUrl }}
              style={{ width: 220, height: 280, borderRadius: 20, marginBottom: 4 }}
              resizeMode="cover"
            />
          </TouchableWithoutFeedback>
          <View style={styles.messageFooter}>
            <Text style={[styles.timestamp, { color: isMe ? "#ccc" : "#999" }]}>
              {formatMessageTime(item.createdAt)}
            </Text>
            {tickIcon && <Ionicons name={tickIcon} size={18} color={tickColor} style={{ marginLeft: 6 }} />}
          </View>
        </View>
      );
    }
    return (
      <View style={[styles.messageContainer, isMe ? styles.sent : styles.received]}>
        <View style={[styles.bubble, isMe ? styles.sentBubble : { backgroundColor: isDark ? "#333" : "#e5e5ea" }]}>
          <Text style={[styles.messageText, { color: isMe ? "#fff" : isDark ? "#eee" : "#111" }]}>
            {item.content}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[styles.timestamp, { color: isMe ? "#ccc" : "#999" }]}>
              {formatMessageTime(item.createdAt)}
            </Text>
            {tickIcon && <Ionicons name={tickIcon} size={18} color={tickColor} style={{ marginLeft: 6 }} />}
          </View>
        </View>
      </View>
    );
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#000" : "#fff", justifyContent: "center" }}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <ActivityIndicator size="large" color="#036dd6" />
      </SafeAreaView>
    );
  }

  if (isBlocked && !isSupportChat) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#000" : "#fff" }}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <MessageHeader
          userId={effectiveListingOwnerId}
          name={otherUser.name}
          photoURL={otherUser.photoURL}
          verificationType={isSupportChat ? null : verificationType}
        />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 30 }}>
          <Ionicons name="ban" size={80} color="#ff3b30" />
          <Text style={{ color: isDark ? "#fff" : "#000", fontSize: 22, fontWeight: "bold", marginTop: 24 }}>
            You blocked {otherUser.name}
          </Text>
          <Text style={{ color: isDark ? "#ccc" : "#555", textAlign: "center", marginTop: 16, fontSize: 16 }}>
            You cannot send or receive messages from this user. Unblock them from your profile or settings if you change your mind.
          </Text>
          <TouchableOpacity
            style={{
              marginTop: 40,
              paddingVertical: 14,
              paddingHorizontal: 32,
              backgroundColor: "#036dd6",
              borderRadius: 12,
            }}
            onPress={() => navigation.goBack()}
          >
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#000" : "#f8f8f8" }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <MessageHeader
        userId={effectiveListingOwnerId}
        name={otherUser.name}
        photoURL={otherUser.photoURL}
        verificationType={isSupportChat ? null : verificationType}
      />

      <Modal visible={!!fullImage} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "#000" }}>
          <TouchableOpacity style={{ position: "absolute", top: 40, left: 20, zIndex: 10 }} onPress={() => setFullImage(null)}>
            <Ionicons name="close" size={36} color="#fff" />
          </TouchableOpacity>
          <Image source={{ uri: fullImage }} style={{ flex: 1, width: "100%" }} resizeMode="contain" />
        </View>
      </Modal>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        {showSuggestions && (
          <View style={[styles.suggestionsContainer, { backgroundColor: isDark ? "#111" : "#f8f9fa" }]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8 }}
            >
              {quickSuggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleQuickReply(suggestion)}
                  style={[
                    styles.suggestionChip,
                    { backgroundColor: isDark ? "#2a2a2a" : "#e9ecef" }
                  ]}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.suggestionText,
                      { color: isDark ? "#e0e0e0" : "#333" }
                    ]}
                    numberOfLines={1}
                  >
                    {suggestion}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Updated input bar */}
        <View style={styles.inputBar}>
          <View style={[
            styles.inputContainer,
            {
              backgroundColor: isDark ? "#1e1e1e" : "#fff",
              borderColor: isFocused ? "#000" : (isDark ? "#444" : "#ddd"),
            }
          ]}>
            {/* + button on LEFT */}
            <TouchableOpacity
              style={styles.attachButton}
              onPress={() => setMediaMenuVisible(true)}
              disabled={uploading || isBlocked}
            >
              <Ionicons
                name="add"
                size={28}
                color={uploading || isBlocked ? "#666" : "#000"}
              />
            </TouchableOpacity>

            {/* Growing TextInput */}
            <TextInput
              ref={inputRef}
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor={isDark ? "#666" : "#999"}
              value={inputText}
              onChangeText={setInputText}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              multiline
              numberOfLines={4}
              returnKeyType="send"
              blurOnSubmit={false}
              onSubmitEditing={sendMessage}
              editable={!uploading && !isBlocked}
            />

            {/* Right side: Mic or Send */}
            {inputText.trim().length === 0 ? (
              <TouchableOpacity
                style={styles.micButton}
                onPress={() => Alert.alert("Voice", "Voice recording coming soon...")}
                disabled={uploading || isBlocked}
              >
                <Ionicons
                  name="mic"
                  size={26}
                  color={uploading || isBlocked ? "#666" : "#000"}
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  { backgroundColor: "#000" }
                ]}
                onPress={sendMessage}
                disabled={uploading || isBlocked || !inputText.trim()}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="arrow-up" size={24} color="#fff" />
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={mediaMenuVisible} transparent animationType="fade" onRequestClose={() => setMediaMenuVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setMediaMenuVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.mediaMenu, { backgroundColor: isDark ? "#222" : "#fff" }]}>
              <TouchableOpacity style={styles.mediaOption} onPress={openCamera}>
                <Ionicons name="camera-outline" size={32} color="#036dd6" />
                <Text style={[styles.mediaText, { color: isDark ? "#fff" : "#000" }]}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.mediaOption} onPress={pickImage}>
                <Ionicons name="image-outline" size={32} color="#036dd6" />
                <Text style={[styles.mediaText, { color: isDark ? "#fff" : "#000" }]}>Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  messageContainer: { marginVertical: 6 },
  sent: { alignSelf: "flex-end" },
  received: { alignSelf: "flex-start" },
  bubble: { maxWidth: "75%", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
  sentBubble: { backgroundColor: "#000", borderBottomRightRadius: 6 },
  messageText: { fontSize: 16, lineHeight: 22 },
  messageFooter: { flexDirection: "row", alignItems: "center", marginTop: 6, justifyContent: "flex-end" },
  timestamp: { fontSize: 11, marginRight: 6 },
  inputBar: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#33333330",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderWidth: 1.9,
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  attachButton: {
    padding: 10,
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    paddingVertical: 8,
    paddingHorizontal: 12,
    color: "#000",
  },
  micButton: {
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  mediaMenu: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 30,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  mediaOption: {
    alignItems: "center",
    padding: 16,
  },
  mediaText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
  },
  suggestionsContainer: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: "#33333330",
  },
  suggestionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#44444460",
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: "500",
  },
});