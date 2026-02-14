// context/AuthContext.jsx — FIXED: Uses Firebase listener + real persistence
import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth, db } from "../firebaseConfig";
import {
  onAuthStateChanged,
  signOut,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userCountry, setUserCountry] = useState("NG");
  const [userCurrency, setUserCurrency] = useState("₦");

  // Core: Listen to Firebase auth state (this gives real long-term persistence)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Fetch latest profile from Firestore
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          const profile = userDoc.exists() ? userDoc.data() : {};

          const enhancedUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            emailVerified: firebaseUser.emailVerified,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            fullName: profile.fullName || "",
            username: profile.username || "",
            role: profile.role || "tenant",
            phone: profile.phone || null,
            avatar: profile.avatar || null,
            // Add more fields from Firestore as needed
          };

          setUser(enhancedUser);

          // Optional: backup minimal non-sensitive data
          await AsyncStorage.setItem("user", JSON.stringify(enhancedUser));

          // Save push token
          await savePushToken(firebaseUser.uid);
        } catch (err) {
          console.error("Failed to load profile:", err);
          setUser(null);
        }
      } else {
        setUser(null);
        await AsyncStorage.removeItem("user");
      }

      setLoading(false); // Only hide splash/loading after real state is known
    });

    return () => unsubscribe();
  }, []);

  // Save country/currency changes (non-auth related)
  useEffect(() => {
    if (userCountry) AsyncStorage.setItem("userCountry", userCountry);
  }, [userCountry]);

  useEffect(() => {
    if (userCurrency) AsyncStorage.setItem("userCurrency", userCurrency);
  }, [userCurrency]);

  // Load extras on mount
  useEffect(() => {
    const loadExtras = async () => {
      try {
        const country = await AsyncStorage.getItem("userCountry");
        const currency = await AsyncStorage.getItem("userCurrency");
        if (country) setUserCountry(country);
        if (currency) setUserCurrency(currency);
      } catch (e) {
        console.log("Extras load error:", e);
      }
    };
    loadExtras();
  }, []);

  const savePushToken = async (uid) => {
    if (!Device.isDevice) return;
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") return;
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      await setDoc(doc(db, "users", uid), { expoPushToken: token }, { merge: true });
      console.log("Push token saved:", token);
    } catch (e) {
      console.log("Failed to save token:", e);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth); // Triggers listener → user = null
      setUser(null);
      setUserCountry("NG");
      setUserCurrency("₦");
      await AsyncStorage.multiRemove(["user", "userCountry", "userCurrency"]);
      console.log("Logout complete");
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    }
  };

  const changePassword = async (oldPassword, newPassword) => {
    const currentUser = auth.currentUser;
    if (!currentUser?.email) throw new Error("No authenticated user");

    const credential = EmailAuthProvider.credential(currentUser.email, oldPassword);
    await reauthenticateWithCredential(currentUser, credential);
    await updatePassword(currentUser, newPassword);
    return "Password changed successfully!";
  };

  // Optional: update profile fields (call after Firestore update if needed)
  const updateUser = (updatedFields) => {
    if (!user) return;
    setUser((prev) => ({ ...prev, ...updatedFields }));
    // Optional AsyncStorage backup
    AsyncStorage.setItem("user", JSON.stringify({ ...user, ...updatedFields }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        logout,
        changePassword,
        updateUser,
        userCountry,
        setUserCountry,
        userCurrency,
        setUserCurrency,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);