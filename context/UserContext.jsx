// context/UserContext.jsx — FINAL FIXED + ADS PAYMENT UNLOCK + VENDOR RATING UPDATE + getUserReviews
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
import { onAuthStateChanged } from "firebase/auth";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [visitedUser, setVisitedUser] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  // ================================================
  // 1. Load cached user
  // ================================================
  useEffect(() => {
    const loadCachedUser = async () => {
      try {
        const saved = await AsyncStorage.getItem("user");
        if (saved) {
          const parsed = JSON.parse(saved);
          setUser(parsed);
        }
      } catch (err) {
        console.log("Failed to load cached user:", err);
      }
    };
    loadCachedUser();
  }, []);

  // ================================================
  // 2. Auth listener + merge Firestore data
  // ================================================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        setLoading(true);
        if (!currentUser) {
          setUser(null);
          setVisitedUser(null);
          setIsOwner(false);
          await AsyncStorage.removeItem("user");
          setLoading(false);
          return;
        }
        const userRef = doc(db, "users", currentUser.uid);
        const snap = await getDoc(userRef);
        let firestoreUser = snap.exists() ? snap.data() : null;

        // Create user if not exist
        if (!firestoreUser) {
          firestoreUser = {
            id: currentUser.uid,
            email: currentUser.email,
            firstName: "",
            lastName: "",
            username: currentUser.email.split("@")[0],
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

        const cached = await AsyncStorage.getItem("user");
        const cachedUser = cached ? JSON.parse(cached) : {};

        // ===========================
        // ⭐ MERGE FIRESTORE + CACHED
        // ===========================
        const mergedUser = {
          id: currentUser.uid,
          email: currentUser.email,
          firstName: firestoreUser.firstName ?? cachedUser.firstName ?? "",
          lastName: firestoreUser.lastName ?? cachedUser.lastName ?? "",
          username: firestoreUser.username ?? cachedUser.username ?? currentUser.email.split("@")[0],
          avatar: firestoreUser.avatar ?? cachedUser.avatar ?? null,
          fullName:
            firestoreUser.fullName ||
            `${firestoreUser.firstName || ""} ${firestoreUser.lastName || ""}`.trim(),
          country: firestoreUser.country ?? cachedUser.country ?? "NG",
          currency: firestoreUser.currency ?? cachedUser.currency ?? "₦",
          isVendor: firestoreUser.isVendor ?? cachedUser.isVendor ?? false,
          isVerified: firestoreUser.isVerified ?? cachedUser.isVerified ?? false,
          verifiedDate: firestoreUser.verifiedDate ?? cachedUser.verifiedDate ?? null,
          averageRating: firestoreUser.averageRating ?? 0,
          reviewCount: firestoreUser.reviewCount ?? 0,
          createdAt: firestoreUser.createdAt ?? cachedUser.createdAt,
          // ⭐ NEW ADS PAYMENT FIELDS
          adsPaid: firestoreUser.adsPaid ?? cachedUser.adsPaid ?? false,
          adsPaidAt: firestoreUser.adsPaidAt ?? cachedUser.adsPaidAt ?? null,
          adsPlan: firestoreUser.adsPlan ?? cachedUser.adsPlan ?? null,
        };

        setUser(mergedUser);
        await AsyncStorage.setItem("user", JSON.stringify(mergedUser));
      } catch (err) {
        console.error("Auth state change error:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // ================================================
  // 3. Update user
  // ================================================
  const updateUser = async (updatedFields) => {
    if (!user?.id) return;
    try {
      const newUser = {
        ...user,
        ...updatedFields,
        fullName:
          updatedFields.fullName ||
          `${updatedFields.firstName || user.firstName} ${
            updatedFields.lastName || user.lastName
          }`.trim(),
      };
      // Save locally
      setUser(newUser);
      await AsyncStorage.setItem("user", JSON.stringify(newUser));
      // Save to firestore
      const userRef = doc(db, "users", user.id);
      await setDoc(userRef, newUser, { merge: true });
    } catch (err) {
      console.error("Failed to update user:", err);
    }
  };

  // ================================================
  // 4. Logout
  // ================================================
  const logout = async () => {
    try {
      await auth.signOut();
      await AsyncStorage.removeItem("user");
      setUser(null);
      setVisitedUser(null);
      setIsOwner(false);
    } catch (err) {
      console.error("Failed to logout:", err);
    }
  };

  // ================================================
  // 5. Fetch user by ID
  // ================================================
  const getUserById = async (userId) => {
    if (!userId) return null;
    try {
      const ref = doc(db, "users", userId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
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
      }
      return null;
    } catch (err) {
      console.error("getUserById error:", err);
      return null;
    }
  };

  // ================================================
  // 6. Load visited user
  // ================================================
  const getVisitedUserById = async (userId) => {
    const profile = await getUserById(userId);
    if (!profile) return null;
    setIsOwner(user?.id === profile.id);
    setVisitedUser(profile);
    return profile;
  };

  // ================================================
  // 7. Get listing reviews
  // ================================================
  const getListingReviews = async (listingId) => {
    try {
      const reviewsRef = collection(db, "listings", listingId, "reviews");
      const q = query(reviewsRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error fetching listing reviews:", error);
      return [];
    }
  };

  // ================================================
  // 8. NEW: Get user (seller) reviews
  // ================================================
  const getUserReviews = async (userId) => {
    try {
      const reviewsRef = collection(db, "users", userId, "reviews");
      const q = query(reviewsRef, orderBy("createdAt", "desc")); // newest first
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error fetching user reviews:", error);
      return [];
    }
  };

  // ================================================
  // 9. Submit review + update vendor rating
  // ================================================
  const submitListingReview = async ({ listingId, userId, userName, rating, comment }) => {
    if (!listingId || !userId || !rating) throw new Error("Missing data");
    // 1. Save review to listing
    const reviewRef = await addDoc(collection(db, "listings", listingId, "reviews"), {
      userId,
      userName,
      rating: Number(rating),
      comment,
      createdAt: new Date(),
    });
    // 2. Get listing to find vendor ID
    const listingSnap = await getDoc(doc(db, "listings", listingId));
    if (!listingSnap.exists()) throw new Error("Listing not found");
    const vendorId = listingSnap.data().posterId || listingSnap.data().authorId;
    if (!vendorId) throw new Error("Vendor not found");
    // 3. Update vendor rating
    const vendorRef = doc(db, "users", vendorId);
    const vendorSnap = await getDoc(vendorRef);
    if (vendorSnap.exists()) {
      const data = vendorSnap.data();
      const oldRating = data.averageRating || 0;
      const oldCount = data.reviewCount || 0;
      const newCount = oldCount + 1;
      const newAverage = ((oldRating * oldCount) + rating) / newCount;
      await updateDoc(vendorRef, {
        averageRating: Number(newAverage.toFixed(2)),
        reviewCount: newCount,
      });
    } else {
      await setDoc(
        vendorRef,
        {
          averageRating: Number(rating),
          reviewCount: 1,
        },
        { merge: true }
      );
    }
    return reviewRef;
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
        getListingReviews,
        submitListingReview,
        getUserReviews, // ← NEW: added here
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