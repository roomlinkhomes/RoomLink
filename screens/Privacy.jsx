// Privacy.jsx — Clean, Modern, Matches Your Settings Perfectly
import React from "react";
import { View, ScrollView, StyleSheet, Text, Platform, Linking } from "react-native";
import { List, Divider } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";

export default function Privacy() {
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

        <Text style={[styles.header, { color: textColor }]}>Privacy</Text>

        <View style={styles.list}>

          <List.Item
            title="Data collection & use"
            description="How we collect and use your information"
            titleStyle={[styles.title, { color: textColor }]}
            descriptionStyle={{ color: secondaryText }}
            left={() => <Icon name="database-outline" size={24} color={iconColor} />}
            right={() => <Icon name="chevron-right" size={28} color="#c7c7cc" />}
            onPress={() => {}}
          />

          <List.Item
            title="Sharing & disclosure"
            description="When and with whom we share your data"
            titleStyle={[styles.title, { color: textColor }]}
            descriptionStyle={{ color: secondaryText }}
            left={() => <Icon name="share-outline" size={24} color={iconColor} />}
            right={() => <Icon name="chevron-right" size={28} color="#c7c7cc" />}
            onPress={() => {}}
          />

          <List.Item
            title="Your privacy rights"
            description="Access, delete, or restrict your data"
            titleStyle={[styles.title, { color: textColor }]}
            descriptionStyle={{ color: secondaryText }}
            left={() => <Icon name="hand-okay" size={24} color={iconColor} />}
            right={() => <Icon name="chevron-right" size={28} color="#c7c7cc" />}
            onPress={() => {}}
          />

          <List.Item
            title="Cookies & tracking"
            description="We don’t use cookies — you’re safe"
            titleStyle={[styles.title, { color: textColor }]}
            descriptionStyle={{ color: secondaryText }}
            left={() => <Icon name="cookie-off-outline" size={24} color={iconColor} />}
            right={() => <Icon name="chevron-right" size={28} color="#c7c7cc" />}
            onPress={() => {}}
          />

          <List.Item
            title="Data retention"
            description="How long we keep your information"
            titleStyle={[styles.title, { color: textColor }]}
            descriptionStyle={{ color: secondaryText }}
            left={() => <Icon name="clock-outline" size={24} color={iconColor} />}
            right={() => <Icon name="chevron-right" size={28} color="#c7c7cc" />}
            onPress={() => {}}
          />

          <List.Item
            title="Children’s privacy"
            description="We do not target users under 18"
            titleStyle={[styles.title, { color: textColor }]}
            descriptionStyle={{ color: secondaryText }}
            left={() => <Icon name="baby-face-outline" size={24} color={iconColor} />}
            right={() => <Icon name="chevron-right" size={28} color="#c7c7cc" />}
            onPress={() => {}}
          />

          <Divider style={{ backgroundColor: dividerColor, marginVertical: 24 }} />

          <List.Item
            title="Contact privacy team"
            titleStyle={[styles.title, { color: textColor }]}
            left={() => <Icon name="email-outline" size={24} color={iconColor} />}
            right={() => <Icon name="chevron-right" size={28} color="#c7c7cc" />}
            onPress={() => Linking.openURL("mailto:roomlinkapp@gmail.com")}
          />

          <List.Item
            title="Full Privacy Policy"
            titleStyle={{ color: "#017a6b", fontWeight: "600" }}
            left={() => <Icon name="file-document-outline" size={24} color="#017a6b" />}
            right={() => <Icon name="open-in-new" size={22} color="#017a6b" />}
            onPress={() => Linking.openURL("https://doc-hosting.flycricket.io/roomlink-privacy-policy/a6dd1327-c200-4adb-a491-e3812385b0e9/privacy")}
          />

        </View>

        <Text style={styles.footer}>
          Last updated: April 2025
        </Text>

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
  list: {
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: "400",
  },
  footer: {
    textAlign: "center",
    color: "#8e8e93",
    fontSize: 13,
    paddingVertical: 40,
    paddingBottom: Platform.OS === "ios" ? 60 : 40,
  },
});