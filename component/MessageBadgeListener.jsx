// components/MessageBadgeListener.jsx → FINAL WORKING VERSION
import React, { useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useUser } from "../context/UserContext";

export default function MessageBadgeListener() {
  const navigation = useNavigation();
  const { user } = useUser();

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "messages"),
      where("receiverId", "==", user.uid),
      where("read", "==", false) // ← MUST BE "read", NOT "seen"
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const count = snapshot.size;

      // THIS LINE IS THE KEY — UPDATES BADGE EVEN WHEN NOT ON MESSAGES TAB
      navigation.getParent()?.setOptions({
        tabBarBadge: count > 0 ? (count > 99 ? "99+" : count) : undefined,
        tabBarBadgeStyle: {
          backgroundColor: "#0df9a0",
          color: "#000",
          fontSize: 11,
          fontWeight: "bold",
          height: 22,
          minWidth: 22,
          borderRadius: 11,
        },
      });
    });

    return () => unsub();
  }, [user?.uid, navigation]);

  return null;
}