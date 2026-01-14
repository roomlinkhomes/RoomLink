import { db } from "../config/firebase";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";

export const addView = async (listingId, userId) => {
  if (!userId) return;

  const ref = doc(db, "listings", listingId, "views", userId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, { viewedAt: new Date() });
  }
};

export const getViewCount = async (listingId) => {
  const col = collection(db, "listings", listingId, "views");
  const snap = await getDocs(col);
  return snap.size; // ← NUMBER OF UNIQUE USERS
};
