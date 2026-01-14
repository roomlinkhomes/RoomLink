// screens/profile/MyProfileScreen.jsx
import React from "react";
import { View, ActivityIndicator } from "react-native";
import { useUser } from "../../context/UserContext";
import { useListing } from "../../context/ListingContext";
import ProfileLayout from "../../component/ProfileLayout";

export default function MyProfileScreen({ navigation }) {
  const { user } = useUser();
  const { listings } = useListing();

  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#036dd6" />
      </View>
    );
  }

  // FIXED: Use .uid, not .id
  const myListings = listings.filter((l) => l.authorId === user.uid);

  return (
    <ProfileLayout
      profileData={user}
      isOwner={true}
      visitedUserListings={myListings}
      currentUser={user}
      navigation={navigation}
      isMyProfileTab={true}  // FORCES YOUR PROFILE ONLY
    />
  );
}