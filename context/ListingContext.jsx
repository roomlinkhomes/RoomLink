// context/ListingContext.jsx
import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "./AuthContext";
import { db } from "../firebaseConfig";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { Alert } from "react-native";

export const ListingContext = createContext();
export const VendorListingContext = createContext();

export const ListingProvider = ({ children }) => {
  const { user: authUser } = useContext(AuthContext);
  const [listings, setListings] = useState([]);
  const [vendorListings, setVendorListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // ────────────────────────────────────────────────
  // Cache: load + save
  // ────────────────────────────────────────────────
  useEffect(() => {
    const loadCache = async () => {
      try {
        const [saved, savedVendor] = await Promise.all([
          AsyncStorage.getItem("listings"),
          AsyncStorage.getItem("vendorListings"),
        ]);
        if (saved) setListings(JSON.parse(saved));
        if (savedVendor) setVendorListings(JSON.parse(savedVendor));
      } catch (err) {
        console.warn("Cache load failed:", err);
      } finally {
        setLoading(false);
      }
    };
    loadCache();
  }, []);

  useEffect(() => {
    if (loading) return;
    Promise.all([
      AsyncStorage.setItem("listings", JSON.stringify(listings)),
      AsyncStorage.setItem("vendorListings", JSON.stringify(vendorListings)),
    ]).catch((err) => console.warn("Cache save failed:", err));
  }, [listings, vendorListings, loading]);

  // ────────────────────────────────────────────────
  // Real-time listener – main listings
  // ────────────────────────────────────────────────
  useEffect(() => {
    if (!authUser?.uid) {
      setListings([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const q = query(collection(db, "listings"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const raw = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
            updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
          };
        });

        // Simple sort (already ordered by query, but client can re-sort if needed)
        const sorted = raw.sort((a, b) => b.createdAt - a.createdAt);

        // Enrich owned listings
        const enriched = sorted.map((item) =>
          item.userId === authUser.uid
            ? {
                ...item,
                userName: `${authUser.firstName || ""} ${authUser.lastName || ""}`.trim() || "You",
                userAvatar: authUser.avatar || authUser.photoURL || "",
              }
            : item
        );

        setListings(enriched);
        setLoading(false);
      },
      (err) => {
        console.error("Listings listener error:", err);
        setLoading(false);
      }
    );

    return () => {
      console.log("[ListingContext] Unsubscribing listings");
      unsubscribe();
    };
  }, [authUser?.uid]);

  // ────────────────────────────────────────────────
  // Vendor listings listener (simplified)
  // ────────────────────────────────────────────────
  useEffect(() => {
    if (!authUser?.uid) {
      setVendorListings([]);
      return;
    }

    const q = query(collection(db, "vendorListings"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
          };
        });

        const enriched = items.map((item) =>
          item.userId === authUser.uid
            ? {
                ...item,
                userName: `${authUser.firstName || ""} ${authUser.lastName || ""}`.trim() || "You",
                userAvatar: authUser.avatar || authUser.photoURL || "",
              }
            : item
        );

        setVendorListings(enriched);
      },
      (err) => console.error("Vendor listings error:", err)
    );

    return unsubscribe;
  }, [authUser?.uid]);

  // ────────────────────────────────────────────────
  // Add listing – with optimistic update
  // ────────────────────────────────────────────────
  const addListing = async (newListingData) => {
    if (!authUser?.uid) throw new Error("Not authenticated");

    const optimisticId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const optimisticItem = {
      id: optimisticId,
      ...newListingData,
      userId: authUser.uid,
      userName: `${authUser.firstName || ""} ${authUser.lastName || ""}`.trim() || "You",
      userAvatar: authUser.avatar || authUser.photoURL || "",
      createdAt: new Date(),              // client-side for instant sort
      updatedAt: new Date(),
      likes: 0,
      liked: false,
      saved: false,
      rented: false,
      price:
        newListingData.priceMonthly
          ? newListingData.priceMonthly * 12
          : newListingData.priceYearly || newListingData.pricePerNight || 0,
      _isOptimistic: true,
    };

    // Optimistic add → shows immediately at the top
    setListings((prev) => [optimisticItem, ...prev]);

    try {
      const docRef = await addDoc(collection(db, "listings"), {
        ...newListingData,
        userId: authUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        likes: 0,
        liked: false,
        saved: false,
        rented: false,
        price:
          newListingData.priceMonthly
            ? newListingData.priceMonthly * 12
            : newListingData.priceYearly || newListingData.pricePerNight || 0,
      });

      // Replace optimistic item with real one once we get the ID
      setListings((prev) =>
        prev.map((item) =>
          item.id === optimisticId
            ? {
                ...item,
                id: docRef.id,
                createdAt: new Date(), // will be updated by snapshot soon
                _isOptimistic: false,
              }
            : item
        )
      );

      // onSnapshot will eventually bring the real server data (including real timestamps)
    } catch (err) {
      console.error("Add listing failed:", err);

      // Rollback optimistic update
      setListings((prev) => prev.filter((item) => item.id !== optimisticId));

      Alert.alert("Error", "Failed to create listing. Please try again.");
      throw err;
    }
  };

  const updateListing = async (updated) => {
    if (!updated?.id) return;
    try {
      const ref = doc(db, "listings", updated.id);
      await updateDoc(ref, {
        ...updated,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Update failed:", err);
      Alert.alert("Error", "Failed to update listing.");
    }
  };

  const deleteListing = async (id) => {
    if (!id) return;
    try {
      await deleteDoc(doc(db, "listings", id));
    } catch (err) {
      console.error("Delete failed:", err);
      Alert.alert("Error", "Failed to delete listing.");
    }
  };

  const markAsRented = async (id, rented = true) => {
    if (!id) return;
    try {
      const ref = doc(db, "listings", id);
      await updateDoc(ref, {
        rented,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Mark rented failed:", err);
      Alert.alert("Error", "Failed to update rental status.");
    }
  };

  // Vendor functions (kept similar – can add optimistic later if needed)
  const addVendorListing = async (data) => {
    try {
      await addDoc(collection(db, "vendorListings"), {
        ...data,
        userId: authUser.uid,
        userName: `${authUser.firstName || ""} ${authUser.lastName || ""}`.trim() || "You",
        userAvatar: authUser.avatar || authUser.photoURL || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        rented: false,
      });
    } catch (err) {
      console.error("Add vendor failed:", err);
      Alert.alert("Error", "Failed to create vendor listing.");
      throw err;
    }
  };

  const deleteVendorListing = async (id) => {
    try {
      await deleteDoc(doc(db, "vendorListings", id));
    } catch (err) {
      console.error("Delete vendor failed:", err);
      Alert.alert("Error", "Failed to delete vendor listing.");
    }
  };

  const markVendorListingAsRented = async (id) => {
    try {
      const ref = doc(db, "vendorListings", id);
      await updateDoc(ref, { rented: true, updatedAt: serverTimestamp() });
    } catch (err) {
      console.error("Mark vendor rented failed:", err);
      Alert.alert("Error", "Failed to update vendor rental status.");
    }
  };

  // ────────────────────────────────────────────────
  // Context value
  // ────────────────────────────────────────────────
  const value = {
    listings,
    loading,
    addListing,
    updateListing,
    deleteListing,
    markAsRented,
  };

  const vendorValue = {
    vendorListings,
    loading,
    addVendorListing,
    deleteVendorListing,
    markVendorListingAsRented,
  };

  return (
    <ListingContext.Provider value={value}>
      <VendorListingContext.Provider value={vendorValue}>
        {children}
      </VendorListingContext.Provider>
    </ListingContext.Provider>
  );
};

export const useListing = () => useContext(ListingContext);
export const useVendorListing = () => useContext(VendorListingContext);