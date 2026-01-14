// screens/ProfileListingsScreen.jsx
import React, { useContext, useEffect } from "react";
import { View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import MyListings from "./MyListings.jsx";           // .js
import VisitorListings from "./VisitorListings.jsx"; // .js
import { UserContext } from "../context/UserContext";

export default function ProfileListingsScreen({ route }) {
  const navigation = useNavigation();
  const { user: currentUser } = useContext(UserContext);
  const { userId } = route.params || {};

  const isMyProfile = !userId || userId === currentUser?.uid;

  useEffect(() => {
    navigation.setOptions({ title: isMyProfile ? "My Listings" : "Their Listings" });
  }, [isMyProfile]);

  return (
    <View style={{ flex: 1 }}>
      {isMyProfile ? <MyListings /> : <VisitorListings userId={userId} />}
    </View>
  );
}