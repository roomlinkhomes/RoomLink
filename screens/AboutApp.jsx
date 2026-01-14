// screens/AboutApp.jsx — FINAL & 100% WORKING
import React, { useContext } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  Platform,
  Linking,
  Alert,
} from "react-native";
import { List, Divider } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { ThemeContext } from "../context/ThemeContext";

export default function AboutApp({ navigation }) {  // ← Added navigation prop
  const { darkMode } = useContext(ThemeContext);
  const isDark = darkMode;

  const textColor = isDark ? "#fff" : "#000";
  const secondaryText = isDark ? "#aaa" : "#666";
  const iconColor = isDark ? "#999" : "#666";
  const background = isDark ? "#000" : "#fff";
  const dividerColor = isDark ? "#333" : "#eee";

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.header, { color: textColor }]}>About RoomLink</Text>

        <View style={styles.content}>

          {/* App Icon + Name + Version */}
          <View style={styles.appInfo}>
            <View style={styles.iconPlaceholder}>
              <Text style={styles.iconText}>RL</Text>
            </View>
            <Text style={[styles.appName, { color: textColor }]}>RoomLink</Text>
            <Text style={[styles.version, { color: secondaryText }]}>Version 1.0.0 (Build 100)</Text>
          </View>

          <Divider style={{ backgroundColor: dividerColor, marginVertical: 32 }} />

          {/* Website */}
          <List.Item
            title="Website"
            description="roomlink.homes"
            titleStyle={[styles.title, { color: textColor }]}
            descriptionStyle={{ color: "#017a6b" }}
            left={() => <Icon name="earth" size={24} color={iconColor} />}
            right={() => <Icon name="open-in-new" size={22} color="#017a6b" />}
            onPress={() => Linking.openURL("https://roomlink.homes")}
          />

          {/* Privacy Policy */}
          <List.Item
            title="Privacy Policy"
            titleStyle={[styles.title, { color: textColor }]}
            left={() => <Icon name="shield-check-outline" size={24} color={iconColor} />}
            right={() => <Icon name="chevron-right" size={28} color="#c7c7cc" />}
            onPress={() => navigation.navigate("Privacy")} // ← Now works!
          />

          {/* Terms of Service */}
          <List.Item
            title="Terms of Service"
            titleStyle={[styles.title, { color: textColor }]}
            left={() => <Icon name="file-document-outline" size={24} color={iconColor} />}
            right={() => <Icon name="chevron-right" size={28} color="#c7c7cc" />}
            onPress={() => Linking.openURL("https://roomlink.homes/terms")}
          />

          {/* Rate RoomLink */}
          <List.Item
            title="Rate RoomLink"
            titleStyle={[styles.title, { color: textColor }]}
            left={() => <Icon name="star-outline" size={24} color={iconColor} />}
            right={() => <Icon name="chevron-right" size={28} color="#c7c7cc" />}
            onPress={() => {
              const packageName = "com.roomlink.app"; // ← CHANGE TO YOUR REAL PACKAGE NAME
              const iosAppId = "1234567890"; // ← CHANGE WHEN LIVE ON APP STORE

              if (Platform.OS === "android") {
                Linking.openURL(`market://details?id=${packageName}`).catch(() =>
                  Linking.openURL(`https://play.google.com/store/apps/details?id=${packageName}`)
                );
              } else {
                Linking.openURL(`https://apps.apple.com/app/id${iosAppId}`).catch(() =>
                  Alert.alert("App Store", "Search 'RoomLink' to leave a review!")
                );
              }
            }}
          />

          {/* Send Feedback */}
          <List.Item
            title="Send Feedback"
            titleStyle={[styles.title, { color: textColor }]}
            left={() => <Icon name="message-outline" size={24} color={iconColor} />}
            right={() => <Icon name="chevron-right" size={28} color="#c7c7cc" />}
            onPress={() => Linking.openURL("mailto:hello@roomlink.homes")}
          />

          <Divider style={{ backgroundColor: dividerColor, marginVertical: 32 }} />

          {/* Made with love */}
          <Text style={[styles.madeWith, { color: secondaryText }]}>
            Sponsored <Text style={{ color: "#e255" }}>♥</Text> by Kingmaxy
          </Text>
          <Text style={[styles.copyright, { color: secondaryText }]}>
            © 2025 RoomLink Homes Ltd. All rights reserved.
          </Text>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    fontSize: 34,
    fontWeight: "bold",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 20,
  },
  content: {
    paddingHorizontal: 16,
  },
  appInfo: {
    alignItems: "center",
    marginVertical: 20,
  },
  iconPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: "#017a6b",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  iconText: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#fff",
  },
  appName: {
    fontSize: 28,
    fontWeight: "700",
  },
  version: {
    fontSize: 15,
    marginTop: 6,
  },
  title: {
    fontSize: 17,
    fontWeight: "400",
  },
  madeWith: {
    textAlign: "center",
    fontSize: 15,
    marginTop: 40,
  },
  copyright: {
    textAlign: "center",
    fontSize: 13,
    marginTop: 8,
    marginBottom: 60,
  },
});