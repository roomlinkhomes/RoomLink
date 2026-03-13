// context/ListingContext.jsx — FIXED: Re-fetch listings on real auth user change
import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "./AuthContext"; // ← FIXED: Use real auth context (with uid)
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
} from "firebase/firestore";
import { Alert } from "react-native";

export const ListingContext = createContext();
export const VendorListingContext = createContext();

export const ListingProvider = ({ children }) => {
  const { user: authUser } = useContext(AuthContext); // ← Real Firebase user (uid, email, etc.)
  const [listings, setListings] = useState([]);
  const [vendorListings, setVendorListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load cached data from AsyncStorage on mount (offline support)
  useEffect(() => {
    const loadCachedData = async () => {
      try {
        const [savedListings, savedVendor] = await Promise.all([
          AsyncStorage.getItem("listings"),
          AsyncStorage.getItem("vendorListings"),
        ]);
        if (savedListings) setListings(JSON.parse(savedListings));
        if (savedVendor) setVendorListings(JSON.parse(savedVendor));
      } catch (err) {
        console.log("Error loading cached data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadCachedData();
  }, []);

  // Save to AsyncStorage whenever listings/vendorListings change
  useEffect(() => {
    if (!loading) {
      Promise.all([
        AsyncStorage.setItem("listings", JSON.stringify(listings)),
        AsyncStorage.setItem("vendorListings", JSON.stringify(vendorListings)),
      ]).catch((err) => console.log("Error saving to AsyncStorage:", err));
    }
  }, [listings, vendorListings, loading]);

  // Real-time listener for main listings — re-runs on authUser change
  useEffect(() => {
    console.log('[ListingContext] Auth user changed:', authUser ? authUser.uid : 'NO USER');

    if (!authUser?.uid) {
      console.log('[ListingContext] No authenticated user → clearing listings');
      setListings([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    console.log('[ListingContext] Fetching listings for UID:', authUser.uid);

    const q = query(collection(db, "listings"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const allListings = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        console.log('[ListingContext] Loaded listings count:', allListings.length);

        // Separate boosted and normal
        const boosted = allListings.filter(
          (item) => item.boostedUntil && new Date(item.boostedUntil) > new Date()
        );
        const normal = allListings.filter(
          (item) => !item.boostedUntil || new Date(item.boostedUntil) <= new Date()
        );

        // Enrich with current user's info if owned
        const enriched = (list) =>
          list.map((item) =>
            item.userId === authUser.uid
              ? {
                  ...item,
                  userName: `${authUser.firstName || ''} ${authUser.lastName || ''}`.trim() || "You",
                  userAvatar: authUser.avatar || authUser.photoURL || "",
                }
              : item
          );

        const enrichedNormal = enriched(normal);
        const enrichedBoosted = enriched(boosted);

        // Sort normal by createdAt descending
        enrichedNormal.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Interleave boosted posts randomly
        const finalList = [];
        let normalIndex = 0;

        enrichedNormal.forEach((post) => {
          finalList.push({ ...post, _key: post.id });

          normalIndex++;

          // Randomly sprinkle boosted posts
          if (
            normalIndex % Math.floor(Math.random() * 6 + 10) === 0 &&
            enrichedBoosted.length > 0
          ) {
            const randomBoost =
              enrichedBoosted[Math.floor(Math.random() * enrichedBoosted.length)];
            finalList.push({
              ...randomBoost,
              _key: `${randomBoost.id}-boost-${normalIndex}-${Math.random()}`,
            });
          }
        });

        setListings(finalList);
        setLoading(false);
      },
      (error) => {
        console.error("[ListingContext] Listings snapshot error:", error);
        setLoading(false);
      }
    );

    return () => {
      console.log('[ListingContext] Unsubscribing listings listener');
      unsubscribe();
    };
  }, [authUser?.uid, authUser?.firstName, authUser?.lastName, authUser?.avatar]);

  // Real-time listener for vendor listings — same fix
  useEffect(() => {
    if (!authUser?.uid) {
      setVendorListings([]);
      return;
    }

    const q = query(collection(db, "vendorListings"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const updated = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setVendorListings(
          updated.map((item) =>
            item.userId === authUser.uid
              ? {
                  ...item,
                  userName: `${authUser.firstName || ''} ${authUser.lastName || ''}`.trim() || "You",
                  userAvatar: authUser.avatar || authUser.photoURL || "",
                }
              : item
          )
        );
      },
      (error) => {
        console.error("[ListingContext] Vendor listings snapshot error:", error);
      }
    );

    return () => unsubscribe();
  }, [authUser?.uid, authUser?.firstName, authUser?.lastName, authUser?.avatar]);

  // Safe empty context when no user
  if (!authUser?.uid) {
    return (
      <ListingContext.Provider
        value={{
          listings: [],
          loading: false,
          addListing: async () => {},
          updateListing: async () => {},
          deleteListing: async () => {},
          markAsRented: async () => {},
        }}
      >
        <VendorListingContext.Provider
          value={{
            vendorListings: [],
            loading: false,
            addVendorListing: async () => {},
            deleteVendorListing: async () => {},
            markVendorListingAsRented: async () => {},
          }}
        >
          {children}
        </VendorListingContext.Provider>
      </ListingContext.Provider>
    );
  }

  // Add new listing
  const addListing = async (newListing) => {
    try {
      const formatted = {
        ...newListing,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        likes: 0,
        liked: false,
        saved: false,
        rented: false,
        userId: authUser.uid,
        userName: `${authUser.firstName || ''} ${authUser.lastName || ''}`.trim() || "You",
        firstName: authUser.firstName || "",
        lastName: authUser.lastName || "",
        userAvatar: authUser.avatar || authUser.photoURL || "",
        price:
          newListing.priceMonthly
            ? newListing.priceMonthly * 12
            : newListing.priceYearly || newListing.pricePerNight || 0,
      };

      await addDoc(collection(db, "listings"), formatted);
      // onSnapshot will update UI
    } catch (err) {
      console.error("Failed to add listing:", err);
      Alert.alert("Error", "Failed to create listing. Please try again.");
      throw err;
    }
  };

  const updateListing = async (updated) => {
    try {
      const ref = doc(db, "listings", updated.id);
      await updateDoc(ref, {
        ...updated,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Failed to update listing:", err);
      Alert.alert("Error", "Failed to update listing.");
    }
  };

  const deleteListing = async (id) => {
    try {
      await deleteDoc(doc(db, "listings", id));
    } catch (err) {
      console.error("Failed to delete listing:", err);
      Alert.alert("Error", "Failed to delete listing.");
    }
  };

  const markAsRented = async (id, rentedState = true) => {
    try {
      const ref = doc(db, "listings", id);
      await updateDoc(ref, {
        rented: rentedState,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Failed to mark as rented:", err);
      Alert.alert("Error", "Failed to update rental status.");
    }
  };

  // Vendor listing functions
  const addVendorListing = async (newListing) => {
    try {
      const formatted = {
        title: newListing.title || "Untitled Vendor Post",
        description: newListing.description || "",
        images: newListing.images || [],
        price: newListing.price || 0,
        location: newListing.location || "Unknown",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        rented: false,
        userId: authUser.uid,
        userName: `${authUser.firstName || ''} ${authUser.lastName || ''}`.trim() || "You",
        firstName: authUser.firstName || "",
        lastName: authUser.lastName || "",
        userAvatar: authUser.avatar || authUser.photoURL || "",
      };
      await addDoc(collection(db, "vendorListings"), formatted);
    } catch (err) {
      console.error("Failed to add vendor listing:", err);
      Alert.alert("Error", "Failed to create vendor listing.");
    }
  };

  const deleteVendorListing = async (id) => {
    try {
      await deleteDoc(doc(db, "vendorListings", id));
    } catch (err) {
      console.error("Failed to delete vendor listing:", err);
      Alert.alert("Error", "Failed to delete vendor listing.");
    }
  };

  const markVendorListingAsRented = async (id) => {
    try {
      const ref = doc(db, "vendorListings", id);
      await updateDoc(ref, {
        rented: true,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Failed to mark vendor listing as rented:", err);
      Alert.alert("Error", "Failed to update vendor rental status.");
    }
  };

  return (
    <ListingContext.Provider
      value={{
        listings,
        loading,
        addListing,
        updateListing,
        deleteListing,
        markAsRented,
      }}
    >
      <VendorListingContext.Provider
        value={{
          vendorListings,
          loading,
          addVendorListing,
          deleteVendorListing,
          markVendorListingAsRented,
        }}
      >
        {children}
      </VendorListingContext.Provider>
    </ListingContext.Provider>
  );
};

export const useListing = () => useContext(ListingContext);
export const useVendorListing = () => useContext(VendorListingContext);