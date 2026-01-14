// context/AdsContext.jsx
import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const AdsContext = createContext();

export const AdsProvider = ({ children }) => {
  const [ads, setAds] = useState([]);

  // Load ads on mount and filter expired ones
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem("ads");
        if (stored) {
          const parsed = JSON.parse(stored);
          const now = new Date();
          const validAds = parsed.filter(
            (ad) => !ad.expiresAt || new Date(ad.expiresAt) > now
          );
          setAds(validAds);
        }
      } catch (err) {
        console.log("Error loading ads:", err);
      }
    })();
  }, []);

  // Save only valid ads every time ads change
  useEffect(() => {
    const now = new Date();
    const validAds = ads.filter(
      (ad) => !ad.expiresAt || new Date(ad.expiresAt) > now
    );

    AsyncStorage.setItem("ads", JSON.stringify(validAds)).catch((err) =>
      console.error("Error saving ads:", err)
    );
  }, [ads]);

  // Add new ad with expiration date, merge with stored ads
  const addAd = async (adData) => {
    try {
      const imageUrl = adData.url || adData.imageUri || adData.imageUrl;
      if (!imageUrl) return console.warn("⚠️ Missing ad image URL");

      // Determine expiration date
      let expiresAt = null;
      if (adData.plan === "daily") {
        expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      } else if (adData.plan === "weekly" || adData.plan === "free") {
        expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      } else if (adData.plan === "monthly") {
        expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      }

      // Merge with previously stored ads
      const stored = await AsyncStorage.getItem("ads");
      const oldAds = stored ? JSON.parse(stored) : [];
      const updated = [{ ...adData, url: imageUrl, expiresAt }, ...oldAds];

      setAds(updated);
      await AsyncStorage.setItem("ads", JSON.stringify(updated));

      console.log("✅ Ad saved:", adData);
    } catch (err) {
      console.error("Error adding ad:", err);
    }
  };

  const clearAds = async () => {
    try {
      await AsyncStorage.removeItem("ads");
      setAds([]);
    } catch (err) {
      console.error("Error clearing ads:", err);
    }
  };

  return (
    <AdsContext.Provider value={{ ads, addAd, clearAds }}>
      {children}
    </AdsContext.Provider>
  );
};
