// screens/Message.jsx - FIXED: Message Notifications Working
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
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";
import Hyperlink from "react-native-hyperlink";
import { Linking } from "react-native";
import MessageHeader from "../component/MessageHeader";
import Record from "../component/record";
import { auth } from "../firebaseConfig";

const SUPPORT_UID = "lhtmGCryMfNNA9suQct1l5PeBSI3";

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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const params = route.params || {};

  const {
    listingId,
    listingOwnerId: routeListingOwnerId,
    otherUserId,
    recipientUID,
    otherUserName: paramName = "User",
    otherUserPhoto: paramPhoto,
    listing: passedListing,
    ownerInfo,
    listingTitle,
  } = params;

  const isSupportChat = !!recipientUID && recipientUID === SUPPORT_UID;
  const effectiveListingOwnerId = otherUserId || recipientUID || routeListingOwnerId || SUPPORT_UID;
  const effectiveListingId = isSupportChat
    ? `support_${[auth.currentUser?.uid || "guest", effectiveListingOwnerId].sort().join("_")}`
    : listingId;

  // States
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [listingLoading, setListingLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [fullImage, setFullImage] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [listing, setListing] = useState(passedListing || null);
  const [otherUser, setOtherUser] = useState({
    name: ownerInfo?.name || paramName || "Host",
    photoURL: ownerInfo?.avatar || paramPhoto || null,
  });
  const [verificationType, setVerificationType] = useState(ownerInfo?.verificationType || null);
  const [mediaMenuVisible, setMediaMenuVisible] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);

  const flatListRef = useRef();
  const inputRef = useRef(null);
  const currentlyPlayingSound = useRef(null);

  const currentUserId = auth.currentUser?.uid || `guest-${Date.now()}`;
  const currentUserName = auth.currentUser?.displayName || "Guest User";

  const quickSuggestions = [
    "Is your apartment still available?",
    "What's the current rent price?",
    "Can I schedule a viewing this weekend?",
    "Are pets allowed?",
    "Are utilities included in the rent?",
    "Any agent or legal fees?",
    "When is the earliest move-in date?",
  ];

  // ==================== MESSAGE NOTIFICATION TRIGGER ====================
  const triggerMessageNotification = async (receiverId, senderId, messageContent) => {
    if (!receiverId || receiverId === senderId) return;

    try {
      await addDoc(collection(db, "notifications"), {
        userId: receiverId,
        type: "message",
        title: "New Message",
        message: messageContent.length > 65
          ? messageContent.substring(0, 62) + "..."
          : messageContent,
        senderId: senderId,
        chatId: effectiveListingId,           // Important for deep linking later
        read: false,
        createdAt: serverTimestamp(),
      });
      console.log(`✅ Message notification triggered for receiver: ${receiverId}`);
    } catch (err) {
      console.error("Failed to trigger message notification:", err);
    }
  };

  // ==================== DELETE MESSAGE ====================
  const deleteMessage = async (messageId, deleteForEveryone = false) => {
    if (!messageId) return;
    try {
      const messageRef = doc(db, "messages", messageId);
      if (deleteForEveryone) {
        await updateDoc(messageRef, { deletedForEveryone: true });
      } else {
        await updateDoc(messageRef, {
          deletedForMe: true,
          deletedBy: currentUserId,
        });
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error("Delete failed:", error);
      Alert.alert("Error", "Failed to delete message");
    } finally {
      setDeleteModalVisible(false);
      setSelectedMessage(null);
    }
  };

  const openDeleteModal = (message) => {
    setSelectedMessage(message);
    setDeleteModalVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // ==================== MESSAGE STATUS ====================
  const MessageStatus = ({ status }) => {
    if (!status) return null;
    const color = status === "read" ? "#34C759" : "#8E8E93";
    return (
      <View style={{ flexDirection: "row", alignItems: "center", marginLeft: 4 }}>
        {status === "sent" && <Ionicons name="checkmark" size={14} color={color} />}
        {(status === "delivered" || status === "read") && (
          <Ionicons name="checkmark-done" size={14} color={color} style={{ marginLeft: -3 }} />
        )}
      </View>
    );
  };

  const getReadStatus = (message) => {
    if (!auth.currentUser?.uid || message.senderId !== currentUserId) return null;
    if (message._optimistic) return "sent";
    const isRead = Array.isArray(message.readBy) && message.readBy.includes(effectiveListingOwnerId);
    return isRead ? "read" : "delivered";
  };

  // ==================== VOICE MESSAGE BUBBLE ====================
  const VoiceMessageBubble = ({ item, isMe }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const soundRef = useRef(null);

    useEffect(() => {
      return () => {
        if (soundRef.current) {
          soundRef.current.unloadAsync().catch(() => {});
          soundRef.current = null;
        }
      };
    }, [item.id]);

    const togglePlayback = async () => {
      if (!item.audioUrl) return;
      try {
        if (currentlyPlayingSound.current && currentlyPlayingSound.current !== soundRef.current) {
          await currentlyPlayingSound.current.pauseAsync().catch(() => {});
        }
        if (!soundRef.current) {
          setIsLoading(true);
          const { sound: newSound } = await Audio.Sound.createAsync(
            { uri: item.audioUrl },
            { shouldPlay: false, progressUpdateIntervalMillis: 100 },
            (status) => {
              if (status.isLoaded) {
                setIsPlaying(status.isPlaying);
                if (status.didJustFinish) {
                  setIsPlaying(false);
                  currentlyPlayingSound.current = null;
                }
              }
            }
          );
          soundRef.current = newSound;
          currentlyPlayingSound.current = newSound;
        }
        const status = await soundRef.current.getStatusAsync();
        if (status.isPlaying) {
          await soundRef.current.pauseAsync();
          setIsPlaying(false);
          currentlyPlayingSound.current = null;
        } else {
          if (status.positionMillis >= (status.durationMillis || 0)) {
            await soundRef.current.setPositionAsync(0);
          }
          await soundRef.current.playAsync();
          setIsPlaying(true);
          currentlyPlayingSound.current = soundRef.current;
        }
      } catch (error) {
        console.error("Voice playback error:", error);
        Alert.alert("Playback Error", "Could not play this voice message.");
        if (soundRef.current) {
          soundRef.current.unloadAsync().catch(() => {});
          soundRef.current = null;
        }
        currentlyPlayingSound.current = null;
        setIsPlaying(false);
      } finally {
        setIsLoading(false);
      }
    };

    const displayDuration = item.duration
      ? `${Math.floor(item.duration / 60)}:${(item.duration % 60).toString().padStart(2, "0")}`
      : "0:00";

    return (
      <TouchableOpacity
        onLongPress={() => openDeleteModal(item)}
        activeOpacity={0.8}
        style={[styles.messageContainer, isMe ? styles.sent : styles.received]}
      >
        <TouchableOpacity
          style={[styles.audioBubble, isMe ? styles.sentBubble : styles.receivedBubble]}
          onPress={togglePlayback}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={isMe ? "#fff" : "#017a6b"} />
          ) : (
            <Ionicons
              name={isPlaying ? "pause-circle" : "play-circle"}
              size={38}
              color={isMe ? "#fff" : "#017a6b"}
            />
          )}
          <View style={styles.audioInfo}>
            <Text style={[styles.audioDuration, { color: isMe ? "#ddd" : "#555" }]}>
              {displayDuration}
            </Text>
          </View>
        </TouchableOpacity>
        <View style={styles.messageFooter}>
          <Text style={[styles.timestamp, { color: isMe ? "#ccc" : "#999" }]}>
            {formatMessageTime(item.createdAt)}
          </Text>
          {isMe && <MessageStatus status={getReadStatus(item)} />}
        </View>
      </TouchableOpacity>
    );
  };

  // ==================== RENDER MESSAGE ====================
  const renderMessage = ({ item }) => {
    const isMe = item.senderId === currentUserId;

    if (item.deletedForEveryone || (item.deletedForMe && item.deletedBy === currentUserId)) {
      return (
        <View style={[styles.messageContainer, isMe ? styles.sent : styles.received]}>
          <View style={[styles.bubble, { backgroundColor: isDark ? "#333" : "#e5e5ea", opacity: 0.7 }]}>
            <Text style={[styles.messageText, { fontStyle: "italic", color: "#888" }]}>
              This message was deleted
            </Text>
            <View style={styles.messageFooter}>
              <Text style={[styles.timestamp, { color: isMe ? "#ccc" : "#999" }]}>
                {formatMessageTime(item.createdAt)}
              </Text>
            </View>
          </View>
        </View>
      );
    }

    if (item.type === "audio" && item.audioUrl) {
      return <VoiceMessageBubble item={item} isMe={isMe} />;
    }

    if (item.type === "image") {
      return (
        <TouchableOpacity
          onLongPress={() => openDeleteModal(item)}
          activeOpacity={0.9}
          style={[styles.messageContainer, isMe ? styles.sent : styles.received]}
        >
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
            {isMe && <MessageStatus status={getReadStatus(item)} />}
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        onLongPress={() => openDeleteModal(item)}
        activeOpacity={0.9}
        style={[styles.messageContainer, isMe ? styles.sent : styles.received]}
      >
        <View style={[styles.bubble, isMe ? styles.sentBubble : { backgroundColor: isDark ? "#333" : "#e5e5ea" }]}>
          <Hyperlink
            linkDefault
            onPress={(url) => Linking.openURL(url)}
            linkStyle={{ color: "#00A3FF", textDecorationLine: "underline" }}
          >
            <Text style={[styles.messageText, { color: isMe ? "#fff" : isDark ? "#eee" : "#111" }]}>
              {item.content}
            </Text>
          </Hyperlink>
          <View style={styles.messageFooter}>
            <Text style={[styles.timestamp, { color: isMe ? "#ccc" : "#999" }]}>
              {formatMessageTime(item.createdAt)}
            </Text>
            {isMe && <MessageStatus status={getReadStatus(item)} />}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ==================== SEND FUNCTIONS WITH NOTIFICATION ====================
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
      senderName: currentUserName,
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
        senderName: currentUserName,
        receiverId: effectiveListingOwnerId || null,
        listingId: effectiveListingId,
        createdAt: serverTimestamp(),
        readBy: [],
        type: "text",
      });

      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, id: docRef.id, _optimistic: false } : m))
      );

      // Trigger notification to receiver
      await triggerMessageNotification(effectiveListingOwnerId, currentUserId, textToSend);
    } catch (error) {
      Alert.alert("Failed", "Message not sent");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInputText(textToSend);
    }
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
        senderName: currentUserName,
        receiverId: effectiveListingOwnerId || null,
        listingId: effectiveListingId,
        createdAt: serverTimestamp(),
        readBy: [],
        type: "image",
      });

      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, id: docRef.id, _optimistic: false } : m))
      );

      // Trigger notification
      await triggerMessageNotification(effectiveListingOwnerId, currentUserId, "[Image]");
    } catch (e) {
      Alert.alert("Error", "Image upload failed");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setUploading(false);
    }
  };

  const sendAudioMessage = async (audioUri, duration) => {
    if (!audioUri || uploading || isBlocked) return;
    setUploading(true);
    heavyVibrate();

    const tempId = Date.now().toString();
    const optimisticAudio = {
      id: tempId,
      audioUrl: audioUri,
      senderId: currentUserId,
      receiverId: effectiveListingOwnerId || null,
      listingId: effectiveListingId,
      createdAt: { toDate: () => new Date() },
      type: "audio",
      duration: duration,
      _optimistic: true,
    };

    setMessages((prev) => [...prev, optimisticAudio]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const response = await fetch(audioUri);
      const blob = await response.blob();
      const filename = `voice_${Date.now()}.m4a`;
      const storageRef = ref(storage, `chat_audio/${effectiveListingId}/${filename}`);
      const uploadTask = uploadBytesResumable(storageRef, blob);

      const downloadURL = await new Promise((resolve, reject) => {
        uploadTask.on("state_changed", null, reject, async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(url);
        });
      });

      await addDoc(collection(db, "messages"), {
        audioUrl: downloadURL,
        senderId: currentUserId,
        senderName: currentUserName,
        receiverId: effectiveListingOwnerId || null,
        listingId: effectiveListingId,
        createdAt: serverTimestamp(),
        readBy: [],
        type: "audio",
        duration: duration,
      });

      // Trigger notification
      await triggerMessageNotification(effectiveListingOwnerId, currentUserId, "[Voice Message]");
    } catch (error) {
      Alert.alert("Error", "Failed to send voice message");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setUploading(false);
    }
  };

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

  // ==================== OTHER FUNCTIONS ====================
  const pickImage = async () => {
    heavyVibrate();
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "image/*",
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        sendImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to open gallery.");
    } finally {
      setMediaMenuVisible(false);
    }
  };

  const openCamera = async () => {
    heavyVibrate();
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Camera access required.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        sendImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Could not open camera.");
    } finally {
      setMediaMenuVisible(false);
    }
  };

  const handleQuickReply = (text) => {
    setInputText(text);
    setShowSuggestions(false);
  };

  const heavyVibrate = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 60);
  };

  // ==================== USE EFFECTS ====================
  useEffect(() => {
    const loadListing = async () => {
      if (!effectiveListingId || isSupportChat) {
        setListingLoading(false);
        return;
      }
      if (passedListing?.title) {
        setListing(passedListing);
        setListingLoading(false);
        return;
      }
      try {
        const listingRef = doc(db, "listings", effectiveListingId);
        const snap = await getDoc(listingRef);
        if (snap.exists()) {
          const data = snap.data();
          setListing({
            id: effectiveListingId,
            title: data.title || data.propertyTitle || listingTitle || "Property Listing",
            images: data.images || data.imageUrls || data.photos || [],
            priceMonthly: data.priceMonthly || data.monthlyRent,
            priceYearly: data.priceYearly || data.yearlyRent,
            location: data.location || data.address || "Location not specified",
          });
        } else {
          setListing({ title: listingTitle || "Property Listing", images: [], priceMonthly: null, priceYearly: null, location: "Location not specified" });
        }
      } catch (err) {
        console.error("Error fetching listing details:", err);
        setListing({ title: listingTitle || "Property Listing", images: [], priceMonthly: null, priceYearly: null, location: "Location not specified" });
      } finally {
        setListingLoading(false);
      }
    };
    loadListing();
  }, [effectiveListingId, passedListing, listingTitle, isSupportChat]);

  useEffect(() => {
    if (!auth.currentUser?.uid || !effectiveListingOwnerId || isSupportChat) {
      setIsBlocked(false);
      return;
    }
    const userRef = doc(db, "users", auth.currentUser.uid);
    const unsub = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const blockedList = snap.data().blocked || [];
        setIsBlocked(blockedList.includes(effectiveListingOwnerId));
      } else {
        setIsBlocked(false);
      }
    });
    return unsub;
  }, [effectiveListingOwnerId, isSupportChat]);

  useEffect(() => {
    if (!effectiveListingOwnerId) return;
    const userRef = doc(db, "users", effectiveListingOwnerId);
    const unsubscribe = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const displayName = data.fullName?.trim() || `${data.firstName || ""} ${data.lastName || ""}`.trim() || data.username || "Host";
        setOtherUser((prev) => ({
          ...prev,
          name: displayName,
          photoURL: data.photoURL || data.avatar || prev.photoURL,
        }));
        if (data.verificationType) setVerificationType(data.verificationType);
      }
    });
    return () => unsubscribe();
  }, [effectiveListingOwnerId]);

  useEffect(() => {
    if (!effectiveListingId) {
      setLoading(false);
      return;
    }
    const q = query(
      collection(db, "messages"),
      where("listingId", "==", effectiveListingId),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs
        .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
        .filter((m) => {
          if (m.deletedForEveryone) return false;
          if (m.deletedForMe && m.deletedBy === currentUserId) return false;
          if (!auth.currentUser?.uid) return true;
          return (
            (m.senderId === auth.currentUser.uid && (!m.receiverId || m.receiverId === effectiveListingOwnerId)) ||
            (m.receiverId === auth.currentUser.uid && m.senderId === effectiveListingOwnerId)
          );
        });
      setMessages(msgs);
      setLoading(false);

      if (auth.currentUser?.uid) {
        const toMark = msgs.filter(
          (m) => m.receiverId === auth.currentUser.uid && !(Array.isArray(m.readBy) && m.readBy.includes(auth.currentUser.uid))
        );
        toMark.forEach((m) => {
          updateDoc(doc(db, "messages", m.id), { readBy: arrayUnion(auth.currentUser.uid) }).catch(() => {});
        });
      }
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });
    return unsub;
  }, [effectiveListingId, currentUserId, effectiveListingOwnerId]);

  useEffect(() => {
    if (messages.length > 3) setShowSuggestions(false);
  }, [messages.length]);

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
            You cannot send or receive messages from this user.
          </Text>
          <TouchableOpacity
            style={{ marginTop: 40, paddingVertical: 14, paddingHorizontal: 32, backgroundColor: "#036dd6", borderRadius: 12 }}
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

      {!isSupportChat && (
        <View style={styles.listingHeaderContainer}>
          {listingLoading ? (
            <View style={styles.listingHeader}>
              <ActivityIndicator size="small" color="#017a6b" />
            </View>
          ) : listing ? (
            <View style={styles.listingHeader}>
              {listing.images?.length > 0 && (
                <Image source={{ uri: listing.images[0] }} style={styles.listingImage} resizeMode="cover" />
              )}
              <View style={styles.listingInfo}>
                <Text style={styles.listingTitle} numberOfLines={2}>
                  {listing.title || listingTitle || "Property Listing"}
                </Text>
                <Text style={styles.listingPrice}>
                  {listing.priceMonthly
                    ? `₦${listing.priceMonthly.toLocaleString()}/month`
                    : listing.priceYearly
                    ? `₦${listing.priceYearly.toLocaleString()}/year`
                    : "Price on request"}
                </Text>
                {listing.location && <Text style={styles.listingLocation}>📍 {listing.location}</Text>}
              </View>
            </View>
          ) : null}
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.select({ ios: 90, android: 0 })}
        style={{ flex: 1 }}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
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
                  style={[styles.suggestionChip, { backgroundColor: isDark ? "#2a2a2a" : "#e9ecef" }]}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.suggestionText, { color: isDark ? "#e0e0e0" : "#333" }]} numberOfLines={1}>
                    {suggestion}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.inputBar}>
          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={styles.attachButton}
              onPress={() => setMediaMenuVisible(true)}
              disabled={uploading || isBlocked}
            >
              <Ionicons name="add" size={24} color={uploading || isBlocked ? "#666" : "#000"} />
            </TouchableOpacity>
            <TextInput
              ref={inputRef}
              style={styles.textInput}
              placeholder="Type a message..."
              placeholderTextColor={isDark ? "#666" : "#999"}
              value={inputText}
              onChangeText={setInputText}
              multiline
              numberOfLines={4}
              returnKeyType="send"
              blurOnSubmit={false}
              onSubmitEditing={sendMessage}
              editable={!uploading && !isBlocked}
            />
            {inputText.trim().length > 0 ? (
              <TouchableOpacity
                style={styles.sendButton}
                onPress={sendMessage}
                disabled={uploading || isBlocked || !inputText.trim()}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="arrow-up" size={22} color="#fff" />
                )}
              </TouchableOpacity>
            ) : (
              <Record onRecordingComplete={sendAudioMessage} isDisabled={uploading || isBlocked} />
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Full Image Modal */}
      <Modal visible={!!fullImage} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "#000" }}>
          <TouchableOpacity
            style={{ position: "absolute", top: 40, left: 20, zIndex: 10 }}
            onPress={() => setFullImage(null)}
          >
            <Ionicons name="close" size={36} color="#fff" />
          </TouchableOpacity>
          <Image source={{ uri: fullImage }} style={{ flex: 1, width: "100%" }} resizeMode="contain" />
        </View>
      </Modal>

      {/* Media Menu Modal */}
      <Modal
        visible={mediaMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMediaMenuVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setMediaMenuVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.mediaMenu, { backgroundColor: isDark ? "#222" : "#fff" }]}>
              <TouchableOpacity style={styles.mediaOption} onPress={openCamera}>
                <Ionicons name="camera-outline" size={32} color="#017a6b" />
                <Text style={[styles.mediaText, { color: isDark ? "#fff" : "#000" }]}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.mediaOption} onPress={pickImage}>
                <Ionicons name="image-outline" size={32} color="#017a6b" />
                <Text style={[styles.mediaText, { color: isDark ? "#fff" : "#000" }]}>Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Delete Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setDeleteModalVisible(false)}>
          <View style={styles.deleteModalOverlay}>
            <View style={[styles.deleteModalContent, { backgroundColor: isDark ? "#222" : "#fff" }]}>
              <Text style={[styles.deleteModalTitle, { color: isDark ? "#fff" : "#000" }]}>
                Message Options
              </Text>
              <TouchableOpacity
                style={styles.deleteOption}
                onPress={() => deleteMessage(selectedMessage?.id, false)}
              >
                <Ionicons name="trash-outline" size={22} color="#ff3b30" />
                <Text style={styles.deleteOptionText}>Delete for me</Text>
              </TouchableOpacity>
              {selectedMessage?.senderId === currentUserId && (
                <TouchableOpacity
                  style={styles.deleteOption}
                  onPress={() => deleteMessage(selectedMessage?.id, true)}
                >
                  <Ionicons name="trash-outline" size={22} color="#ff3b30" />
                  <Text style={styles.deleteOptionText}>Delete for everyone</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.deleteOption, styles.cancelOption]}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
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
  audioBubble: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    maxWidth: "75%",
  },
  receivedBubble: { backgroundColor: "#e5e5ea" },
  audioInfo: { marginLeft: 12, justifyContent: "center" },
  audioDuration: { fontSize: 15, fontWeight: "600" },
  inputBar: {
    width: "100%",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 20 : 6,
    borderTopWidth: 1,
    borderTopColor: "#33333330",
    backgroundColor: "#fff",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 28,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#44444440",
    backgroundColor: "#f8f9fa",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  attachButton: { padding: 8, marginRight: 6 },
  textInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 20,
    paddingVertical: 6,
    paddingHorizontal: 8,
    color: "#000",
    maxHeight: 100
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 6,
    backgroundColor: "#000",
  },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  mediaMenu: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 30,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  mediaOption: { alignItems: "center", padding: 16 },
  mediaText: { marginTop: 8, fontSize: 14, fontWeight: "600" },
  suggestionsContainer: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: "#33333330",
  },
  suggestionChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#44444460",
  },
  suggestionText: { fontSize: 14, fontWeight: "500" },
  listingHeaderContainer: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  listingHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 12,
  },
  listingImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 12,
  },
  listingInfo: { flex: 1 },
  listingTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
    color: "#111",
  },
  listingPrice: {
    fontSize: 15,
    fontWeight: "600",
    color: "#017a6b",
    marginBottom: 4,
  },
  listingLocation: {
    fontSize: 13,
    color: "#666",
  },
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  deleteModalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  deleteModalTitle: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginVertical: 12,
  },
  deleteOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#eeeeee60",
  },
  deleteOptionText: {
    fontSize: 17,
    marginLeft: 12,
    color: "#ff3b30",
  },
  cancelOption: {
    borderTopWidth: 1,
    borderTopColor: "#eeeeee60",
    justifyContent: "center",
  },
  cancelText: {
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
    color: "#007AFF",
  },
});