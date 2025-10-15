// components/ProfileLayout.jsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  Image,
  Modal,
  FlatList,
  Alert,
  Dimensions,
  Pressable,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import { signOut, onAuthStateChanged } from "firebase/auth"; // ✅ added
import { auth } from "../firebaseConfig"; // ✅ added

import { useUser } from "../context/UserContext";
import Avatar from "./avatar";
import BlueBadge from "../assets/icons/blue.svg";
import YellowBadge from "../assets/icons/yellow.svg";
import RedBadge from "../assets/icons/red.svg";

const COLORS = [
  "#1A237E","#3949AB","#036dd6","#6A1B9A","#8E24AA",
  "#AD1457","#C2185B","#D32F2F","#E64A19","#F57C00",
  "#F9A825","#AFB42B","#388E3C","#00796B","#00838F",
];

const { width } = Dimensions.get("window");
const FRONT_SIZE = 110;
const CARD_WIDTH = Math.min(400, width - 20);
const CARD_HEIGHT = 200;
const FLIP_DURATION = 480;

const ProfileLayout = ({ visitedUser, visitedUserListings = [] }) => {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const navigation = useNavigation();
  const { user, logout, verifyUser } = useUser();

  const displayUser = visitedUser || user;
  const isOwner = !visitedUser;

  const [bgColor, setBgColor] = useState("#1A237E");
  const [bgImage, setBgImage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [premiumModalVisible, setPremiumModalVisible] = useState(false);
  const flip = useSharedValue(0);

  // ✅ Sync with Firebase authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        // Firebase session expired — log out app user too
        logout();
        navigation.replace("Login");
      }
    });
    return unsubscribe;
  }, []);

  // ✅ Close premium modal automatically if user just got verified
  useEffect(() => {
    if (displayUser?.isVerified && premiumModalVisible) {
      setPremiumModalVisible(false);
    }
  }, [displayUser?.isVerified]);

  // --- Header gallery picker ---
  const pickImage = async () => {
    if (!displayUser?.isVerified) {
      setPremiumModalVisible(true);
      return;
    }
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 1,
      });
      if (!result.canceled) {
        setBgImage(result.assets[0].uri);
        setModalVisible(false);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  // ✅ Enhanced logout (Firebase + App Context)
  const handleLogout = async () => {
    Alert.alert("Confirm Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut(auth);
            logout();
            navigation.replace("Login");
          } catch (error) {
            Alert.alert("Error", "Failed to log out. Try again.");
          }
        },
      },
    ]);
  };

  const toggleFlip = () => {
    const next = flip.value === 0 ? 1 : 0;
    flip.value = withTiming(next, { duration: FLIP_DURATION });
  };

  const containerAnimated = useAnimatedStyle(() => {
    const w = interpolate(flip.value, [0, 1], [FRONT_SIZE, CARD_WIDTH]);
    const h = interpolate(flip.value, [0, 1], [FRONT_SIZE, CARD_HEIGHT]);
    const br = interpolate(flip.value, [0, 1], [FRONT_SIZE / 2, 12]);
    return { width: w, height: h, borderRadius: br };
  });

  const frontAnimated = useAnimatedStyle(() => {
    const rotateY = `${interpolate(flip.value, [0, 1], [0, 180])}deg`;
    const opacity = interpolate(flip.value, [0, 0.5, 1], [1, 0, 0]);
    return { transform: [{ perspective: 1000 }, { rotateY }], opacity, backfaceVisibility: "hidden" };
  });

  const backAnimated = useAnimatedStyle(() => {
    const rotateY = `${interpolate(flip.value, [0, 1], [180, 360])}deg`;
    const opacity = interpolate(flip.value, [0, 0.5, 1], [0, 0, 1]);
    return { transform: [{ perspective: 1000 }, { rotateY }], opacity, backfaceVisibility: "hidden" };
  });

  const menuItems = [
    { label: "Edit Profile", icon: "person-circle-outline", action: () => navigation.navigate("EditProfile") },
    { label: "Go premium", icon: "checkmark-done-circle-outline", action: () => navigation.navigate("GetVerified") },
    { label: "Payments", icon: "card-outline", action: () => navigation.navigate("Payment") },
    { label: "Listings", icon: "home-outline", action: () => navigation.navigate("UserListings") },
    { label: "Become Vendor", icon: "storefront-outline", action: () => navigation.navigate("BecomeVendor") },
    { label: "Logout", icon: "log-out-outline", action: handleLogout },
  ];

  const scatterElements = Array.from({ length: 45 }).map((_, i) => {
    const top = Math.random() * 120;
    const left = Math.random() * width;
    const rotate = `${Math.floor(Math.random() * 50 - 25)}deg`;
    const opacity = 0.08 + Math.random() * 0.1;
    if (i % 3 === 0) {
      const icons = ["balloon-outline","home-outline","book-outline","school-outline","pencil-outline","briefcase-outline","star-outline"];
      const randomIcon = icons[Math.floor(Math.random() * icons.length)];
      return <Ionicons key={`icon-${i}`} name={randomIcon} size={18 + Math.random()*8} color={`rgba(255,255,255,${opacity})`} style={{ position:"absolute", top, left, transform:[{ rotate }] }} />;
    }
    return <Text key={`txt-${i}`} style={{ position:"absolute", top, left, fontSize: 12+Math.random()*4, color:`rgba(255,255,255,${opacity})`, fontWeight:"600", transform:[{ rotate }] }}>{displayUser?.firstName || "RoomLink"}</Text>;
  });

  const profileItems = [
    { label: "Location", value: displayUser?.location, icon: "location-outline" },
    { label: "Born", value: displayUser?.born, icon: "calendar-outline" },
    { label: "Hubby", value: displayUser?.hubby, icon: "heart-outline" },
    { label: "Fantasy", value: displayUser?.fantasy, icon: "flower-outline" },
    { label: "Pet", value: displayUser?.pet, icon: "paw-outline" },
    { label: "Studied at", value: displayUser?.studiedAt, icon: "school-outline" },
    { label: "Education", value: displayUser?.education, icon: "book-outline" },
    { label: "Work", value: displayUser?.work, icon: "briefcase-outline" },
    { label: "How I deliver customer", value: displayUser?.deliveryMethod, icon: "bicycle-outline" },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? "#121212" : "#f9f9f9" }]}>
      {/* Header */}
      <TouchableOpacity
        onPress={() => { if (isOwner) setModalVisible(true); }}
        activeOpacity={isOwner ? 0.9 : 1}
      >
        <View style={styles.headerBackground}>
          {bgImage ? <Image source={{ uri: bgImage }} style={styles.headerImage} /> : (
            <>
              <LinearGradient colors={[bgColor, `${bgColor}AA`]} style={[StyleSheet.absoluteFill, { borderBottomLeftRadius: 20, borderBottomRightRadius: 20 }]} />
              {scatterElements}
            </>
          )}
        </View>
      </TouchableOpacity>

      {/* Avatar, Name, Username & Bio */}
      <View style={styles.leftProfileContainer}>
        <Pressable onPress={toggleFlip} style={styles.flipPressable}>
          <Animated.View style={[styles.flipContainer, containerAnimated]}>
            <Animated.View style={[styles.face, frontAnimated]}>
              {displayUser?.avatar ? <Image source={{ uri: displayUser.avatar }} style={[styles.frontAvatar, flip.value ? { opacity: 0.3 } : {}]} /> : <Avatar size={FRONT_SIZE} />}
            </Animated.View>
            <Animated.View style={[styles.face, styles.backFace, backAnimated]}>
              <LinearGradient colors={["#1A237E", "#3949AB"]} style={styles.cardInner}>
                <View style={styles.watermark}>
                  {Array.from({ length: 40 }).map((_, i) => (
                    <Text key={i} style={[styles.watermarkText, { transform: [{ rotate: i%3 ? "8deg":"-10deg" }] }]}>RoomLink</Text>
                  ))}
                </View>
                <Image source={{ uri: displayUser?.avatar }} style={styles.cardAvatar} />
                <Text style={styles.cardName}>{displayUser?.firstName} {displayUser?.lastName || ""}</Text>
                {displayUser?.isVerified ? (
                  <>
                    <Text style={styles.verifiedText}>Verified since {displayUser?.verifiedDate || "2025"}</Text>
                    <Text style={styles.partnerText}>RoomLink, your trusted partner in housing and rentals</Text>
                  </>
                ) : (
                  isOwner ? (
                    <TouchableOpacity 
                      style={styles.getVerifiedButton} 
                      onPress={async () => {
                        try {
                          await verifyUser();
                          Alert.alert("Verified!", "You are now verified.");
                        } catch (err) {
                          Alert.alert("Error", "Verification failed. Try again.");
                        }
                      }}
                    >
                      <Text style={styles.getVerifiedText}>Verify your identity</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.notVerifiedText}>Not Verified</Text>
                  )
                )}
              </LinearGradient>
            </Animated.View>
          </Animated.View>
        </Pressable>

        <View style={styles.nameBadgeContainer}>
          <Text style={[styles.name, { color: isDark ? "#fff" : "#000" }]}>{displayUser?.firstName} {displayUser?.lastName || "No Name"}</Text>
          {displayUser?.badge === "vendor" && <YellowBadge width={20} height={20} style={styles.badge} />}
          {displayUser?.badge === "studentLandlord" && <BlueBadge width={20} height={20} style={styles.badge} />}
          {displayUser?.badge === "realEstate" && <RedBadge width={20} height={20} style={styles.badge} />}
        </View>

        <Text style={[styles.username, { color: isDark ? "#bbb" : "#555" }]}>{`@${displayUser?.username || "username"}`}</Text>
        {displayUser?.bio ? <Text style={[styles.bio, { color: isDark ? "#ccc" : "#444" }]}>{displayUser.bio}</Text> : null}
      </View>

      {/* Profile items */}
      <View style={styles.profileItemsContainer}>
        {profileItems.filter(item => item.value).map((item, idx) => (
          <View key={idx} style={styles.profileItemRow}>
            <Ionicons name={item.icon} size={20} color={isDark ? "#fff" : "#333"} />
            <Text style={[styles.profileItemText, { color: isDark ? "#fff" : "#000" }]}>{item.label}: {item.value}</Text>
          </View>
        ))}
      </View>

      {/* Listings for visitors */}
      {visitedUser && visitedUserListings.length > 0 && (
        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
          <Text style={{ fontSize:18, fontWeight:"600", marginBottom:10, color:isDark?"#fff":"#000" }}>Listings</Text>
          <FlatList
            data={visitedUserListings}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={{ marginRight:14, width:140, borderRadius:12, overflow:"hidden", backgroundColor:isDark?"#1c1c1c":"#f0f0f0" }}
                onPress={() => navigation.navigate("ListingDetail", { listingId: item.id })}
              >
                <Image source={{ uri: item.images[0] }} style={{ width:"100%", height:90 }} />
                <View style={{ padding:6 }}>
                  <Text style={{ color:isDark?"#fff":"#000", fontWeight:"500" }} numberOfLines={1}>{item.title}</Text>
                  <Text style={{ color:isDark?"#ccc":"#555", fontSize:12 }}>${item.price}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Menu grid */}
      {isOwner && (
        <View style={styles.menuGridWrapper}>
          <View style={styles.menuGridContainer}>
            {menuItems.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.menuItem}
                onPress={item.action}
                activeOpacity={0.8}
              >
                <View style={[ styles.menuIconCircle, { backgroundColor: isDark ? "#1c1c1c" : "#e0e0e0" } ]}>
                  <Ionicons name={item.icon} size={26} color={isDark ? "#fff" : "#111"} />
                </View>
                <Text style={[styles.menuLabel, { color: isDark ? "#fff" : "#111" }]} numberOfLines={1}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Header Modal */}
      {isOwner && (
        <Modal visible={modalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: isDark ? "#333" : "#fff" }]}>
              <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                <Ionicons name="close-outline" size={28} color={isDark ? "#fff" : "#000"} />
              </TouchableOpacity>
              <Text style={{ fontSize:16, fontWeight:"bold", marginBottom:10, color:isDark?"#fff":"#000" }}>Choose a business card</Text>
              <FlatList
                data={COLORS}
                keyExtractor={(item) => item}
                horizontal
                renderItem={({ item }) => (
                  <TouchableOpacity style={[styles.colorOption, { backgroundColor: item }]} onPress={() => { setBgColor(item); setBgImage(null); setModalVisible(false); }} />
                )}
              />
              <TouchableOpacity style={styles.imageOption} onPress={pickImage}>
                <Ionicons name="image-outline" size={20} color={isDark ? "#fff" : "#333"} />
                <Text style={{ marginLeft: 8, color: isDark ? "#fff" : "#333" }}>Choose from Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Premium Prompt */}
      <Modal visible={premiumModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? "#333" : "#fff" }]}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setPremiumModalVisible(false)}>
              <Ionicons name="close-outline" size={28} color={isDark ? "#fff" : "#000"} />
            </TouchableOpacity>
            <Text style={{ fontSize:16, fontWeight:"bold", marginBottom:10, color:isDark?"#fff":"#000" }}>Premium Feature</Text>
            <Text style={{ color:isDark?"#fff":"#000", marginBottom:15 }}>Choosing a gallery image is only available for premium users.</Text>
            <TouchableOpacity onPress={() => { setPremiumModalVisible(false); navigation.navigate("GetVerified"); }} style={{ backgroundColor:"#1A237E", paddingVertical:10, paddingHorizontal:18, borderRadius:8 }}>
              <Text style={{ color:"#fff", fontWeight:"700" }}>Go Premium</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex:1 },
  headerBackground: { height:120, borderBottomLeftRadius:20, borderBottomRightRadius:20, overflow:"hidden" },
  headerImage: { width:"100%", height:"100%", resizeMode:"cover" },
  leftProfileContainer: { alignItems:"flex-start", marginTop:-50, paddingHorizontal:20 },
  flipPressable: { alignItems:"center", justifyContent:"center" },
  flipContainer: { alignItems:"center", justifyContent:"center", overflow:"hidden" },
  face: { position:"absolute", left:0, top:0, right:0, bottom:0, alignItems:"center", justifyContent:"center" },
  frontAvatar: { width:FRONT_SIZE-6, height:FRONT_SIZE-6, borderRadius:(FRONT_SIZE-6)/2, borderWidth:4, borderColor:"#fff" },
  cardInner: { width:"100%", height:"100%", borderRadius:12, alignItems:"center", justifyContent:"center", padding:16, overflow:"hidden" },
  watermark: { ...StyleSheet.absoluteFillObject, opacity:0.08, justifyContent:"center", alignItems:"center", flexDirection:"row", flexWrap:"wrap" },
  watermarkText: { fontSize:12, color:"#fff", margin:3, textTransform:"uppercase", letterSpacing:1 },
  cardAvatar: { width:80, height:80, borderRadius:40, borderWidth:2, borderColor:"#fff", marginBottom:8 },
  cardName: { fontSize:18, fontWeight:"700", color:"#fff", marginBottom:6, textAlign:"center" },
  verifiedText: { fontSize:14, color:"#fff", marginBottom:6, textAlign:"center" },
  partnerText: { fontSize:12, color:"#fff", textAlign:"center" },
  notVerifiedText: { fontSize:14, color:"#fff", marginBottom:8, textAlign:"center" },
  getVerifiedButton: { backgroundColor:"#fff", paddingVertical:10, paddingHorizontal:18, borderRadius:8, marginTop:6 },
  getVerifiedText: { color:"#1A237E", fontWeight:"700" },
  nameBadgeContainer: { flexDirection:"row", alignItems:"center", marginTop:2 },
  name: { fontSize:24, fontWeight:"800" },
  badge: { marginLeft:1 },
  username: { fontSize:14, marginTop:2, fontWeight:"400", opacity:0.7 },
  bio: { fontSize:14, marginTop:8, fontStyle:"italic" },
  profileItemsContainer: { paddingHorizontal:20, marginTop:20 },
  profileItemRow: { flexDirection:"row", alignItems:"center", marginBottom:12 },
  profileItemText: { marginLeft:10, fontSize:16 },
  menuGridWrapper: { paddingHorizontal: 12, marginTop: 20 },
  menuGridContainer: { flexDirection:"row", flexWrap:"wrap" },
  menuItem: { width: "25%", alignItems:"center", marginVertical: 14 },
  menuIconCircle: { width:50, height:50, borderRadius:33, alignItems:"center", justifyContent:"center", elevation:3 },
  menuLabel: { marginTop:8, fontSize:12, textAlign:"center", fontWeight:"500" },
  modalOverlay: { flex:1, backgroundColor:"rgba(0,0,0,0.6)", justifyContent:"center", alignItems:"center" },
  modalContent: { width:"80%", padding:20, borderRadius:12, alignItems:"center", position:"relative" },
  closeButton: { position:"absolute", top:10, right:10, zIndex:10 },
  colorOption: { width:40, height:40, borderRadius:8, marginHorizontal:6 },
  imageOption: { flexDirection:"row", alignItems:"center", marginTop:15 },
});

export default ProfileLayout;
