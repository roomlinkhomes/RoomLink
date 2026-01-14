// context/MessageProvider.jsx — Fixed: expo-av → expo-audio (SDK 52+)
import React, { createContext, useContext, useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useUser } from "./UserContext";
import { AudioPlayer } from "expo-audio"; // ← NEW & OFFICIAL

const MessageContext = createContext();

export const MessageProvider = ({ children }) => {
  const { user } = useUser();
  const currentUserId = user?.uid;
  const [unreadConversations, setUnreadConversations] = useState(0);
  const [audioPlayer, setAudioPlayer] = useState(null);

  // Load & cache the notification sound once
  useEffect(() => {
    let player;
    (async () => {
      try {
        player = new AudioPlayer();
        await player.loadAsync(require("../assets/sounds/notification.mp3"));
        setAudioPlayer(player);
      } catch (err) {
        console.warn("Failed to load notification sound:", err);
      }
    })();

    return () => {
      player?.unloadAsync();
    };
  }, []);

  // Play notification sound (safe & silent on failure)
  const playSound = async () => {
    if (!audioPlayer) return;
    try {
      await audioPlayer.setPositionAsync(0); // Rewind
      await audioPlayer.playAsync();
    } catch (err) {
      console.warn("Sound play failed:", err);
    }
  };

  // Real-time listener for unread messages
  useEffect(() => {
    if (!currentUserId) return;

    const q = query(
      collection(db, "messages"),
      where("receiverId", "==", currentUserId),
      where("readBy", "not-in", [currentUserId])
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const conversations = new Set();
      snapshot.forEach((docSnap) => {
        const msg = docSnap.data();
        conversations.add(msg.listingId);
        playSound(); // ← Plays every new message (you can debounce if too noisy)
      });

      setUnreadConversations(conversations.size);
    });

    return () => unsub();
  }, [currentUserId, audioPlayer]);

  // MARK MESSAGES AS READ
  const markAsRead = async (listingId) => {
    if (!currentUserId) return;

    try {
      const q = query(
        collection(db, "messages"),
        where("receiverId", "==", currentUserId),
        where("listingId", "==", listingId),
        where("readBy", "not-in", [currentUserId])
      );

      const snapshot = await getDocs(q);
      const updates = snapshot.docs.map((docSnap) => {
        const messageRef = doc(db, "messages", docSnap.id);
        const data = docSnap.data();
        return updateDoc(messageRef, {
          readBy: [...(data.readBy || []), currentUserId],
        });
      });

      await Promise.all(updates);
    } catch (error) {
      console.warn("Failed to mark messages as read:", error);
    }
  };

  return (
    <MessageContext.Provider value={{ unreadConversations, markAsRead }}>
      {children}
    </MessageContext.Provider>
  );
};

export const useMessageCount = () => useContext(MessageContext);