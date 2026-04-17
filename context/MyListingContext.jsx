// context/MyListingContext.jsx
import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useUser } from "./UserContext";
import { useListing } from "./ListingContext"; // assuming you have this, or use ListingContext

export const MyListingContext = createContext();

export const MyListingProvider = ({ children }) => {
  const { user, loading: userLoading } = useUser();
  const { listings, deleteListing, addListing, markAsRented, loading: listingsLoading } = useListing(); // adjust if your context name is different

  const currentUserId = user?.id || user?.uid || null;

  // Stable myListings with ready check
  const myListings = useMemo(() => {
    if (userLoading || !currentUserId || !listings?.length) return [];
    return listings.filter((item) => {
      const itemOwnerId = item?.userId ?? item?.ownerId ?? item?.authorId ?? item?.uid ?? null;
      return itemOwnerId === currentUserId;
    });
  }, [listings, currentUserId, userLoading]);

  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const openMenu = (item) => {
    setSelectedItem(item);
    setMenuVisible(true);
  };

  const closeMenu = () => {
    setMenuVisible(false);
    setSelectedItem(null);
  };

  const value = {
    myListings,
    currentUserId,
    menuVisible,
    selectedItem,
    openMenu,
    closeMenu,
    deleteListing,
    addListing,
    markAsRented,
    isReady: !userLoading && !!currentUserId,
    listingsLoading,
  };

  return (
    <MyListingContext.Provider value={value}>
      {children}
    </MyListingContext.Provider>
  );
};

export const useMyListing = () => {
  const ctx = useContext(MyListingContext);
  if (!ctx) throw new Error("useMyListing must be used within a MyListingProvider");
  return ctx;
};