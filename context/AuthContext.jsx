// context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { onAuthStateChanged, signOut, reauthenticateWithCredential, EmailAuthProvider, updatePassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userCountry, setUserCountry] = useState("NG");
  const [userCurrency, setUserCurrency] = useState("₦");

  // ==================== MAIN AUTH LISTENER ====================
  useEffect(() => {
    console.log("🔥 AuthProvider: Starting onAuthStateChanged listener");

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("📡 Auth state changed →", firebaseUser ? `UID: ${firebaseUser.uid}` : "NULL (no user)");

      if (firebaseUser) {
        try {
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
          };

          setUser(enhancedUser);
          console.log("✅ User successfully restored with profile");

          // Backup to AsyncStorage as fallback
          await AsyncStorage.setItem("persistedUser", JSON.stringify(enhancedUser));
        } catch (err) {
          console.error("❌ Failed to load user profile from Firestore:", err);
          setUser(null);
        }
      } else {
        console.log("❌ No authenticated user from Firebase");
        setUser(null);
        await AsyncStorage.removeItem("persistedUser");
      }

      setLoading(false);
    });

    // Safety net: Force stop loading if listener takes too long
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn("⏰ Auth loading timeout - forcing loading = false");
        setLoading(false);
      }
    }, 3500);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  // ==================== COUNTRY & CURRENCY ====================
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

  useEffect(() => {
    if (userCountry) AsyncStorage.setItem("userCountry", userCountry);
  }, [userCountry]);

  useEffect(() => {
    if (userCurrency) AsyncStorage.setItem("userCurrency", userCurrency);
  }, [userCurrency]);

  // ==================== AUTH FUNCTIONS ====================
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserCountry("NG");
      setUserCurrency("₦");
      await AsyncStorage.multiRemove(["user", "persistedUser", "userCountry", "userCurrency"]);
      console.log("✅ Logout completed");
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

  const updateUser = (updatedFields) => {
    if (!user) return;
    setUser((prev) => ({ ...prev, ...updatedFields }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user && !loading,     // ← Very important
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};