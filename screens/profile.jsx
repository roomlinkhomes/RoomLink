// screens/ProfileScreen.jsx
import React, { useContext, useEffect, useState } from "react";
import { View, ActivityIndicator, Alert, useColorScheme } from "react-native";
import { UserContext } from "../context/UserContext";
import { useListing } from "../context/ListingContext";
import ProfileLayout from "../component/ProfileLayout";

export default function ProfileScreen({ route, navigation }) {
  const { user, getUserById } = useContext(UserContext);
  const { listings } = useListing(); // all listings from context
  const { userId: routeUserId } = route.params || {};

  const [visitedUser, setVisitedUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const scheme = useColorScheme();
  const spinnerColor = scheme === "dark" ? "#fff" : "#1A237E";

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        let fetchedUser = null;

        if (routeUserId && routeUserId !== user?.id) {
          // Fetch another user's profile
          fetchedUser = await getUserById(routeUserId);
        } else {
          // Current logged-in user
          fetchedUser = user;
        }

        if (!fetchedUser) {
          Alert.alert("Error", "User not found.");
          return;
        }

        setVisitedUser(fetchedUser);
      } catch (err) {
        console.error("Error fetching user:", err);
        Alert.alert("Error", "Unable to load profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [routeUserId, getUserById, user]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={spinnerColor} />
      </View>
    );
  }

  if (!visitedUser) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Alert title="Error" message="User not found." />
      </View>
    );
  }

  // Filter listings for visited user using authorId
  const visitedUserListings = listings.filter(
    (listing) => listing.authorId === visitedUser.id
  );

  return (
    <ProfileLayout
      navigation={navigation}
      visitedUser={visitedUser}
      visitedUserListings={visitedUserListings}
      currentUser={user} // pass current user to help UserListings detect ownership
    />
  );
}
