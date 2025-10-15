import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const BookmarkContext = createContext();

export const BookmarkProvider = ({ children }) => {
  const [bookmarks, setBookmarks] = useState([]);

  // Load bookmarks on mount
  useEffect(() => {
    const loadBookmarks = async () => {
      try {
        const saved = await AsyncStorage.getItem("bookmarks");
        if (saved) setBookmarks(JSON.parse(saved));
      } catch (err) {
        console.log("Error loading bookmarks:", err);
      }
    };
    loadBookmarks();
  }, []);

  // Persist bookmarks whenever they change
  useEffect(() => {
    AsyncStorage.setItem("bookmarks", JSON.stringify(bookmarks)).catch((err) =>
      console.log("Error saving bookmarks:", err)
    );
  }, [bookmarks]);

  // Add a bookmark
  const addBookmark = (item) => {
    if (!item?.id) return;
    setBookmarks((prev) => {
      // Prevent duplicates
      if (prev.find((b) => b.id === item.id)) return prev;
      return [item, ...prev];
    });
  };

  // Remove a bookmark
  const removeBookmark = (id) =>
    setBookmarks((prev) => prev.filter((b) => b.id !== id));

  return (
    <BookmarkContext.Provider value={{ bookmarks, addBookmark, removeBookmark }}>
      {children}
    </BookmarkContext.Provider>
  );
};

// Custom hook
export const useBookmark = () => {
  const context = useContext(BookmarkContext);
  if (!context) throw new Error("useBookmark must be used within BookmarkProvider");
  return context;
};
