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
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../firebaseConfig"; // ← make sure this path is correct

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

  // Real-time listener for ALL active ads
  useEffect(() => {
    const now = new Date();

    const q = query(
      collection(db, "ads"),
      where("expiresAt", ">", now),
      orderBy("expiresAt", "asc")   // oldest first → fair FIFO rotation
      // NO userId filter — everyone sees everything
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ads = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log("Billboard fetched ads:", ads.length, ads); // ← keep for debugging

      setActiveAds(ads);
      setLoading(false);
    }, (error) => {
      console.error("Billboard listener error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Rotation logic
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
    }, 4000); // change interval if you want faster/slower rotation

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
        <Text
          style={{
            textAlign: "center",
            padding: 12,
            fontSize: 16,
            fontWeight: "500",
            color: isDark ? "#fff" : "#036dd6",
          }}
        >
          🎉 Promote your business today! Tap “Promote Your Ad” to get started.
        </Text>
      )}
    </View>
  );
}