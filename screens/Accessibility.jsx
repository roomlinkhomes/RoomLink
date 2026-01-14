// Accessibility.jsx — Clean & Inclusive
import React, { useContext } from "react";
import { View, ScrollView, StyleSheet, Text, Platform } from "react-native";
import { List, Divider, Switch } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { ThemeContext } from "../context/ThemeContext";

export default function Accessibility() {
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const isDark = darkMode;

  const textColor = isDark ? "#fff" : "#000";
  const secondaryText = isDark ? "#aaa" : "#666";
  const iconColor = isDark ? "#999" : "#666";
  const background = isDark ? "#000" : "#fff";
  const dividerColor = isDark ? "#333" : "#eee";

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.header, { color: textColor }]}>Accessibility</Text>

        <View style={styles.list}>
          <List.Item
            title="Dark mode"
            description="Reduces eye strain in low light"
            titleStyle={[styles.title, { color: textColor }]}
            descriptionStyle={{ color: secondaryText }}
            left={() => <Icon name="theme-light-dark" size={24} color={iconColor} />}
            right={() => <Switch value={darkMode} onValueChange={toggleDarkMode} color="#017a6b" />}
          />

          <List.Item
            title="Text size"
            description="Adjust font size across the app"
            titleStyle={[styles.title, { color: textColor }]}
            descriptionStyle={{ color: secondaryText }}
            left={() => <Icon name="format-size" size={24} color={iconColor} />}
            right={() => <Icon name="chevron-right" size={28} color="#c7c7cc" />}
            onPress={() => {}}
          />

          <List.Item
            title="Bold text"
            description="Makes text easier to read"
            titleStyle={[styles.title, { color: textColor }]}
            left={() => <Icon name="format-bold" size={24} color={iconColor} />}
            right={() => <Switch value={false} onValueChange={() => {}} color="#017a6b" />}
          />

          <List.Item
            title="High contrast mode"
            description="Improves visibility for low vision"
            titleStyle={[styles.title, { color: textColor }]}
            left={() => <Icon name="contrast-circle" size={24} color={iconColor} />}
            right={() => <Switch value={false} onValueChange={() => {}} color="#017a6b" />}
          />

          <List.Item
            title="VoiceOver / TalkBack"
            description="Screen reader support"
            titleStyle={[styles.title, { color: textColor }]}
            left={() => <Icon name="account-voice" size={24} color={iconColor} />}
            right={() => <Icon name="chevron-right" size={28} color="#c7c7cc" />}
            onPress={() => {}}
          />
        </View>

        <Text style={styles.footer}>
          We’re committed to making RoomLink accessible to everyone
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
  list: { paddingHorizontal: 8 },
  title: { fontSize: 17, fontWeight: "400" },
  footer: {
    textAlign: "center",
    color: "#8e8e93",
    fontSize: 13,
    paddingVertical: 40,
    paddingBottom: Platform.OS === "ios" ? 60 : 40,
  },
});