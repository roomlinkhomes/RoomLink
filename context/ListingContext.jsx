// context/ListingContext.jsx — FIXED: Removed getIdToken calls + aggressive cache clear + debug logs
import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserContext } from "./UserContext";
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
} from "firebase/firestore";

export const ListingContext = createContext();
export const VendorListingContext = createContext();

export const ListingProvider = ({ children }) => {
  const { user } = useContext(UserContext);

  const [listings, setListings] = useState([]);
  const [vendorListings, setVendorListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Clear cache on every login (prevents showing stale/empty data)
  useEffect(() => {
    if (user?.uid) {
      const clearOnLogin = async () => {
        try {
          await AsyncStorage.multiRemove(["listings", "vendorListings"]);
          console.log("[ListingContext] Cleared stale cache on fresh login");
          setListings([]); // Force UI to wait for Firestore
        } catch (err) {
          console.log("Cache clear failed:", err);
        }
      };
      clearOnLogin();
    } else {
      // Logged out → clear everything
      setListings([]);
      setVendorListings([]);
      setLoading(false);
    }
  }, [user?.uid]);

  // Save to AsyncStorage when data changes (after loading)
  useEffect(() => {
    if (loading) return;
    Promise.all([
      AsyncStorage.setItem("listings", JSON.stringify(listings)),
      AsyncStorage.setItem("vendorListings", JSON.stringify(vendorListings)),
    ]).catch((err) => console.log("Save error:", err));
  }, [listings, vendorListings, loading]);

  // Main listings listener (no getIdToken – Expo/Firebase handles token refresh)
  useEffect(() => {
    if (!user?.uid) {
      setListings([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    console.log("[ListingContext] Starting main listener for uid:", user.uid);

    let retryCount = 0;
    const maxRetries = 3;

    const startListener = () => {
      const q = query(collection(db, "listings"), orderBy("createdAt", "desc"));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        console.log("[Listing] Snapshot received – docs count:", snapshot.docs.length);

        if (snapshot.empty) {
          console.log("[Listing] No documents found – check data or rules");
        }

        const allListings = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const boosted = allListings.filter((item) => {
          return item.boostedUntil && new Date(item.boostedUntil) > new Date();
        });

        const normal = allListings.filter((item) => {
          return !item.boostedUntil || new Date(item.boostedUntil) <= new Date();
        });

        const enrichedNormal = normal.map((item) =>
          item.userId === user.uid
            ? {
                ...item,
                userName: `${user.firstName} ${user.lastName}`,
                userAvatar: user.avatar || "",
              }
            : item
        );

        const enrichedBoosted = boosted.map((item) =>
          item.userId === user.uid
            ? {
                ...item,
                userName: `${user.firstName} ${user.lastName}`,
                userAvatar: user.avatar || "",
              }
            : item
        );

        enrichedNormal.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const finalList = [];
        let normalIndex = 0;

        enrichedNormal.forEach((post) => {
          finalList.push({
            ...post,
            _key: post.id,
          });

          normalIndex++;

          if (normalIndex % Math.floor(Math.random() * 6 + 10) === 0 && enrichedBoosted.length > 0) {
            const randomBoost = enrichedBoosted[Math.floor(Math.random() * enrichedBoosted.length)];
            finalList.push({
              ...randomBoost,
              _key: `${randomBoost.id}-boost-sprinkle-${normalIndex}-${Math.random()}`,
            });
          }
        });

        setListings(finalList);
        setLoading(false);
      }, (error) => {
        console.error("[Listing] onSnapshot error:", error.code, error.message);
        if (error.code === 'permission-denied' && retryCount < maxRetries) {
          retryCount++;
          console.log(`[Listing] Permission denied – retry ${retryCount}/${maxRetries} in 2s`);
          setTimeout(startListener, 2000);
        } else {
          setLoading(false);
        }
      });

      return unsubscribe;
    };

    const cleanup = startListener();

    return () => cleanup && cleanup();
  }, [user?.uid]);

  // Vendor listener – same clean pattern
  useEffect(() => {
    if (!user?.uid) {
      setVendorListings([]);
      return;
    }

    console.log("[ListingContext] Starting vendor listener for uid:", user.uid);

    const q = query(collection(db, "vendorListings"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log("[Vendor] Snapshot received – docs count:", snapshot.docs.length);

      const updated = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setVendorListings(
        updated.map((item) =>
          item.userId === user.uid
            ? {
                ...item,
                userName: `${user.firstName} ${user.lastName}`,
                userAvatar: user.avatar || "",
              }
            : item
        )
      );
    }, (error) => {
      console.error("[Vendor] onSnapshot error:", error.code, error.message);
    });

    return unsubscribe;
  }, [user?.uid]);

  // ──────────────────────────────────────────────
  // CRUD functions (unchanged)
  // ──────────────────────────────────────────────

  const addListing = async (newListing) => {
    if (!user?.uid) return;

    const formatted = {
      ...newListing,
      createdAt: Date.now(),
      likes: 0,
      liked: false,
      saved: false,
      rented: false,
      userId: user.uid,
      userName: `${user.firstName} ${user.lastName}`,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      userAvatar: user.avatar || "",
      price:
        newListing.priceMonthly
          ? newListing.priceMonthly * 12
          : newListing.priceYearly || newListing.pricePerNight || 0,
    };

    try {
      await addDoc(collection(db, "listings"), formatted);
    } catch (err) {
      console.log("Failed to add listing:", err);
      throw err;
    }
  };

  const updateListing = async (updated) => {
    try {
      const ref = doc(db, "listings", updated.id);
      await updateDoc(ref, updated);
      setListings((prev) =>
        prev.map((item) =>
          item.id === updated.id ? { ...item, ...updated } : item
        )
      );
    } catch (err) {
      console.log("Failed to update listing:", err);
    }
  };

  const deleteListing = async (id) => {
    try {
      await deleteDoc(doc(db, "listings", id));
      setListings((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.log("Failed to delete listing:", err);
    }
  };

  const markAsRented = async (id, rentedState = true) => {
    try {
      const ref = doc(db, "listings", id);
      await updateDoc(ref, { rented: rentedState });
      setListings((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, rented: rentedState } : item
        )
      );
    } catch (err) {
      console.log("Failed to mark as rented:", err);
    }
  };

  const addVendorListing = async (newListing) => {
    if (!user?.uid) return;
    const formatted = {
      title: newListing.title || "Untitled Vendor Post",
      description: newListing.description || "",
      images: newListing.images || [],
      price: newListing.price || 0,
      location: newListing.location || "Unknown",
      createdAt: Date.now(),
      rented: false,
      userId: user.uid,
      userName: `${user.firstName} ${user.lastName}`,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      userAvatar: user.avatar || "",
    };
    try {
      await addDoc(collection(db, "vendorListings"), formatted);
    } catch (err) {
      console.log("Failed to add vendor listing:", err);
    }
  };

  const deleteVendorListing = async (id) => {
    try {
      await deleteDoc(doc(db, "vendorListings", id));
      setVendorListings((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.log("Failed to delete vendor listing:", err);
    }
  };

  const markVendorListingAsRented = async (id) => {
    try {
      const ref = doc(db, "vendorListings", id);
      await updateDoc(ref, { rented: true });
      setVendorListings((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, rented: true } : item
        )
      );
    } catch (err) {
      console.log("Failed to mark vendor listing as rented:", err);
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
        toggleLike: () => {},
        toggleSave: () => {},
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