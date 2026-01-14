// components/Billboard.jsx
import React, { useEffect, useRef } from "react";
import { View, Image, TouchableOpacity, Dimensions, Animated, Linking, Text } from "react-native";
import { useColorScheme } from "react-native";
import { Easing } from "react-native-reanimated";
import { useContext } from "react";
import { AdsContext } from "../context/AdsContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const DEFAULT_BANNERS = [
  "https://res.cloudinary.com/drserbss8/image/upload/v1730123456/default_banner1.jpg",
  "https://res.cloudinary.com/drserbss8/image/upload/v1730123456/default_banner2.jpg",
  "https://res.cloudinary.com/drserbss8/image/upload/v1730123456/default_banner3.jpg",
];

export default function Billboard() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { ads = [] } = useContext(AdsContext) || {};

  const translateX = useRef(new Animated.Value(0)).current;
  const adIndexRef = useRef(0);
  const intervalRef = useRef(null);

  // Billboard rotation logic
  useEffect(() => {
    const activeAds = (ads || []).filter((ad) => {
      const expiry = ad.expiryDate ? new Date(ad.expiryDate) : null;
      return (ad.url || ad.image) && (!expiry || expiry > new Date());
    });

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
  }, [ads]);

  // Render billboard
  const activeAds = (ads || []).filter((ad) => {
    const expiry = ad.expiryDate ? new Date(ad.expiryDate) : null;
    return (ad.url || ad.image) && (!expiry || expiry > new Date());
  });

  const allAds = activeAds.length > 0
    ? activeAds
    : DEFAULT_BANNERS.map((url) => ({ url }));

  return (
    <View style={{ marginTop: 20, marginBottom: 15, borderRadius: 12, overflow: "hidden" }}>
      {allAds.length > 0 ? (
        <Animated.View
          style={{
            flexDirection: "row",
            width: SCREEN_WIDTH * allAds.length,
            transform: [{ translateX }],
          }}
        >
          {allAds.map((ad, i) => (
            <TouchableOpacity
              key={i}
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

	
