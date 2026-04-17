// context/NotificationContext.jsx - FIXED FOR COLD START (New Accounts + Reopen)
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  doc,
  updateDoc,
  serverTimestamp,
  getDocs,
  limit,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useUser } from "./UserContext";

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user, loading: userLoading } = useUser();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Wait until UserContext is fully ready
    if (userLoading) {
      console.log("⏳ NotificationContext waiting for user...");
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const userId = user?.id || user?.uid;
    if (!userId) {
      console.log("⚠️ No userId in NotificationContext");
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    console.log("✅ Starting notifications for user:", userId);

    setLoading(true);

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    // Initial fetch (very important for cold start)
    const doInitialFetch = async (attempt = 1) => {
      try {
        const snapshot = await getDocs(q);
        const notifs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        setNotifications(notifs);
        setUnreadCount(notifs.filter((n) => !n.read).length);
        console.log(`✅ Initial notifications loaded: ${notifs.length}`);
      } catch (err) {
        console.error(`Initial fetch attempt ${attempt} failed:`, err);
        if (attempt < 3) {
          setTimeout(() => doInitialFetch(attempt + 1), 800);
        }
      } finally {
        setLoading(false);
      }
    };

    doInitialFetch();

    // Real-time listener
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const notifs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setNotifications(notifs);
        setUnreadCount(notifs.filter((n) => !n.read).length);
        setLoading(false);
        console.log(`📡 Live update: ${notifs.length} notifications`);
      },
      (error) => {
        console.error("Notification listener error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.id, user?.uid, userLoading]);   // Important: depend on userLoading too

  const markAsRead = useCallback(async (id) => {
    const userId = user?.id || user?.uid;
    if (!userId) return;
    try {
      await updateDoc(doc(db, "notifications", id), {
        read: true,
        readAt: serverTimestamp(),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (e) {
      console.error("Failed to mark as read", e);
    }
  }, [user?.id, user?.uid]);

  const refreshNotifications = useCallback(async () => {
    const userId = user?.id || user?.uid;
    if (!userId) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, "notifications"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(50)
      );
      const snapshot = await getDocs(q);
      const notifs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n) => !n.read).length);
    } catch (e) {
      console.error("Refresh failed", e);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.uid]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        refreshNotifications,
        loading,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);