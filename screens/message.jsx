// screens/Message.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  useColorScheme,
  SafeAreaView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import Constants from "expo-constants";
import { useUser } from "../context/UserContext";
import { KeyboardAwareFlatList } from "react-native-keyboard-aware-scroll-view";

// Backend URL
const BASE_URL = Constants.manifest?.extra?.BASE_URL || "http://192.168.56.1:5000";

export default function Message({ route, navigation }) {
  const colorScheme = useColorScheme();
  const { user: currentUser, loading: userLoading } = useUser();

  const { listingId = "", listingOwnerId = "", listingTitle = "Listing" } = route.params || {};

  const senderId = currentUser?._id || "";
  const receiverId = listingOwnerId;

  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Hide extra back arrow but keep header
  useEffect(() => {
    navigation.setOptions({ headerLeft: () => null });
  }, [navigation]);

  if (userLoading)
    return <ActivityIndicator size="large" color="#017a6b" style={{ flex: 1 }} />;

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!listingId || !senderId || !receiverId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await axios.get(
        `${BASE_URL}/api/messages/listing/${listingId}/${senderId}/${receiverId}`
      );
      setMessages(res.data);
    } catch (err) {
      console.error("Error fetching messages:", err.message);
    } finally {
      setLoading(false);
    }
  }, [listingId, senderId, receiverId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Send text message
  const sendMessage = async () => {
    if (!messageText.trim()) return;
    try {
      setSending(true);
      const res = await axios.post(
        `${BASE_URL}/api/messages`,
        { listingId, senderId, receiverId, content: messageText },
        { headers: { "Content-Type": "application/json" }, timeout: 10000 }
      );
      setMessages((prev) => [...prev, res.data]);
      setMessageText("");
    } catch (err) {
      console.error("Error sending message:", err.message);
    } finally {
      setSending(false);
    }
  };

  // Pick image from gallery
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.cancelled) sendImage(result.uri);
  };

  // Launch camera
  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.cancelled) sendImage(result.uri);
  };

  // Send image
  const sendImage = async (uri) => {
    try {
      const formData = new FormData();
      formData.append("listingId", listingId);
      formData.append("senderId", senderId);
      formData.append("receiverId", receiverId);
      formData.append("image", {
        uri,
        name: `image_${Date.now()}.jpg`,
        type: "image/jpeg",
      });

      const res = await axios.post(`${BASE_URL}/api/messages/image`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessages((prev) => [...prev, res.data]);
    } catch (err) {
      console.error("Error sending image:", err.message);
    }
  };

  // Render each message
  const renderItem = ({ item }) => {
    const isSender = item.senderId === senderId;
    return (
      <View
        style={[
          styles.messageBubble,
          isSender ? styles.myMessage : styles.receiverMessage,
          {
            backgroundColor:
              colorScheme === "dark"
                ? isSender
                  ? "#155740"
                  : "#333"
                : undefined,
          },
        ]}
      >
        <Text style={{ color: colorScheme === "dark" ? "#fff" : "#000", fontSize: 14 }}>
          {item.content || (item.image ? "📷 Image" : "")}
        </Text>
        <Text
          style={{
            color: colorScheme === "dark" ? "#ccc" : "gray",
            fontSize: 10,
            marginTop: 4,
            textAlign: "right",
          }}
        >
          {new Date(item.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    );
  };

  const themeStyles = colorScheme === "dark" ? darkTheme : lightTheme;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeStyles.container.backgroundColor }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeStyles.container.backgroundColor }]}>
        <Text
          style={[styles.listingTitle, { color: colorScheme === "dark" ? "#0df9a0" : "#017a6b" }]}
        >
          {listingTitle}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#017a6b" style={{ flex: 1 }} />
      ) : (
        <KeyboardAwareFlatList
          data={messages}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 10, flexGrow: 1, justifyContent: "flex-end" }}
          inverted
          keyboardShouldPersistTaps="handled"
        />
      )}

      {/* Input Row */}
      <View style={[styles.inputRow, themeStyles.inputRow]}>
        <TouchableOpacity style={styles.iconButton} onPress={pickImage}>
          <Ionicons
            name="image-outline"
            size={28}
            color={colorScheme === "dark" ? "#0df9a0" : "#017a6b"}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={takePhoto}>
          <Ionicons
            name="camera-outline"
            size={28}
            color={colorScheme === "dark" ? "#0df9a0" : "#017a6b"}
          />
        </TouchableOpacity>
        <TextInput
          style={[styles.input, themeStyles.input]}
          placeholder="Type a message..."
          placeholderTextColor={colorScheme === "dark" ? "#aaa" : "#888"}
          value={messageText}
          onChangeText={setMessageText}
          multiline
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={sendMessage}
          disabled={sending || !messageText.trim()}
        >
          <Ionicons name="send" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ------------------------------
// Theme styles
// ------------------------------
const lightTheme = StyleSheet.create({
  container: { backgroundColor: "#f5f5f5" },
  inputRow: { backgroundColor: "#fff" },
  input: { backgroundColor: "#eee", color: "#000" },
});

const darkTheme = StyleSheet.create({
  container: { backgroundColor: "#000" },
  inputRow: { backgroundColor: "#222" },
  input: { backgroundColor: "#333", color: "#fff" },
});

// ------------------------------
// Static styles
// ------------------------------
const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  listingTitle: { fontSize: 18, fontWeight: "bold" },
  inputRow: { flexDirection: "row", padding: 10, alignItems: "center" },
  input: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 25,
    marginLeft: 6,
    marginRight: 6,
    maxHeight: 100,
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#017a6b",
    justifyContent: "center",
    alignItems: "center",
  },
  iconButton: { paddingHorizontal: 6 },
  messageBubble: { padding: 10, borderRadius: 12, marginVertical: 4, maxWidth: "80%" },
  myMessage: { alignSelf: "flex-end", backgroundColor: "#DCF8C6" },
  receiverMessage: { alignSelf: "flex-start", backgroundColor: "#FFF", borderWidth: 1, borderColor: "#ccc" },
});
