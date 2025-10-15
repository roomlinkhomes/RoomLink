// screens/UserProfile.jsx
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Alert } from "react-native";
import { useUser } from "../context/UserContext";
import ProfileLayout from "../component/ProfileLayout";

export default function UserProfile({ route, navigation }) {
  const { user, getUserById } = useUser();
  const { userId, vendor } = route.params || {};

  const [profileData, setProfileData] = useState(vendor || null);
  const [loading, setLoading] = useState(false);

  // check if viewing self  
  const isOwner = !userId && !vendor;

  useEffect(() => {
    const fetchProfile = async () => {
      if (userId) {
        try {
          setLoading(true);
          const fetched = await getUserById(userId);
          setProfileData(fetched || {});
        } catch (err) {
          console.error("Failed to load profile:", err);
          Alert.alert("Error", "Could not load user profile.");
        } finally {
          setLoading(false);
        }
      } else if (!vendor && user) {
        setProfileData(user);
      }
    };
    fetchProfile();
  }, [userId, vendor, user]);

  if (loading || !profileData) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#036dd6" />
      </View>
    );
  }

  return (
    <ProfileLayout
      profileData={profileData}
      isOwner={isOwner}
      navigation={navigation}
    />
  );
}
