import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ------------------- MAIN LISTINGS -------------------
export const ListingContext = createContext();

export const ListingProvider = ({ children }) => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadListings = async () => {
      try {
        const savedListings = await AsyncStorage.getItem("listings");
        if (savedListings) setListings(JSON.parse(savedListings));
      } catch (err) {
        console.log("Error loading listings:", err);
      } finally {
        setLoading(false);
      }
    };
    loadListings();
  }, []);

  useEffect(() => {
    if (!loading) {
      AsyncStorage.setItem("listings", JSON.stringify(listings)).catch((err) =>
        console.log("Error saving listings:", err)
      );
    }
  }, [listings, loading]);

  const addListing = (newListing) => {
    const formatted = {
      id: Date.now().toString(),
      title: newListing.title || "Untitled",
      description: newListing.description || "",
      images: newListing.images || [],
      price: newListing.price || 0,
      location: newListing.location || "Unknown",
      createdAt: new Date().toISOString(),
      likes: 0,
      liked: false,
      saved: false,
      author: newListing.author || null,
      rented: false, // ✅ added default rented flag
    };
    setListings((prev) => [formatted, ...prev]);
  };

  // ✅ Updated to accept full object instead of (id, updates)
  const updateListing = (updatedListing) => {
    setListings((prev) =>
      prev.map((item) =>
        item.id === updatedListing.id ? { ...item, ...updatedListing } : item
      )
    );
  };

  const deleteListing = (id) =>
    setListings((prev) => prev.filter((item) => item.id !== id));

  const toggleLike = (id) =>
    setListings((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              liked: !item.liked,
              likes: item.liked ? item.likes - 1 : item.likes + 1,
            }
          : item
      )
    );

  const toggleSave = (id) =>
    setListings((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, saved: !item.saved } : item
      )
    );

  // ✅ NEW FEATURE: Mark listing as rented
  const markAsRented = (id) => {
    setListings((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, rented: true } : item
      )
    );
  };

  return (
    <ListingContext.Provider
      value={{
        listings,
        loading,
        addListing,
        updateListing,
        deleteListing,
        toggleLike,
        toggleSave,
        markAsRented, // ✅ exported new function
      }}
    >
      {children}
    </ListingContext.Provider>
  );
};

export const useListing = () => useContext(ListingContext);

// ------------------- VENDOR LISTINGS -------------------
export const VendorListingContext = createContext();

export const VendorListingProvider = ({ children }) => {
  const [vendorListings, setVendorListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVendorListings = async () => {
      try {
        const saved = await AsyncStorage.getItem("vendorListings");
        if (saved) setVendorListings(JSON.parse(saved));
      } catch (err) {
        console.log("Error loading vendor listings:", err);
      } finally {
        setLoading(false);
      }
    };
    loadVendorListings();
  }, []);

  // Persist vendor listings whenever they change
  useEffect(() => {
    if (!loading) {
      AsyncStorage.setItem("vendorListings", JSON.stringify(vendorListings)).catch(
        (err) => console.log("Error saving vendor listings:", err)
      );
    }
  }, [vendorListings, loading]);

  // ✅ Add new vendor post and link to specific vendor ID
  const addVendorListing = (newListing, vendorId = "vendor123") => {
    const formatted = {
      id: Date.now().toString(),
      title: newListing.title || "Untitled Vendor Post",
      description: newListing.description || "",
      images: newListing.images || [],
      price: newListing.price || 0,
      location: newListing.location || "Unknown",
      createdAt: new Date().toISOString(),
      author: vendorId, // ✅ automatically assign vendor ID
      rented: false,
    };
    setVendorListings((prev) => [formatted, ...prev]);
  };

  const deleteVendorListing = (id) =>
    setVendorListings((prev) => prev.filter((item) => item.id !== id));

  // ✅ Added vendor-specific "mark as rented"
  const markVendorListingAsRented = (id) =>
    setVendorListings((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, rented: true } : item
      )
    );

  return (
    <VendorListingContext.Provider
      value={{
        vendorListings,
        loading,
        addVendorListing,
        deleteVendorListing,
        markVendorListingAsRented, // ✅ export for reuse
      }}
    >
      {children}
    </VendorListingContext.Provider>
  );
};

export const useVendorListing = () => useContext(VendorListingContext);
