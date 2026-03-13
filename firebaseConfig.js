// firebaseConfig.js — ONLY import this file ONCE in your app (e.g., in App.js or a top-level context)
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  initializeAuth, 
  getReactNativePersistence, 
  getAuth  // add this for fallback
} from "firebase/auth";
import { getFirestore, serverTimestamp } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyATm08xqtzXsiftaxlq9zvB7pPPXaePDTI",
  authDomain: "roomlink-homes.firebaseapp.com",
  projectId: "roomlink-homes",
  storageBucket: "roomlink-homes.firebasestorage.app",
  messagingSenderId: "796064439495",
  appId: "1:796064439495:web:6b99c970d933238967f2e2",
};

// Singleton pattern — initialize only if none exist
const app = !getApps().length 
  ? initializeApp(firebaseConfig) 
  : getApp();  // Reuse existing default app

// Auth: Initialize with persistence, fallback if already done
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  if (e.code?.includes('already-initialized') || e.message?.includes('already exists')) {
    auth = getAuth(app);  // Safe fallback
  } else {
    console.error("Auth init failed:", e);
    throw e;
  }
}

const db = getFirestore(app);

export { app, auth, db, serverTimestamp };