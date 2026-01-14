// component/ChatInput.jsx - FINAL & BULLETPROOF (2025)
import React from "react";
import { View, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ChatInput({
  messageText,
  setMessageText,
  onSend,
  onPickImage,
  onTakePhoto,
  sending,
  colorScheme,
}) {
  const isDark = colorScheme === "dark";

  const handleSend = () => {
    const text = messageText.trim();
    if (text && !sending) {
      onSend(text);        // Send the actual text
      setMessageText("");  // Clear input ONLY here (not in Message.jsx)
    }
  };

  return (
    <View style={[styles.inputRow, { backgroundColor: isDark ? "#222" : "#fff" }]}>
      <TouchableOpacity style={styles.iconButton} onPress={onPickImage}>
        <Ionicons name="image-outline" size={28} color={isDark ? "#0df9a0" : "#017a6b"} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.iconButton} onPress={onTakePhoto}>
        <Ionicons name="camera-outline" size={28} color={isDark ? "#0df9a0" : "#017a6b"} />
      </TouchableOpacity>

      <TextInput
        style={[
          styles.input,
          { backgroundColor: isDark ? "#333" : "#eee", color: isDark ? "#fff" : "#000" },
        ]}
        placeholder="Type a message..."
        placeholderTextColor={isDark ? "#aaa" : "#888"}
        value={messageText}
        onChangeText={setMessageText}
        multiline
        returnKeyType="send"
        onSubmitEditing={handleSend}
        blurOnSubmit={false}
      />

      <TouchableOpacity
        style={[
          styles.sendButton,
          {
            backgroundColor: messageText.trim() ? "#017a6b" : "#666",
            opacity: messageText.trim() ? 1 : 0.6,
          },
        ]}
        onPress={handleSend}
        disabled={sending || !messageText.trim()}
      >
        <Ionicons name="send" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  inputRow: {
    flexDirection: "row",
    padding: 10,
    alignItems: "flex-end",
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    marginHorizontal: 8,
    maxHeight: 120,
    fontSize: 16,
    minHeight: 50,
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  iconButton: {
    padding: 8,
  },
});