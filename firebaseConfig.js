// firebaseConfig.js — Import this file ONLY ONCE in your app (e.g. in App.js)
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence,
  getAuth,
} from "firebase/auth";
import { 
  getFirestore, 
  initializeFirestore, 
  serverTimestamp 
} from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyATm08xqtzXsiftaxlq9zvB7pPPXaePDTI",
  authDomain: "roomlink-homes.firebaseapp.com",
  projectId: "roomlink-homes",
  storageBucket: "roomlink-homes.firebasestorage.app",
  messagingSenderId: "796064439495",
  appId: "1:796064439495:web:6b99c970d933238967f2e2",
};

// Singleton: Initialize app only once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with persistence
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  if (e.code?.includes('already-initialized') || e.message?.includes('already exists')) {
    auth = getAuth(app);
  } else {
    console.error("Auth init failed:", e);
    throw e;
  }
}

// === FIXED Firestore Initialization (Safe for Release Build) ===
let db;
try {
  // Try to initialize with production settings (long polling helps release builds)
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
    ignoreUndefinedProperties: true,
  });
} catch (e) {
  // If already initialized (with or without settings), just get the existing instance
  if (e.message?.includes("already been called") || e.code?.includes("already-initialized")) {
    db = getFirestore(app);
    console.warn("Firestore already initialized. Using existing instance.");
  } else {
    console.error("Firestore init failed:", e);
    throw e;
  }
}

export { app, auth, db, serverTimestamp };