// screens/profile/PublicProfileScreen.jsx — FINAL WITH USER RATING + REVIEWS COMMENTS
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Alert } from "react-native";
import { useUser } from "../../context/UserContext";
import { useListing } from "../../context/ListingContext";
import ProfileLayout from "../../component/ProfileLayout";
import Rating from "../../component/Rating";
import SellerReviewsList from "../../component/SellerReviewsList"; // Correct path (components/ folder)

export default function PublicProfileScreen({ route, navigation }) {
  const { getUserById } = useUser();
  const { listings } = useListing();
  const { userId, vendor } = route.params || {};
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        let fetchedUser = null;
        if (vendor) {
          fetchedUser = vendor;
        } else if (userId) {
          fetchedUser = await getUserById(userId);
        }
        if (!fetchedUser) throw new Error("User not found");
        setProfileData(fetchedUser);
      } catch (err) {
        console.error("Failed to load profile:", err);
        Alert.alert("Error", "Could not load user profile.");
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId, vendor, getUserById, navigation]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#036dd6" />
      </View>
    );
  }

  if (!profileData) return null;

  const userListings = listings.filter((l) => l.authorId === profileData.uid);
  const targetUserId = profileData.uid || profileData.id;

  return (
    <ProfileLayout
      profileData={profileData}
      isOwner={false}
      visitedUserListings={userListings}
      currentUser={profileData}
      navigation={navigation}
      isMyProfileTab={false}
      
      // Reviews + rating input placed after all CTAs/categories
      extraContent={
        <View>
          {/* Star rating submission (already there) */}
          <View style={{ padding: 16, backgroundColor: "#f9f9f9", marginBottom: 24 }}>
            <Rating
              targetUserId={targetUserId}
              onRatingSubmitted={() => {
                console.log("Rating submitted!"); // Optional: refresh logic here later
              }}
            />
          </View>

          {/* Reviews comments section - this is what was missing */}
          <SellerReviewsList userId={targetUserId} />
        </View>
      }
    />
  );
}