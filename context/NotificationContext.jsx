// context/NotificationContext.jsx — PRODUCTION SAFE
import React, { createContext, useContext, useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useUser } from "./UserContext";

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useUser(); // Firebase auth user
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // 🔒 AUTH GUARD
    if (!user?.uid) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notifs = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data(),
        }));

        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.read).length);
      },
      (error) => {
        console.error("Notification listener error:", error);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const markAsRead = async (id) => {
    if (!user?.uid) return;

    try {
      await updateDoc(doc(db, "notifications", id), {
        read: true,
        readAt: serverTimestamp(),
      });

      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (e) {
      console.error("Failed to mark as read", e);
    }
  };

  const markAllAsRead = async () => {
    if (!user?.uid) return;

    try {
      await Promise.all(
        notifications
          .filter(n => !n.read)
          .map(n =>
            updateDoc(doc(db, "notifications", n.id), {
              read: true,
              readAt: serverTimestamp(),
            })
          )
      );
    } catch (e) {
      console.error("Failed to mark all as read", e);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

// Optional hook
export const useNotifications = () => useContext(NotificationContext);
