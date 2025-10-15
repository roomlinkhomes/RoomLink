// AuthGate.js
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebaseConfig";
import AppTabs from "./navigation/AppTabs";
import VendorTabs from "./navigation/VendorTabs";
import Login from "./screens/login";

export default function AuthGate() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // if user exists, go to Home or Vendor app
  if (user) {
    return <AppTabs />;
  }

  // otherwise, go to Login
  return <Login />;
}
