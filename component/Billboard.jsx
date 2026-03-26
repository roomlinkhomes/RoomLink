import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
  Linking,
  Text,
  ActivityIndicator,
} from "react-native";
import { useColorScheme } from "react-native";
import { Easing } from "react-native-reanimated";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy 
} from "firebase/firestore";
import { db } from "../firebaseConfig";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const DEFAULT_BANNERS = [
  "https://res.cloudinary.com/drserbss8/image/upload/v1730123456/default_banner1.jpg",
  "https://res.cloudinary.com/drserbss8/image/upload/v1730123456/default_banner2.jpg",
  "https://res.cloudinary.com/drserbss8/image/upload/v1730123456/default_banner3.jpg",
];

export default function Billboard() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [activeAds, setActiveAds] = useState([]);
  const [loading, setLoading] = useState(true);

  const translateX = useRef(new Animated.Value(0)).current;
  const adIndexRef = useRef(0);
  const intervalRef = useRef(null);

  // Improved Real-time Listener
  useEffect(() => {
    const now = new Date();

    const q = query(
      collection(db, "ads"),
      where("status", "==", "live"),           // ← Must be live
      where("url", "!=", null),                // ← Must have image
      orderBy("expiresAt", "asc")              // Fair rotation (oldest expiring first)
      // Removed the "expiresAt > now" for now — we'll filter in JS (more reliable)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const nowTime = Date.now();
      const ads = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const expiresAt = data.expiresAt?.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt || 0);

        if (expiresAt.getTime() > nowTime && data.url) {
          ads.push({
            id: docSnap.id,
            ...data,
            expiresAt,   // for debugging
          });
        }
      });

      console.log(`Billboard → Live ads after filter: ${ads.length}`, ads);
      setActiveAds(ads);
      setLoading(false);
    }, (error) => {
      console.error("Billboard listener error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Rotation logic (unchanged but safer)
  useEffect(() => {
    const allAds = activeAds.length > 0 
      ? activeAds 
      : DEFAULT_BANNERS.map((url) => ({ url }));

    adIndexRef.current = 0;
    translateX.setValue(0);
    clearInterval(intervalRef.current);

    if (allAds.length <= 1) return;

    intervalRef.current = setInterval(() => {
      adIndexRef.current = (adIndexRef.current + 1) % allAds.length;
      Animated.timing(translateX, {
        toValue: -SCREEN_WIDTH * adIndexRef.current,
        duration: 600,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
    }, 4000);

    return () => clearInterval(intervalRef.current);
  }, [activeAds]);

  if (loading) {
    return (
      <View style={{ height: 140, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="small" color="#017a6b" />
      </View>
    );
  }

  const displayAds = activeAds.length > 0 
    ? activeAds 
    : DEFAULT_BANNERS.map((url) => ({ url }));

  return (
    <View style={{ marginTop: 20, marginBottom: 15, borderRadius: 12, overflow: "hidden" }}>
      {displayAds.length > 0 ? (
        <Animated.View
          style={{
            flexDirection: "row",
            width: SCREEN_WIDTH * displayAds.length,
            transform: [{ translateX }],
          }}
        >
          {displayAds.map((ad, i) => (
            <TouchableOpacity
              key={ad.id || i}
              activeOpacity={0.9}
              onPress={() => ad.link && Linking.openURL(ad.link)}
            >
              <Image
                source={{ uri: ad.url || ad.image }}
                style={{ width: SCREEN_WIDTH, height: 140 }}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ))}
        </Animated.View>
      ) : (
        <Text style={{
          textAlign: "center",
          padding: 12,
          fontSize: 16,
          fontWeight: "500",
          color: isDark ? "#fff" : "#036dd6",
        }}>
          🎉 No active ads right now. Promote your business today!
        </Text>
      )}
    </View>
  );
}