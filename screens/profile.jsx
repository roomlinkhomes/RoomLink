// screens/Profile.jsx
import React, { useContext, useEffect, useState } from "react";
import { View, ActivityIndicator, Alert } from "react-native";
import { UserContext } from "../context/UserContext";
import ProfileLayout from "../component/ProfileLayout";

export default function Profile({ route, navigation }) {
  const { user, getUserById } = useContext(UserContext);
  const { vendor, userId } = route.params || {};

  const [profileData, setProfileData] = useState(vendor || user || {});
  const [loading, setLoading] = useState(false);

  const isOwner = !vendor && !userId; // logged-in user's own profile

  useEffect(() => {
    const fetchUser = async () => {
      if (userId) {
        try {
          setLoading(true);
          const fetchedUser = await getUserById(userId);
          setProfileData(fetchedUser || {});
        } catch (err) {
          console.log("Error fetching user:", err);
          Alert.alert("Error", "Unable to load profile.");
        } finally {
          setLoading(false);
        }
      }
    };
    fetchUser();
  }, [userId]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#1A237E" />
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
