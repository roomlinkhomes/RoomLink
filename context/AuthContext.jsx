// context/AuthContext.jsx — CLEANED: No duplicate auth listener
import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth } from "../firebaseConfig";
import {
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
  signOut,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // ← Keep for initial load
  const [userCountry, setUserCountry] = useState("NG");
  const [userCurrency, setUserCurrency] = useState("₦");

  // Save push token
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

  // Load persisted data on mount
  useEffect(() => {
    const loadPersistedData = async () => {
      try {
        const savedUser = await AsyncStorage.getItem("user");
        const country = await AsyncStorage.getItem("userCountry");
        const currency = await AsyncStorage.getItem("userCurrency");

        if (savedUser) setUser(JSON.parse(savedUser));
        if (country) setUserCountry(country);
        if (currency) setUserCurrency(currency);
      } catch (e) {
        console.log("Load error:", e);
      } finally {
        setLoading(false);
      }
    };
    loadPersistedData();
  }, []);

  // Save country/currency changes
  useEffect(() => {
    if (userCountry) AsyncStorage.setItem("userCountry", userCountry);
  }, [userCountry]);

  useEffect(() => {
    if (userCurrency) AsyncStorage.setItem("userCurrency", userCurrency);
  }, [userCurrency]);

  // Login — save to storage + push token
  const login = async (userData) => {
    const formattedUser = {
      uid: auth.currentUser?.uid,
      fullName: userData.fullName || "",
      username: userData.username || "",
      email: userData.email || auth.currentUser?.email || null,
      phone: userData.phone || null,
      avatar: userData.profilePic || userData.avatar || null,
      role: userData.role || "tenant",
      lastNameChange: null,
      lastUsernameChange: null,
    };
    setUser(formattedUser);
    await AsyncStorage.setItem("user", JSON.stringify(formattedUser));
    await savePushToken(auth.currentUser.uid);
  };

  // Update user
  const updateUser = async (updatedFields) => {
    if (!user) return;
    const updatedUser = { ...user, ...updatedFields };
    setUser(updatedUser);
    await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
  };

  // Logout — clear storage + sign out
  const logout = async () => {
    try {
      await signOut(auth);
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

  // Change password
  const changePassword = async (oldPassword, newPassword) => {
    const currentUser = auth.currentUser;
    if (!currentUser?.email) throw new Error("Email required");

    const credential = EmailAuthProvider.credential(currentUser.email, oldPassword);
    await reauthenticateWithCredential(currentUser, credential);
    await updatePassword(currentUser, newPassword);
    return "Password changed!";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        login,
        logout,
        updateUser,
        changePassword,
        loading,
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