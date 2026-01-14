// components/EliteProfile.jsx — ONLY Cloudinary upload added, everything else original
import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
  Dimensions,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import { onAuthStateChanged } from "firebase/auth";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { useUser } from "../context/UserContext";
import Avatar from "./avatar";
import BlueBadge from "../assets/icons/blue.svg";
import YellowBadge from "../assets/icons/yellow.svg";
import RedBadge from "../assets/icons/red.svg";

const { width } = Dimensions.get("window");
const AVATAR_SIZE = 124;
const CARD_WIDTH = Math.min(420, width - 40);
const CARD_HEIGHT = 224;
const FLIP_DURATION = 600;
const ACCENT_COLOR = "#0055FF";

export default function EliteProfile({ visitedUserListings = [], visitedUser: propVisitedUser }) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const navigation = useNavigation();
  const route = useRoute();
  const { user, logout } = useUser();

  const routeUserId = route?.params?.userId;
  const [displayUser, setDisplayUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [headerColor, setHeaderColor] = useState("#0A0E27");
  const [headerImage, setHeaderImage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const flip = useSharedValue(0);

  const isOwner = useMemo(() => {
    if (!user) return false;
    const viewedUid = propVisitedUser?.uid || routeUserId || displayUser?.uid;
    return user.uid === viewedUid;
  }, [user, propVisitedUser, routeUserId, displayUser]);

  useEffect(() => {
    const uid = routeUserId || propVisitedUser?.uid || user?.uid;
    if (!uid) return;

    const unsub = onSnapshot(
      doc(db, "users", uid),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setDisplayUser({ uid, ...data });
          setHeaderColor(data.headerColor || "#0A0E27");
          setHeaderImage(data.headerImage || null);
        }
        setLoadingUser(false);
      },
      () => setLoadingUser(false)
    );
    return unsub;
  }, [routeUserId, propVisitedUser, user]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        logout();
        navigation.replace("Login");
      }
    });
    return unsub;
  }, []);

  // Request permissions once
  useEffect(() => {
    (async () => {
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    })();
  }, []);

  const updateUserField = async (field, value) => {
    if (!user?.uid) return;
    try {
      await updateDoc(doc(db, "users", user.uid), { [field]: value });
    } catch (err) {
      Alert.alert("Error", "Failed to update profile");
    }
  };

  // EXACT SAME UPLOAD LOGIC FROM Listing.jsx — ONLY THIS IS NEW
  const uploadImage = async (uri) => {
    const data = new FormData();
    data.append("file", { uri, type: "image/jpeg", name: "upload.jpg" });
    data.append("upload_preset", "roomlink_preset");
    data.append("cloud_name", "drserbss8");

    try {
      const res = await fetch("https://api.cloudinary.com/v1_1/drserbss8/image/upload", {
        method: "POST",
        body: data,
      });
      const json = await res.json();
      return json.secure_url || null;
    } catch (err) {
      Alert.alert("Upload Error", "Image upload failed, try again.");
      return null;
    }
  };

  const changeAvatar = async () => {
    if (!isOwner) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return;

    const uri = result.assets[0].uri;
    const uploadedUrl = await uploadImage(uri);

    if (uploadedUrl) {
      await updateUserField("avatar", uploadedUrl);
      Alert.alert("Success", "Profile picture updated!");
    }
  };

  const pickHeaderImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [16, 7],
      quality: 0.9,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setHeaderImage(uri);
      setModalVisible(false);
      if (isOwner) await updateUserField("headerImage", uri);
    }
  };

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

  const safeNavigate = (screen, params = {}) => {
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined && v !== null)
    );
    navigation.navigate(screen, filteredParams);
  };

  const goToListings = () => {
    const targetUserId = isOwner ? user?.uid : displayUser?.uid;
    if (!targetUserId) return;
    safeNavigate("ProfileListingsScreen", { userId: targetUserId });
  };

  const menuItems = [
    { label: "Edit Profile", icon: "create-outline", onPress: () => safeNavigate("EditProfile") },
    { label: "Go Premium", icon: "diamond-outline", onPress: () => safeNavigate("GetVerified") },
    { label: "Wallet", icon: "wallet-outline", onPress: () => safeNavigate("Wallet") },
    { label: "My Listings", icon: "home", onPress: goToListings },
    {
      label: "My Store",
      icon: "storefront",
      onPress: () => displayUser?.uid && safeNavigate("VendorUserListing", { vendorId: displayUser.uid }),
    },
    { label: "Become a Vendor", icon: "business-outline", onPress: () => safeNavigate("BecomeVendor") },
  ];

  const visitorMenu = [
    { label: "Listings", icon: "home", onPress: goToListings },
    {
      label: "Store",
      icon: "storefront",
      onPress: () => displayUser?.uid && safeNavigate("VendorUserListing", { vendorId: displayUser.uid }),
    },
  ];

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
  ].filter(f => f.value);

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? "#000" : "#f8f9fa" }]}>
      {/* Header */}
      <TouchableOpacity activeOpacity={isOwner ? 0.95 : 1} onPress={() => isOwner && setModalVisible(true)}>
        <View style={styles.header}>
          {headerImage ? (
            <Image source={{ uri: headerImage }} style={styles.headerImage} blurRadius={1} />
          ) : (
            <LinearGradient colors={[headerColor, "#1a1a3a"]} style={StyleSheet.absoluteFill} />
          )}
          <View style={styles.headerOverlay} />
        </View>
      </TouchableOpacity>

      <View style={styles.avatarSection}>
        <Pressable 
          onPress={toggleFlip}
          onLongPress={changeAvatar} // Only owner can long press to change avatar
          delayLongPress={500}
          style={styles.flipWrapper}
        >
          <Animated.View style={[styles.flipCard, animatedContainer, styles.shadow]}>
            <Animated.View style={[StyleSheet.absoluteFill, frontStyle]}>
              {displayUser.avatar ? (
                <Image source={{ uri: displayUser.avatar }} style={styles.avatarImage} />
              ) : (
                <Avatar size={AVATAR_SIZE - 12} />
              )}
            </Animated.View>

            <Animated.View style={[StyleSheet.absoluteFill, backStyle]}>
              <LinearGradient colors={["#0F0F2E", "#1E1E4D", "#0055FF"]} style={styles.idCard}>
                <View style={styles.idWatermark}>
                  {[...Array(30)].map((_, i) => (
                    <Text key={i} style={[styles.watermarkText, { transform: [{ rotate: i % 2 ? "12deg" : "-12deg" }] }]}>
                      ROOMLINK
                    </Text>
                  ))}
                </View>
                <Image source={{ uri: displayUser.avatar }} style={styles.idAvatar} />
                <Text style={styles.idName}>{displayUser.firstName} {displayUser.lastName}</Text>
                <Text style={styles.idUsername}>@{displayUser.username}</Text>
                {displayUser.isVerified ? (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="shield-checkmark" size={18} color="#00ff9d" />
                    <Text style={styles.verifiedText}>Verified RoomLink Member</Text>
                  </View>
                ) : isOwner ? (
                  <TouchableOpacity style={styles.verifyBtn} onPress={() => safeNavigate("IdentityVerification")}>
                    <Text style={styles.verifyText}>Get Verified</Text>
                  </TouchableOpacity>
                ) : null}
              </LinearGradient>
            </Animated.View>
          </Animated.View>
        </Pressable>

        {/* Name + Badge */}
        <View style={styles.infoHeader}>
          <Text style={[styles.name, { color: isDark ? "#fff" : "#000" }]}>
            {nameWithoutLastWord && `${nameWithoutLastWord} `}
            <Text style={styles.lastWordWithBadge}>
              {lastWord}
              {displayUser.badge && (
                <View style={styles.badgeContainer}>
                  {displayUser.badge === "vendor" && <YellowBadge width={28} height={28} />}
                  {displayUser.badge === "studentLandlord" && <BlueBadge width={28} height={28} />}
                  {displayUser.badge === "realEstate" && <RedBadge width={28} height={28} />}
                </View>
              )}
            </Text>
          </Text>

          <Text style={[styles.username, { color: isDark ? "#aaa" : "#666" }]}>
            @{displayUser.username}
          </Text>

          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Ionicons
                key={s}
                name={s <= Math.floor(displayUser.averageRating || 0) ? "star" : s <= displayUser.averageRating ? "star-half" : "star-outline"}
                size={22}
                color="#FFD700"
              />
            ))}
            <Text style={styles.ratingText}>
              {displayUser.averageRating?.toFixed(1) || "0.0"}
              <Text style={styles.reviewCount}> ({displayUser.reviewCount || 0})</Text>
            </Text>
          </View>

          {displayUser.bio && <Text style={[styles.bio, { color: isDark ? "#ddd" : "#333" }]}>{displayUser.bio}</Text>}
        </View>
      </View>

      {/* Profile Fields */}
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

      {/* Menu Grid */}
      <View style={styles.menuGrid}>
        <View style={styles.menuRow}>
          {(isOwner ? menuItems.slice(0, 4) : visitorMenu.slice(0, 4)).map((item, idx) => (
            <TouchableOpacity key={idx} style={styles.menuButton} onPress={item.onPress} activeOpacity={0.8}>
              <LinearGradient colors={["#1E1E3F", "#0F0F2E"]} style={styles.menuIconBg}>
                <Ionicons name={item.icon} size={28} color="#fff" />
              </LinearGradient>
              <Text style={[styles.menuLabel, { color: isDark ? "#ddd" : "#333" }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {(isOwner ? menuItems.slice(4) : visitorMenu.slice(4)).length > 0 && (
          <View style={styles.menuRow}>
            {(isOwner ? menuItems.slice(4) : visitorMenu.slice(4)).map((item, idx) => (
              <TouchableOpacity key={idx} style={styles.menuButton} onPress={item.onPress} activeOpacity={0.8}>
                <LinearGradient colors={["#1E1E3F", "#0F0F2E"]} style={styles.menuIconBg}>
                  <Ionicons name={item.icon} size={28} color="#fff" />
                </LinearGradient>
                <Text style={[styles.menuLabel, { color: isDark ? "#ddd" : "#333" }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Header Customizer Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Header Style</Text>
            <TouchableOpacity style={styles.modalOption} onPress={pickHeaderImage}>
              <Ionicons name="images" size={24} color={ACCENT_COLOR} />
              <Text style={styles.modalOptionText}>Choose Photo</Text>
            </TouchableOpacity>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 20 }}>
              {["#0A0E27", "#1a0033", "#000428", "#004e92", "#2c003e", "#003366", "#120030"].map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorPick, { backgroundColor: c }]}
                  onPress={async () => {
                    setHeaderColor(c);
                    setHeaderImage(null);
                    setModalVisible(false);
                    if (isOwner) {
                      await updateUserField("headerColor", c);
                      await updateUserField("headerImage", null);
                    }
                  }}
                />
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: 120, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: "hidden" },
  headerImage: { width: "100%", height: "100%" },
  headerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.3)" },
  avatarSection: { marginTop: -70, paddingHorizontal: 20 },
  flipWrapper: { alignItems: "flex-start", marginBottom: 16 },
  flipCard: { backgroundColor: "#fff", overflow: "hidden" },
  shadow: { shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 20 },
  avatarImage: { width: "100%", height: "100%", borderRadius: AVATAR_SIZE / 2, borderWidth: 5, borderColor: "#fff" },
  idCard: { padding: 20, alignItems: "center", justifyContent: "center" },
  idWatermark: { ...StyleSheet.absoluteFillObject, opacity: 0.06, justifyContent: "center", alignItems: "center" },
  watermarkText: { fontSize: 14, color: "#fff", fontWeight: "900", margin: 4 },
  idAvatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: "#00ff9d", marginBottom: 12 },
  idName: { fontSize: 22, fontWeight: "800", color: "#fff" },
  idUsername: { fontSize: 15, color: "#00ff9d", marginBottom: 10 },
  verifiedBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(0,255,157,0.2)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  verifiedText: { color: "#00ff9d", marginLeft: 6, fontWeight: "600" },
  verifyBtn: { backgroundColor: "#00ff9d", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 30 },
  verifyText: { color: "#000", fontWeight: "800" },
  infoHeader: { alignItems: "flex-start", marginTop: 0 },
  name: {
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 0.5,
    lineHeight: 38,
  },
  lastWordWithBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  badgeContainer: {
    marginLeft: 10,
    marginBottom: -6,
    shadowColor: "#fff",
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 15,
  },
  username: { fontSize: 17, marginTop: 8, fontWeight: "600" },
  ratingRow: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  ratingText: { marginLeft: 10, fontSize: 18, fontWeight: "700", color: ACCENT_COLOR },
  reviewCount: { fontWeight: "400", color: "#888", fontSize: 15 },
  bio: { marginTop: 12, fontSize: 16, lineHeight: 24, fontStyle: "italic" },
  detailsCard: { marginTop: 30, marginHorizontal: 20, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 20, padding: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  detailRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  detailText: { marginLeft: 14, fontSize: 16 },
  menuGrid: { paddingHorizontal: 20, marginVertical: 30 },
  menuRow: { flexDirection: "row", justifyContent: "flex-start", marginBottom: 24 },
  menuButton: {
    alignItems: "center",
    width: (width - 40) / 4,
    paddingHorizontal: 10,
  },
  menuIconBg: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", shadowColor: ACCENT_COLOR, shadowOpacity: 0.4, shadowRadius: 15, elevation: 10 },
  menuLabel: { marginTop: 10, fontSize: 13, fontWeight: "600", textAlign: "center" },
  modalOverlay: { flex: 1, backgroundColor: "#000000CC", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 22, fontWeight: "800", textAlign: "center", color: "#000" },
  modalOption: { flexDirection: "row", alignItems: "center", paddingVertical: 16 },
  modalOptionText: { marginLeft: 16, fontSize: 18, color: "#000" },
  colorPick: { width: 50, height: 50, borderRadius: 25, marginHorizontal: 8, borderWidth: 3, borderColor: "#fff" },
});