// context/UserContext.jsx - FIXED & CLEAN (Cold Start + Profile Tab Reset)
import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth, db } from "../firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [visitedUser, setVisitedUser] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!isMounted) return;

      console.log("🔥 onAuthStateChanged:", currentUser ? currentUser.uid : "null");

      if (!currentUser) {
        if (isMounted) {
          setUser(null);
          setVisitedUser(null);
          setIsOwner(false);
          await AsyncStorage.removeItem("user");
          setLoading(false);
        }
        return;
      }

      try {
        const userRef = doc(db, "users", currentUser.uid);
        const snap = await getDoc(userRef);

        let firestoreUser = snap.exists() ? snap.data() : null;

        if (!firestoreUser) {
          firestoreUser = {
            id: currentUser.uid,
            email: currentUser.email,
            firstName: "",
            lastName: "",
            username: currentUser.email?.split("@")[0] || "",
            avatar: null,
            fullName: "",
            country: "NG",
            currency: "₦",
            isVendor: false,
            isVerified: false,
            averageRating: 0,
            reviewCount: 0,
            adsPaid: false,
            adsPaidAt: null,
            adsPlan: null,
            createdAt: serverTimestamp(),
          };
          await setDoc(userRef, firestoreUser);
        }

        const mergedUser = {
          id: currentUser.uid,
          email: currentUser.email,
          firstName: firestoreUser.firstName || "",
          lastName: firestoreUser.lastName || "",
          username: firestoreUser.username || currentUser.email?.split("@")[0] || "",
          avatar: firestoreUser.avatar || null,
          fullName: firestoreUser.fullName ||
                   `${firestoreUser.firstName || ""} ${firestoreUser.lastName || ""}`.trim(),
          country: firestoreUser.country || "NG",
          currency: firestoreUser.currency || "₦",
          isVendor: firestoreUser.isVendor || false,
          isVerified: firestoreUser.isVerified || false,
          verifiedDate: firestoreUser.verifiedDate || null,
          averageRating: firestoreUser.averageRating || 0,
          reviewCount: firestoreUser.reviewCount || 0,
          adsPaid: firestoreUser.adsPaid || false,
          adsPaidAt: firestoreUser.adsPaidAt || null,
          adsPlan: firestoreUser.adsPlan || null,
          createdAt: firestoreUser.createdAt,
        };

        if (isMounted) {
          setUser(mergedUser);
          setVisitedUser(null);   // Reset visited user on auth restore
          setIsOwner(true);       // Default to own profile
          await AsyncStorage.setItem("user", JSON.stringify(mergedUser));
          console.log("✅ User loaded successfully:", currentUser.uid);
        }

      } catch (err) {
        console.error("Auth state change error:", err);
        if (isMounted) {
          setUser({
            id: currentUser.uid,
            email: currentUser.email,
          });
          setVisitedUser(null);
          setIsOwner(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Update User
  const updateUser = async (updatedFields) => {
    if (!user?.id) return;
    try {
      const newUser = {
        ...user,
        ...updatedFields,
        fullName:
          updatedFields.fullName ||
          `${updatedFields.firstName || user.firstName || ""} ${
            updatedFields.lastName || user.lastName || ""
          }`.trim(),
      };
      setUser(newUser);
      await AsyncStorage.setItem("user", JSON.stringify(newUser));
      const userRef = doc(db, "users", user.id);
      await setDoc(userRef, newUser, { merge: true });
    } catch (err) {
      console.error("Failed to update user:", err);
    }
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
      await AsyncStorage.removeItem("user");
      setUser(null);
      setVisitedUser(null);
      setIsOwner(false);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // Get single user by ID
  const getUserById = async (userId) => {
    if (!userId) return null;
    try {
      const ref = doc(db, "users", userId);
      const snap = await getDoc(ref);
      if (!snap.exists()) return null;
      const d = snap.data();
      return {
        id: userId,
        firstName: d.firstName || "",
        lastName: d.lastName || "",
        username: d.username || "",
        avatar: d.avatar ?? null,
        fullName: d.fullName || `${d.firstName || ""} ${d.lastName || ""}`.trim(),
        isVerified: d.isVerified ?? false,
        verifiedDate: d.verifiedDate ?? null,
        country: d.country || "NG",
        currency: d.currency || "₦",
        averageRating: d.averageRating || 0,
        reviewCount: d.reviewCount || 0,
      };
    } catch (err) {
      console.error("getUserById error:", err);
      return null;
    }
  };

  // Improved: Load visited user with proper own-profile reset
  const getVisitedUserById = async (userId) => {
    if (!userId) return null;

    // If viewing own profile → reset visited state
    if (user?.id === userId || user?.uid === userId) {
      setVisitedUser(null);
      setIsOwner(true);
      return user;
    }

    const profile = await getUserById(userId);
    if (!profile) return null;

    setIsOwner(false);
    setVisitedUser(profile);
    return profile;
  };

  // Reset to my own profile (call this from Profile tab)
  const resetToMyProfile = () => {
    setVisitedUser(null);
    setIsOwner(true);
  };

  // Reviews Functions
  const getListingReviews = async (listingId) => {
    try {
      const reviewsRef = collection(db, "listings", listingId, "reviews");
      const q = query(reviewsRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error fetching listing reviews:", error);
      return [];
    }
  };

  const getUserReviews = async (userId) => {
    try {
      const reviewsRef = collection(db, "users", userId, "reviews");
      const q = query(reviewsRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error fetching user reviews:", error);
      return [];
    }
  };

  const submitListingReview = async ({ listingId, userId, userName, rating, comment }) => {
    if (!listingId || !userId || !rating) throw new Error("Missing required data");
    try {
      const reviewRef = await addDoc(collection(db, "listings", listingId, "reviews"), {
        userId,
        userName,
        rating: Number(rating),
        comment,
        createdAt: new Date(),
      });

      const listingSnap = await getDoc(doc(db, "listings", listingId));
      if (!listingSnap.exists()) throw new Error("Listing not found");
      const vendorId = listingSnap.data().posterId || listingSnap.data().authorId;
      if (!vendorId) throw new Error("Vendor not found");

      const vendorRef = doc(db, "users", vendorId);
      const vendorSnap = await getDoc(vendorRef);
      if (vendorSnap.exists()) {
        const data = vendorSnap.data();
        const oldRating = data.averageRating || 0;
        const oldCount = data.reviewCount || 0;
        const newCount = oldCount + 1;
        const newAverage = ((oldRating * oldCount) + Number(rating)) / newCount;
        await updateDoc(vendorRef, {
          averageRating: Number(newAverage.toFixed(2)),
          reviewCount: newCount,
        });
      } else {
        await setDoc(
          vendorRef,
          { averageRating: Number(rating), reviewCount: 1 },
          { merge: true }
        );
      }
      return reviewRef.id;
    } catch (error) {
      console.error("submitListingReview error:", error);
      throw error;
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        updateUser,
        loading,
        logout,
        getUserById,
        getVisitedUserById,
        resetToMyProfile,        // ← Key fix for Profile tab
        getListingReviews,
        getUserReviews,
        submitListingReview,
        visitedUser,
        isOwner,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within a UserProvider");
  return ctx;
};