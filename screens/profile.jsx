// screens/ProfileScreen.jsx - FIXED (Always show owner profile on Profile tab)

import React, { useEffect, useState, useCallback } from "react";
import { View, ActivityIndicator, useColorScheme, Text } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { useUser } from "../context/UserContext";
import { useListing } from "../context/ListingContext";

import EliteProfile from "../components/EliteProfile";
import VisitorEliteProfile from "../components/VisitorEliteProfile";

export default function ProfileScreen({ route, navigation }) {
  const { user: currentUser, loading: userLoading, resetToMyProfile } = useUser();
  const { listings } = useListing();

  // ✅ safer param handling
  const routeUserId = route?.params?.userId ?? null;

  const [displayUser, setDisplayUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const scheme = useColorScheme();
  const spinnerColor = scheme === "dark" ? "#fff" : "#1A237E";

  const currentUserId = currentUser?.id || currentUser?.uid;

  // ✅ CRITICAL FIX: runs every time screen is focused (tab click, reopen app, etc.)
  useFocusEffect(
    useCallback(() => {
      // If NO userId → this is Profile tab → force reset
      if (!routeUserId) {
        resetToMyProfile();

        // also clear any stale params from navigation
        navigation.setParams({ userId: null });
      }
    }, [routeUserId, resetToMyProfile, navigation])
  );

  // Determine which user to display
  useEffect(() => {
    setLoading(true);

    // If no routeUserId → always use current logged-in user
    const targetId = routeUserId || currentUserId;

    if (!targetId) {
      setDisplayUser(null);
      setLoading(false);
      return;
    }

    setDisplayUser({
      id: targetId,
      uid: targetId,
    });

    setLoading(false);
  }, [routeUserId, currentUserId]);

  // isOwner logic
  const isOwner =
    !routeUserId ||
    currentUserId === routeUserId ||
    currentUserId === displayUser?.id ||
    currentUserId === displayUser?.uid;

  // Filter listings
  const userListings = listings.filter((listing) => {
    const listingOwner =
      listing.authorId ||
      listing.userId ||
      listing.ownerId ||
      listing.uid;

    return listingOwner === (routeUserId || currentUserId);
  });

  if (loading || userLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={spinnerColor} />
      </View>
    );
  }

  if (!displayUser) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>User not found</Text>
      </View>
    );
  }

  return isOwner ? (
    <EliteProfile visitedUserListings={userListings} />
  ) : (
    <VisitorEliteProfile
      userId={routeUserId}
      visitedUserListings={userListings}
    />
  );
}