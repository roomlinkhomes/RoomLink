import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Create context
export const AuthContext = createContext();

// Provider
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // logged-in user
  const [loading, setLoading] = useState(true); // initial loading state
  const [userCountry, setUserCountry] = useState(null); // 🌍 added
  const [userCurrency, setUserCurrency] = useState(null); // 💰 added

  // Load user & preferences on app start
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const savedUser = await AsyncStorage.getItem("user");
        const savedCountry = await AsyncStorage.getItem("userCountry");
        const savedCurrency = await AsyncStorage.getItem("userCurrency");

        if (savedUser) setUser(JSON.parse(savedUser));
        if (savedCountry) setUserCountry(savedCountry);
        if (savedCurrency) setUserCurrency(savedCurrency);
      } catch (err) {
        console.log("Error loading user:", err);
      } finally {
        setLoading(false);
      }
    };
    loadStoredData();
  }, []);

  // Persist country/currency when changed
  useEffect(() => {
    if (userCountry) AsyncStorage.setItem("userCountry", userCountry);
  }, [userCountry]);

  useEffect(() => {
    if (userCurrency) AsyncStorage.setItem("userCurrency", userCurrency);
  }, [userCurrency]);

  // Login / Signup
  const login = async (userData) => {
    const formattedUser = {
      fullName: userData.fullName || "",
      username: userData.username || "",
      email: userData.email || null,
      phone: userData.phone || null,
      avatar: userData.profilePic || userData.avatar || null, // support signup avatar
      role: userData.role || "tenant",
      lastNameChange: null,
      lastUsernameChange: null,
    };
    setUser(formattedUser);
    await AsyncStorage.setItem("user", JSON.stringify(formattedUser));
  };

  // Update user profile
  const updateUser = async (updatedFields) => {
    if (!user) return;
    const updatedUser = { ...user, ...updatedFields };
    setUser(updatedUser);
    await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
  };

  // Logout
  const logout = async () => {
    setUser(null);
    setUserCountry(null);
    setUserCurrency(null);
    await AsyncStorage.multiRemove(["user", "userCountry", "userCurrency"]);
  };

  // Change password (frontend mock)
  const changePassword = async (oldPassword, newPassword) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!oldPassword || !newPassword) {
          reject("Please fill in all fields.");
        } else if (newPassword.length < 6) {
          reject("New password must be at least 6 characters.");
        } else {
          console.log("Password changed successfully (mock)");
          resolve("Password changed successfully.");
        }
      }, 1000);
    });
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
        userCountry, // ✅ added
        setUserCountry, // ✅ added
        userCurrency, // ✅ added
        setUserCurrency, // ✅ added
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
