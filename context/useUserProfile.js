// context/useUserProfile.js
import { useState, useCallback } from "react";
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { useUser } from "./UserContext";

export const useUserProfile = () => {
  const { user } = useUser();

  const updateUser = useCallback(async (updatedFields) => {
    if (!user?.id) return;
    try {
      const newUser = { ...user, ...updatedFields };
      // You can update local state if needed via context, but for now just Firestore
      const userRef = doc(db, "users", user.id);
      await setDoc(userRef, newUser, { merge: true });
      console.log("User updated");
    } catch (err) {
      console.error("Update user failed", err);
    }
  }, [user]);

  const getUserById = useCallback(async (userId) => {
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
  }, []);

  const getVisitedUserById = useCallback(async (userId) => {
    return await getUserById(userId);
  }, [getUserById]);

  const getListingReviews = useCallback(async (listingId) => {
    try {
      const reviewsRef = collection(db, "listings", listingId, "reviews");
      const q = query(reviewsRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error fetching listing reviews:", error);
      return [];
    }
  }, []);

  const getUserReviews = useCallback(async (userId) => {
    try {
      const reviewsRef = collection(db, "users", userId, "reviews");
      const q = query(reviewsRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error fetching user reviews:", error);
      return [];
    }
  }, []);

  const submitListingReview = useCallback(async ({ listingId, userId, userName, rating, comment }) => {
    if (!listingId || !userId || !rating) throw new Error("Missing required data");
    try {
      const reviewRef = await addDoc(collection(db, "listings", listingId, "reviews"), {
        userId,
        userName,
        rating: Number(rating),
        comment,
        createdAt: new Date(),
      });

      // Update vendor rating logic...
      const listingSnap = await getDoc(doc(db, "listings", listingId));
      if (!listingSnap.exists()) throw new Error("Listing not found");

      const vendorId = listingSnap.data().posterId || listingSnap.data().authorId;
      if (vendorId) {
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
        }
      }
      return reviewRef.id;
    } catch (error) {
      console.error("submitListingReview error:", error);
      throw error;
    }
  }, []);

  return {
    updateUser,
    getUserById,
    getVisitedUserById,
    getListingReviews,
    getUserReviews,
    submitListingReview,
  };
};