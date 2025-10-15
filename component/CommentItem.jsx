import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import Avatar from "./avatar";
import { timeAgo } from "../utils/timeAgo";

export default function CommentItem({ userName, userAvatar, text, date, image, onPressProfile, onPressImage }) {
  return (
    <View style={styles.commentShield}>
      <TouchableOpacity
        style={{ flexDirection: "row", alignItems: "flex-start", gap: 8, flex: 1 }}
        activeOpacity={0.7}
        onPress={onPressProfile}
      >
        <Avatar uri={userAvatar} size={36} />
        <View style={{ marginLeft: 8, flex: 1 }}>
          <Text style={{ fontWeight: "600", color: "#000" }}>{userName || "Unknown"}</Text>
          <Text style={{ color: "#555", fontSize: 13 }}>{text || ""}</Text>
        </View>
        <Text style={{ fontSize: 12, color: "#999" }}>{timeAgo(date)}</Text>
      </TouchableOpacity>

      {image && (
        <TouchableOpacity onPress={onPressImage} style={{ marginTop: 5 }}>
          <Image source={{ uri: image }} style={{ width: 100, height: 100, borderRadius: 8 }} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  commentShield: {
    flexDirection: "column",
    marginVertical: 8,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
  },
});
