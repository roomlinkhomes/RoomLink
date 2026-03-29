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
  const { dark } = useTheme();
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

  const handleGoBack = () => {
    navigation.goBack();
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
        {/* Back Button - Left Side */}
        <TouchableOpacity
          onPress={handleGoBack}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={26} color={iconColor} />
        </TouchableOpacity>

        {/* Right Side Icons */}
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  backButton: {
    padding: 4,
  },
  icons: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    marginLeft: 28,
    position: "relative",
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
  },
  badgeText: {
    color: "#fff",
    fontSize: 6,
    fontWeight: "bold",
    letterSpacing: 0.3,
  },
});