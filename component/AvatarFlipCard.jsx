// components/AvatarFlipCard.jsx
import React from "react";
import { View, Text, Image, TouchableOpacity, Animated, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useUser } from "../context/UserContext";

const FRONT_SIZE = 110; // Keep same as ProfileLayout

export default function AvatarFlipCard({ toggleFlip, containerAnimated, frontAnimated, backAnimated }) {
  const navigation = useNavigation();
  const { user, visitedUser, isOwner } = useUser();

  // Decide whose profile we are displaying
  const displayUser = visitedUser || user;

  return (
    <TouchableOpacity onPress={toggleFlip} style={styles.flipPressable}>
      <Animated.View style={[styles.flipContainer, containerAnimated]}>
        {/* Front of card */}
        <Animated.View style={[styles.face, frontAnimated]}>
          {displayUser?.avatar ? (
            <Image source={{ uri: displayUser.avatar }} style={styles.frontAvatar} />
          ) : (
            <View style={styles.frontAvatarPlaceholder} />
          )}
        </Animated.View>

        {/* Back of card */}
        <Animated.View style={[styles.face, styles.backFace, backAnimated]}>
          <LinearGradient colors={["#1A237E", "#3949AB"]} style={styles.cardInner}>
            {/* Watermark */}
            <View style={styles.watermark}>
              {Array.from({ length: 40 }).map((_, i) => (
                <Text
                  key={i}
                  style={[styles.watermarkText, { transform: [{ rotate: i % 3 ? "8deg" : "-10deg" }] }]}
                >
                  RoomLink
                </Text>
              ))}
            </View>

            {/* Avatar */}
            <Image source={{ uri: displayUser?.avatar }} style={styles.cardAvatar} />

            {/* Name */}
            <Text style={styles.cardName}>
              {displayUser?.firstName} {displayUser?.lastName || ""}
            </Text>

            {/* Verified / Not Verified / Owner-only Verify Button */}
            {displayUser?.isVerified ? (
              <Text style={styles.verifiedText}>
                Verified since {displayUser?.verifiedDate || "2025"}
              </Text>
            ) : isOwner ? (
              <TouchableOpacity
                style={styles.getVerifiedButton}
                onPress={() => navigation.navigate("IdentityVerification")}
              >
                <Text style={styles.getVerifiedText}>Verify your identity</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.notVerifiedText}>Not Verified</Text>
            )}
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  flipPressable: { alignItems: "center", justifyContent: "center" },
  flipContainer: { alignItems: "center", justifyContent: "center", overflow: "hidden" },
  face: { position: "absolute", left: 0, top: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  backFace: {},
  frontAvatar: {
    width: FRONT_SIZE - 6,
    height: FRONT_SIZE - 6,
    borderRadius: (FRONT_SIZE - 6) / 2,
    borderWidth: 4,
    borderColor: "#fff",
  },
  frontAvatarPlaceholder: {
    width: FRONT_SIZE - 6,
    height: FRONT_SIZE - 6,
    borderRadius: (FRONT_SIZE - 6) / 2,
    borderWidth: 4,
    borderColor: "#fff",
    backgroundColor: "#ccc",
  },
  cardInner: { width: "100%", height: "100%", borderRadius: 12, alignItems: "center", justifyContent: "center", padding: 16, overflow: "hidden" },
  watermark: { ...StyleSheet.absoluteFillObject, opacity: 0.08, justifyContent: "center", alignItems: "center", flexDirection: "row", flexWrap: "wrap" },
  watermarkText: { fontSize: 12, color: "#fff", margin: 3, textTransform: "uppercase" },
  cardAvatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: "#fff", marginBottom: 8 },
  cardName: { fontSize: 18, fontWeight: "700", color: "#fff", marginBottom: 6, textAlign: "center" },
  verifiedText: { fontSize: 14, color: "#fff", marginBottom: 6, textAlign: "center" },
  notVerifiedText: { fontSize: 14, color: "#fff", marginBottom: 8, textAlign: "center" },
  getVerifiedButton: { backgroundColor: "#fff", paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8, marginTop: 6 },
  getVerifiedText: { color: "#1A237E", fontWeight: "700" },
});
