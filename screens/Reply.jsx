import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Image,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { UserContext } from "../context/UserContext";
import { timeAgo } from "../utils/timeAgo";
import * as ImagePicker from "expo-image-picker";

export default function ReplyScreen() {
  const route = useRoute();
  const { comment, listingId } = route.params; // comment passed from CommentSection
  const { user } = useContext(UserContext);

  const [replies, setReplies] = useState([]);
  const [newReply, setNewReply] = useState("");
  const [imageUri, setImageUri] = useState(null);

  // Load replies from parent comment (simulate API)
  useEffect(() => {
    if (comment?.replies) setReplies(comment.replies);
  }, [comment]);

  // 📸 Pick an image
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Permission denied to access gallery.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  // ➕ Add new reply
  const handleAddReply = () => {
    if (!newReply.trim() && !imageUri) return;

    const replyObj = {
      id: Date.now().toString(),
      parentCommentId: comment.id,
      listingId,
      userId: user?.id || "guest",
      username: user?.fullName || "Guest User",
      text: newReply,
      image: imageUri,
      date: new Date().toISOString(),
      replies: [], // supports nested replies too
    };

    setReplies([replyObj, ...replies]);
    setNewReply("");
    setImageUri(null);
  };

  // 🔁 Recursive render for threaded replies
  const renderReplyItem = ({ item, level = 0 }) => (
    <View style={[styles.replyContainer, { marginLeft: level * 20 }]}>
      <View style={styles.replyBox}>
        <Text style={styles.username}>{item.username}</Text>
        <Text style={styles.replyText}>{item.text}</Text>
        {item.image && (
          <Image source={{ uri: item.image }} style={styles.replyImage} />
        )}
        <Text style={styles.date}>{timeAgo(item.date)}</Text>

        <TouchableOpacity
          onPress={() => handleReplyToReply(item)}
          style={styles.replyButton}
        >
          <Text style={styles.replyButtonText}>Reply</Text>
        </TouchableOpacity>
      </View>

      {/* Render nested replies recursively */}
      {item.replies?.length > 0 && (
        <FlatList
          data={item.replies}
          keyExtractor={(child) => child.id}
          renderItem={({ item: child }) =>
            renderReplyItem({ item: child, level: level + 1 })
          }
        />
      )}
    </View>
  );

  // Reply to a reply (nested)
  const handleReplyToReply = (parentReply) => {
    // Pre-fill with @username for context
    setNewReply(`@${parentReply.username} `);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={90}
      style={styles.container}
    >
      {/* Main comment being replied to */}
      <View style={styles.mainCommentBox}>
        <Text style={styles.username}>{comment.username}</Text>
        <Text style={styles.commentText}>{comment.text}</Text>
        {comment.image && (
          <Image source={{ uri: comment.image }} style={styles.commentImage} />
        )}
        <Text style={styles.date}>{timeAgo(comment.date)}</Text>
      </View>

      {/* Replies */}
      <FlatList
        data={replies}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => renderReplyItem({ item })}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* Reply input */}
      <View style={styles.inputContainer}>
        <TouchableOpacity onPress={pickImage}>
          <Text style={styles.attachText}>📎</Text>
        </TouchableOpacity>

        <TextInput
          value={newReply}
          onChangeText={setNewReply}
          placeholder="Write a reply..."
          style={styles.input}
        />

        <TouchableOpacity style={styles.sendButton} onPress={handleAddReply}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>

      {/* Image preview before posting */}
      {imageUri && (
        <View style={styles.previewContainer}>
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
          <TouchableOpacity
            style={styles.removeImageBtn}
            onPress={() => setImageUri(null)}
          >
            <Text style={styles.removeImageText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  mainCommentBox: {
    backgroundColor: "#f1f1f1",
    padding: 12,
    borderRadius: 10,
    margin: 10,
  },
  username: {
    fontWeight: "bold",
    fontSize: 14,
  },
  commentText: {
    fontSize: 14,
    marginVertical: 4,
  },
  commentImage: {
    width: "100%",
    height: 180,
    borderRadius: 8,
    marginTop: 6,
  },
  date: {
    fontSize: 12,
    color: "#888",
  },
  replyContainer: {
    marginVertical: 6,
    marginRight: 10,
  },
  replyBox: {
    backgroundColor: "#f8f8f8",
    padding: 8,
    borderRadius: 10,
  },
  replyText: {
    fontSize: 13,
  },
  replyImage: {
    width: "100%",
    height: 150,
    borderRadius: 8,
    marginTop: 5,
  },
  replyButton: {
    marginTop: 4,
  },
  replyButtonText: {
    color: "#007BFF",
    fontSize: 13,
  },
  inputContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#ddd",
    padding: 10,
  },
  attachText: {
    fontSize: 20,
    marginRight: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#f1f1f1",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  sendButton: {
    marginLeft: 10,
  },
  sendText: {
    color: "#007BFF",
    fontWeight: "bold",
  },
  previewContainer: {
    position: "absolute",
    bottom: 60,
    left: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  removeImageBtn: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#000",
    borderRadius: 10,
    paddingHorizontal: 4,
  },
  removeImageText: {
    color: "#fff",
    fontSize: 10,
  },
});
