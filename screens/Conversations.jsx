// screens/Conversations.jsx
import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  useColorScheme,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { UserContext } from "../context/UserContext";
import Constants from "expo-constants";

// Backend URL
const BASE_URL = Constants.manifest?.extra?.BASE_URL || "http://192.168.56.1:5000";

export default function Conversations() {
  const { user } = useContext(UserContext);
  const navigation = useNavigation();
  const colorScheme = useColorScheme();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      if (!user?._id) return;

      try {
        setLoading(true);
        const res = await axios.get(`${BASE_URL}/api/messages/${user._id}`);
        setConversations(res.data);
      } catch (err) {
        console.error("Error fetching conversations:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [user]);

  const openConversation = (listingId, otherUserId, listingTitle) => {
    navigation.navigate("Message", {
      listingId,
      listingOwnerId: otherUserId,
      listingTitle,
    });
  };

  const renderItem = ({ item }) => {
    const isSender = item.senderId === user._id;
    const otherUserId = isSender ? item.receiverId : item.senderId;
    const latestMessage = item.content;
    const listingTitle = item.listingId?.title || "Listing";

    return (
      <TouchableOpacity
        style={[
          styles.thread,
          { backgroundColor: colorScheme === "dark" ? "#222" : "#fff" },
        ]}
        onPress={() => openConversation(item.listingId?._id, otherUserId, listingTitle)}
      >
        <Text style={[styles.listingTitle, { color: colorScheme === "dark" ? "#0df9a0" : "#017a6b" }]}>
          {listingTitle}
        </Text>
        <Text style={[styles.messagePreview, { color: colorScheme === "dark" ? "#ccc" : "#555" }]}>
          {latestMessage}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) return <ActivityIndicator size="large" color="#017a6b" style={{ flex: 1 }} />;

  if (!conversations.length)
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: colorScheme === "dark" ? "#fff" : "#000" }}>No messages yet</Text>
      </View>
    );

  return (
    <View style={[styles.container, { backgroundColor: colorScheme === "dark" ? "#000" : "#f5f5f5" }]}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 10 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  thread: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  messagePreview: {
    fontSize: 14,
  },
});
