// context/UserContext.jsx
import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Create Context
export const UserContext = createContext();

// Provider Component
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Logged-in user
  const [visitedUser, setVisitedUser] = useState(null); // Profile being visited
  const [isOwner, setIsOwner] = useState(false); // Flag to indicate owner
  const [loading, setLoading] = useState(true);

  // Load logged-in user on app start
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await AsyncStorage.getItem("user");
        if (userData) setUser(JSON.parse(userData));
      } catch (err) {
        console.error("Failed to load user:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  // ✅ Update logged-in user info
  const updateUser = async (updatedFields) => {
    try {
      const newUser = { ...user, ...updatedFields };
      setUser(newUser); // update state immediately
      await AsyncStorage.setItem("user", JSON.stringify(newUser)); // persist
    } catch (err) {
      console.error("Failed to update user:", err);
    }
  };

  // 🔹 Mark user as verified
  const verifyUser = async (verifiedDate = new Date().toISOString()) => {
    try {
      const newUser = { ...user, isVerified: true, verifiedDate };
      setUser(newUser);
      await AsyncStorage.setItem("user", JSON.stringify(newUser));
      return true;
    } catch (err) {
      console.error("Failed to verify user:", err);
      return false;
    }
  };

  // ✅ Create user (used in signup / account creation)
  const createUser = async (userData) => {
    try {
      setUser(userData); // save to context
      await AsyncStorage.setItem("user", JSON.stringify(userData)); // persist
      return true;
    } catch (err) {
      console.error("Failed to create user:", err);
      return false;
    }
  };

  // ✅ Logout method
  const logout = async () => {
    try {
      await AsyncStorage.removeItem("user"); // clear storage
      setUser(null); // reset state
    } catch (err) {
      console.error("Failed to logout:", err);
    }
  };

  // 🔹 Fetch another user's profile (e.g., vendor)
  const getUserById = async (userId) => {
    try {
      // Replace with real backend call
      const fetchedUser = {
        id: userId,
        fullName: "Sample Vendor",
        username: "vendor123",
        email: "vendor@example.com",
        avatar: "https://via.placeholder.com/100",
        dob: "2000-01-01",
        bio: "This is a sample bio for testing profiles.",
        rating: 4.5,
        reviews: 23,
        badge: "vendor", // example
        location: "Lagos",
        hubby: "N/A",
        fantasy: "None",
        pet: "Cat",
        studiedAt: "University",
        education: "B.Sc",
        work: "Software Dev",
        deliveryMethod: "Fast",
        verifiedDate: "2025-01-01",
        isVerified: true,
      };

      return fetchedUser;
    } catch (err) {
      console.error("Failed to fetch vendor profile:", err);
      return null;
    }
  };

  // 🔹 Fetch visited user and compute visibility
  const getVisitedUserById = async (userId) => {
    try {
      const profile = await getUserById(userId);

      if (!profile) return null;

      const owner = user?.id === profile.id;
      setIsOwner(owner);

      // Filter fields for visitors
      const publicProfile = owner
        ? profile // owner sees everything
        : {
            id: profile.id,
            fullName: profile.fullName,
            username: profile.username,
            avatar: profile.avatar,
            bio: profile.bio,
            badge: profile.badge,
            isVerified: profile.isVerified,
            verifiedDate: profile.verifiedDate,
            location: profile.location,
            hubby: profile.hubby,
            fantasy: profile.fantasy,
            pet: profile.pet,
            studiedAt: profile.studiedAt,
            education: profile.education,
            work: profile.work,
            deliveryMethod: profile.deliveryMethod,
          };

      setVisitedUser(publicProfile);
      return publicProfile;
    } catch (err) {
      console.error("Failed to fetch visited user:", err);
      return null;
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        updateUser,
        verifyUser, // ✅ Added action
        createUser,
        loading,
        getUserById,
        getVisitedUserById,
        visitedUser,
        isOwner,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

// ✅ Custom hook for easy access
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within a UserProvider");
  return context;
};
