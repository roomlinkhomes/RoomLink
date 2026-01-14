// components/ProfileTopBar.jsx
import React from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  Share,
} from "react-native";
import { useNavigation, useTheme } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

export default function ProfileTopBar({ userId }) {
  const navigation = useNavigation();
  const { colors, dark } = useTheme();

  const handleShare = async () => {
    try {
      const profileLink = `https://roomlink.homes/profile/${userId || ""}`;
      await Share.share({
        message: `Check out this profile on Roomlink 👇\n${profileLink}`,
        url: profileLink,
        title: "Share Profile",
      });
    } catch (error) {
      console.log("Error sharing profile:", error);
    }
  };

  const iconColor = dark ? "#fff" : "#000";

  return (
    <>
      {/* Transparent status bar */}
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={dark ? "light-content" : "dark-content"}
      />

      <View
        style={[
          styles.container,
          {
            backgroundColor: "transparent",
            paddingTop:
              Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0,
          },
        ]}
      >
        <View style={styles.icons}>
          {/* Search icon */}
          <TouchableOpacity
            onPress={() => navigation.navigate("Search")}
            style={styles.iconButton}
          >
            <Ionicons name="search" size={26} color={iconColor} />
          </TouchableOpacity>

          {/* Share icon */}
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  icons: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    marginLeft: 22, // creates the gap between icons
  },
});
	
