// components/ProfileTopBar.jsx
import React from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Share,
  StatusBar,
  Text,
} from "react-native";
import { useNavigation, useTheme } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ProfileTopBar({ userId }) {
  const navigation = useNavigation();
  const { dark } = useTheme(); // ← dark comes from here
  const insets = useSafeAreaInsets();

  const supportUID = "PdEzQK2PxUccxbJLJo67lRi21NR2";

  const handleShare = async () => {
    try {
      const profileLink = `https://roomlink.homes/profile/${userId || ""}`;
      await Share.share({
        message: `Check out this profile on Roomlink \n${profileLink}`,
        url: profileLink,
        title: "Share Profile",
      });
    } catch (error) {
      console.log("Error sharing profile:", error);
    }
  };

  const handleSupportChat = () => {
    navigation.navigate("HomeTabs", {
      screen: "Messages",
      params: {
        screen: "Message",
        params: {
          recipientUID: supportUID,
          otherUserName: "RoomLink Support",
        },
      },
    });
  };

  const iconColor = dark ? "#fff" : "#000";

  return (
    <>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={dark ? "light-content" : "dark-content"}
      />

      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top + 10,
          },
        ]}
      >
        <View style={styles.icons}>
          {/* Support Chat with Help badge */}
          <TouchableOpacity
            onPress={handleSupportChat}
            style={styles.iconButton}
          >
            <Ionicons name="headset-outline" size={26} color={iconColor} />
            <View style={[styles.badge, { borderColor: dark ? "#000" : "#fff" }]}>
              <Text style={styles.badgeText}>Help</Text>
            </View>
          </TouchableOpacity>

          {/* Share */}
          <TouchableOpacity onPress={handleShare} style={styles.iconButton}>
            <Ionicons name="share-social" size={26} color={iconColor} />
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}




const styles = StyleSheet.create({
  container: {
    backgroundColor: "transparent",
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  icons: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    marginLeft: 35,
    position: "relative", // required for absolute positioning of badge
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -14,
    backgroundColor: "#ff3b30",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 34,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    // borderColor moved INSIDE component because it depends on dark
  },
  badgeText: {
    color: "#fff",
    fontSize: 6,
    fontWeight: "bold",
    letterSpacing: 0.3,
  },
});