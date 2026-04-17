// components/VisitorEliteProfile.jsx - VISITOR VERSION (Read-only, no edit buttons)
import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  Image,
  Dimensions,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useUser } from "../context/UserContext";
import Avatar from "./avatar";
import BlueBadge from "../assets/icons/blue.svg";
import YellowBadge from "../assets/icons/yellow.svg";
import RedBadge from "../assets/icons/red.svg";
import Trust from "../component/Trust";

const { width } = Dimensions.get("window");
const AVATAR_SIZE = 100;
const CARD_WIDTH = Math.min(420, width - 40);
const CARD_HEIGHT = 224;
const FLIP_DURATION = 600;
const ACCENT_COLOR = "#0055FF";

export default function VisitorEliteProfile({ userId: propUserId, visitedUserListings = [] }) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const navigation = useNavigation();
  const route = useRoute();

  const { user: currentUser } = useUser();

  const routeUserId = route?.params?.userId || propUserId;

  const [displayUser, setDisplayUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [headerColor, setHeaderColor] = useState("#0A0E27");

  const flip = useSharedValue(0);

  const currentUserId = currentUser?.id || currentUser?.uid;
  const viewedUserId = routeUserId || displayUser?.id || displayUser?.uid;

  const isOwner = useMemo(() => {
    if (!currentUserId || !viewedUserId) return false;
    return currentUserId === viewedUserId;
  }, [currentUserId, viewedUserId]);

  // Real-time listener for the visited user
  useEffect(() => {
    const targetUid = routeUserId || viewedUserId;
    if (!targetUid) {
      setDisplayUser(null);
      setLoadingUser(false);
      return;
    }

    setLoadingUser(true);

    const unsub = onSnapshot(
      doc(db, "users", targetUid),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setDisplayUser({ id: targetUid, uid: targetUid, ...data });
          setHeaderColor(data.headerColor || "#0A0E27");
        } else {
          setDisplayUser(null);
        }
        setLoadingUser(false);
      },
      (err) => {
        console.error("[VISITOR ELITE PROFILE] Snapshot error:", err);
        setLoadingUser(false);
      }
    );

    return () => unsub();
  }, [routeUserId, viewedUserId]);

  const toggleFlip = () => {
    flip.value = withTiming(flip.value === 0 ? 1 : 0, { duration: FLIP_DURATION });
  };

  const animatedContainer = useAnimatedStyle(() => ({
    width: interpolate(flip.value, [0, 1], [AVATAR_SIZE, CARD_WIDTH], Extrapolate.CLAMP),
    height: interpolate(flip.value, [0, 1], [AVATAR_SIZE, CARD_HEIGHT], Extrapolate.CLAMP),
    borderRadius: interpolate(flip.value, [0, 1], [AVATAR_SIZE / 2, 20], Extrapolate.CLAMP),
  }));

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${interpolate(flip.value, [0, 1], [0, 180])}deg` }],
    opacity: interpolate(flip.value, [0, 0.5, 1], [1, 0, 0]),
    backfaceVisibility: "hidden",
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${interpolate(flip.value, [0, 1], [180, 360])}deg` }],
    opacity: interpolate(flip.value, [0, 0.5, 1], [0, 0, 1]),
    backfaceVisibility: "hidden",
  }));

  const goToListings = () => {
    const targetUserId = viewedUserId || routeUserId;
    if (!targetUserId) return;
    navigation.push("ProfileListingsScreen", { userId: targetUserId });
  };

  if (loadingUser || !displayUser) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: isDark ? "#000" : "#f8f9fa" }}>
        <ActivityIndicator size="large" color={ACCENT_COLOR} />
      </View>
    );
  }

  const fullName = `${displayUser.firstName || ""} ${displayUser.lastName || ""}`.trim();
  const nameWords = fullName.split(" ");
  const lastWord = nameWords.pop() || "";
  const nameWithoutLastWord = nameWords.join(" ");

  const profileFields = [
    { icon: "location", label: "From", value: displayUser.location },
    { icon: "calendar", label: "Born", value: displayUser.born },
    { icon: "heart", label: "Into", value: displayUser.hubby },
    { icon: "sparkles", label: "Fantasy", value: displayUser.fantasy },
    { icon: "paw", label: "Pet", value: displayUser.pet },
    { icon: "school", label: "Studied", value: displayUser.studiedAt },
    { icon: "briefcase", label: "Work", value: displayUser.work },
    { icon: "bicycle", label: "Delivery", value: displayUser.deliveryMethod },
  ].filter((f) => f.value);

  const hasRating = (displayUser.averageRating || 0) > 0 || (displayUser.reviewCount || 0) > 0;
  const coverSource = displayUser?.coverImage ? { uri: displayUser.coverImage } : null;
  const avatarSource = displayUser?.avatar ? { uri: displayUser.avatar } : null;
  const isUserVerified = displayUser.isVerified === true;

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? "#000" : "#f8f9fa" }]}>
      {/* Header with cover image - NO edit for visitors */}
      <View style={styles.header}>
        {coverSource ? (
          <Image source={coverSource} style={styles.headerImage} resizeMode="cover" />
        ) : (
          <LinearGradient colors={[headerColor, "#1a1a3a"]} style={StyleSheet.absoluteFill} />
        )}
        <View style={styles.headerOverlay} />
      </View>

      <View style={styles.avatarSection}>
        <Pressable onPress={toggleFlip} style={styles.flipWrapper}>
          <Animated.View style={[styles.flipCard, animatedContainer, styles.shadow]}>
            {/* Front - Avatar */}
            <Animated.View style={[StyleSheet.absoluteFill, frontStyle]}>
              {avatarSource ? (
                <Image source={avatarSource} style={styles.avatarImage} resizeMode="cover" />
              ) : (
                <Avatar size={AVATAR_SIZE - 12} />
              )}
            </Animated.View>

            {/* Back - ID Card */}
            <Animated.View style={[StyleSheet.absoluteFill, backStyle]}>
              <LinearGradient colors={["#0F0F2E", "#1E1E4D", "#017a6b"]} style={styles.idCard}>
                <View style={styles.idWatermark}>
                  {[...Array(30)].map((_, i) => (
                    <Text key={i} style={[styles.watermarkText, { transform: [{ rotate: i % 2 ? "12deg" : "-12deg" }] }]}>
                      ROOMLINK
                    </Text>
                  ))}
                </View>
                <Image source={avatarSource} style={styles.idAvatar} resizeMode="cover" />
                <Text style={styles.idName}>{displayUser.firstName} {displayUser.lastName}</Text>
                <Text style={styles.idUsername}>@{displayUser.username}</Text>
                {isUserVerified && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="shield-checkmark" size={18} color="#00ff9d" />
                    <Text style={styles.verifiedText}>Verified RoomLink Member</Text>
                  </View>
                )}
              </LinearGradient>
            </Animated.View>
          </Animated.View>
        </Pressable>

        {/* Info Section - No edit buttons for visitors */}
        <View style={styles.infoHeader}>
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: isDark ? "#fff" : "#000" }]}>
              {nameWithoutLastWord && `${nameWithoutLastWord} `}
              {lastWord}
            </Text>
            {isUserVerified && <Trust text="Verified Host" />}
            {displayUser.verificationType && (
              <View style={styles.badgeContainer}>
                {displayUser.verificationType === "vendor" && <YellowBadge width={28} height={28} />}
                {displayUser.verificationType === "studentLandlord" && <BlueBadge width={28} height={28} />}
                {displayUser.verificationType === "realEstate" && <RedBadge width={28} height={28} />}
              </View>
            )}
          </View>

          <Text style={[styles.username, { color: isDark ? "#aaa" : "#666" }]}>@{displayUser.username}</Text>

          <View style={styles.ratingContainer}>
            {hasRating ? (
              <View style={styles.ratingRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Ionicons
                    key={s}
                    name={
                      s <= Math.floor(displayUser.averageRating || 0)
                        ? "star"
                        : s <= (displayUser.averageRating || 0)
                        ? "star-half"
                        : "star-outline"
                    }
                    size={13}
                    color={s <= (displayUser.averageRating || 0) ? "#000" : "#888"}
                    style={{ marginRight: 2 }}
                  />
                ))}
                <Text style={styles.ratingNumber}>
                  {displayUser.averageRating?.toFixed(1) || "0.0"}
                </Text>
                <Text style={styles.reviewCountText}>• ({displayUser.reviewCount || 0})</Text>
              </View>
            ) : (
              <Text style={[styles.noRatingText, { color: isDark ? "#888" : "#777" }]}>No ratings yet</Text>
            )}
          </View>

          {displayUser.bio && <Text style={[styles.bio, { color: isDark ? "#ddd" : "#333" }]}>{displayUser.bio}</Text>}
        </View>

        {/* Listings Button - Works for visitors too */}
        <TouchableOpacity style={styles.listingsButton} onPress={goToListings}>
          <Ionicons name="home" size={24} color="#000" style={{ marginRight: 12 }} />
          <Text style={styles.listingsText}>View Listings</Text>
        </TouchableOpacity>
      </View>

      {/* Personal Details */}
      {profileFields.length > 0 && <Text style={styles.personalDetailsLabel}>Personal Details</Text>}
      {profileFields.length > 0 && (
        <View style={styles.detailsCard}>
          {profileFields.map((field, i) => (
            <View key={i} style={styles.detailRow}>
              <Ionicons name={field.icon} size={22} color={isDark ? "#fff" : "#000"} />
              <Text style={[styles.detailText, { color: isDark ? "#ccc" : "#222" }]}>
                <Text style={{ color: isDark ? "#888" : "#666" }}>{field.label}:</Text> {field.value}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

// Reuse most of your original styles (copy from EliteProfile)
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: 110, overflow: "hidden", position: "relative" },
  headerImage: { width: "100%", height: "100%", resizeMode: "cover" },
  headerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.3)" },
  avatarSection: { marginTop: -55, paddingHorizontal: 20 },
  flipWrapper: { alignItems: "flex-start", marginBottom: 16 },
  flipCard: { backgroundColor: "#fff", overflow: "hidden" },
  shadow: {
    shadowColor: "#888",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 5,
    borderColor: "#fff",
  },
  infoHeader: { alignItems: "flex-start", marginTop: 0 },
  nameRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap" },
  name: { fontSize: 30, fontWeight: "900", letterSpacing: 0.5, lineHeight: 38 },
  username: { fontSize: 17, marginTop: 8, fontWeight: "600" },
  ratingContainer: { marginTop: 10 },
  ratingRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6 },
  ratingNumber: { marginLeft: 6, fontSize: 13.5, fontWeight: "700", color: "#017a6b" },
  reviewCountText: { fontSize: 12.5, color: "#888", fontWeight: "400" },
  noRatingText: { fontSize: 13, fontStyle: "italic", marginTop: 6 },
  bio: { marginTop: 12, fontSize: 16, lineHeight: 24, fontStyle: "italic" },
  badgeContainer: { marginLeft: 10, marginBottom: -6 },
  listingsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 6,
    marginTop: 16,
    marginBottom: 24,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#017a6b",
    backgroundColor: "transparent",
  },
  listingsText: { color: "#000", fontSize: 16, fontWeight: "700" },
  personalDetailsLabel: { fontSize: 18, fontWeight: "700", marginTop: 24, marginBottom: 4, paddingHorizontal: 20 },
  detailsCard: {
    marginTop: 8,
    marginHorizontal: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  detailRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  detailText: { marginLeft: 14, fontSize: 16 },
  idCard: { padding: 20, alignItems: "center", justifyContent: "center" },
  idWatermark: { ...StyleSheet.absoluteFillObject, opacity: 0.06, justifyContent: "center", alignItems: "center" },
  watermarkText: { fontSize: 14, color: "#fff", fontWeight: "900", margin: 4 },
  idAvatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: "#00ff9d", marginBottom: 12 },
  idName: { fontSize: 22, fontWeight: "800", color: "#fff" },
  idUsername: { fontSize: 15, color: "#00ff9d", marginBottom: 10 },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,255,157,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  verifiedText: { color: "#00ff9d", marginLeft: 6, fontWeight: "600" },
});