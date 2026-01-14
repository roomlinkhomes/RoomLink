// context/ListingContext.jsx — FIXED: Now saves amenities + all future fields
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

  // Load cached data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [savedListings, savedVendor] = await Promise.all([
          AsyncStorage.getItem("listings"),
          AsyncStorage.getItem("vendorListings"),
        ]);
        if (savedListings) setListings(JSON.parse(savedListings));
        if (savedVendor) setVendorListings(JSON.parse(savedVendor));
      } catch (err) {
        console.log("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Save to AsyncStorage
  useEffect(() => {
    if (!loading) {
      Promise.all([
        AsyncStorage.setItem("listings", JSON.stringify(listings)),
        AsyncStorage.setItem("vendorListings", JSON.stringify(vendorListings)),
      ]).catch((err) => console.log("Error saving data:", err));
    }
  }, [listings, vendorListings, loading]);

  // Firestore listener for main listings
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(collection(db, "listings"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
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
    });

    return () => unsubscribe();
  }, [user?.uid, user?.firstName, user?.lastName, user?.avatar]);

  // Vendor listener
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(collection(db, "vendorListings"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
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
    });

    return () => unsubscribe();
  }, [user?.uid, user?.firstName, user?.lastName, user?.avatar]);

  if (!user?.uid) {
    return (
      <ListingContext.Provider value={{ listings: [], loading: false, addListing: () => {}, updateListing: () => {}, deleteListing: () => {}, toggleLike: () => {}, toggleSave: () => {}, markAsRented: () => {} }}>
        <VendorListingContext.Provider value={{ vendorListings: [], loading: false, addVendorListing: () => {}, deleteVendorListing: () => {}, markVendorListingAsRented: () => {} }}>
          {children}
        </VendorListingContext.Provider>
      </ListingContext.Provider>
    );
  }

  // === FIXED: addListing now saves ALL fields including amenities ===
  const addListing = async (newListing) => {
    if (!user?.uid) return;

    const formatted = {
      ...newListing, // ← SPREADS EVERYTHING: title, description, images, pricePerNight, listingType, amenities, category, etc.
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

      // Backward-compatible price field
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

  // Vendor functions unchanged
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