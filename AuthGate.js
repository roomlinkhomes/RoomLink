// AuthGate.jsx (or .js)
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { onAuthStateChanged, getAuth } from "firebase/auth"; // or '@react-native-firebase/auth'
import { auth } from "./firebaseConfig"; // adjust import if using modular vs compat
import AppTabs from "./navigation/AppTabs";
// import VendorTabs from "./navigation/VendorTabs"; // uncomment if using role-based tabs
import Login from "./screens/login";
import { setupPushNotifications } from "./utils/pushNotifications"; // ← your push file

export default function AuthGate() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Optional: track if this is the very first auth check
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    console.log('[AuthGate] Starting auth listener...');

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log(
        '[AuthGate] onAuthStateChanged fired → user:',
        currentUser ? currentUser.uid : 'null',
        '| initializing:',
        initializing
      );

      setUser(currentUser);
      setLoading(false);

      // Only do one-time setup after first auth callback
      if (initializing) {
        setInitializing(false);

        // If user already exists on app start → setup push immediately
        if (currentUser) {
          console.log('[AuthGate] User present on init → running push setup');
          setupPushNotifications();
        }
      }
    });

    return () => {
      console.log('[AuthGate] Unsubscribing auth listener');
      unsubscribe();
    };
  }, []);

  // If user logs in AFTER app start → run push setup when user appears
  useEffect(() => {
    if (!initializing && !loading && user) {
      console.log('[AuthGate] User became available after init → running push setup');
      setupPushNotifications();
    }
  }, [user, initializing, loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#036dd6" /> {/* add color if you want */}
      </View>
    );
  }

  // Optional: role-based routing (if your users have roles like vendor/normal)
  // if (user) {
  //   // Check user.role or user.isVendor from Firestore/user doc
  //   return <VendorTabs />;
  // }

  return user ? <AppTabs /> : <Login />;
}