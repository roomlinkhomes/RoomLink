// SwitchAccount.jsx — Clean, Premium, Ready to Use
import React, { useContext } from "react";
import { View, ScrollView, StyleSheet, Text, Alert, Platform, TouchableOpacity } from "react-native";
import { Avatar, List, Divider } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { AuthContext } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";

export default function SwitchAccount({ navigation }) {
  const { user, logout } = useContext(AuthContext);
  const { darkMode } = useContext(ThemeContext);

  const isDark = darkMode;
  const textColor = isDark ? "#fff" : "#000";
  const secondaryText = isDark ? "#aaa" : "#666";
  const background = isDark ? "#000" : "#fff";
  const surface = isDark ? "#111" : "#f9f9f9";
  const borderColor = isDark ? "#333" : "#eee";

  // Mock other accounts (replace with real data later)
  const otherAccounts = [
    { id: 2, name: "John Doe", email: "john@roomlink.com", avatar: null },
    { id: 3, name: "Sarah Vendor", email: "sarahvendor.com", avatar: null },
  ];

  const switchToAccount = (account) => {
    Alert.alert(
      "Switch Account",
      `Switch to ${account.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Switch",
          onPress: () => {
            // Here you’ll do real account switching later
            Alert.alert("Success", `Switched to ${account.name}`);
            navigation.navigate("Home"); // or wherever you want
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.header, { color: textColor }]}>Switch Account</Text>

        <View style={styles.list}>

          {/* Current Active Account */}
          <View style={[styles.currentCard, { backgroundColor: surface, borderColor }]}>
            <View style={styles.currentHeader}>
              <Text style={{ color: secondaryText, fontSize: 13 }}>CURRENTLY SIGNED IN</Text>
            </View>
            <List.Item
              title={user?.name || "User Name"}
              description={user?.email || "user@roomlink.app"}
              titleStyle={{ color: textColor, fontWeight: "600", fontSize: 17 }}
              descriptionStyle={{ color: secondaryText }}
              left={() => (
                <Avatar.Text
                  size={56}
                  label={(user?.name || "U").charAt(0).toUpperCase()}
                  style={{ backgroundColor: "#017a6b" }}
                />
              )}
              right={() => <Icon name="check-circle" size={28} color="#34c759" />}
            />
          </View>

          <Divider style={{ backgroundColor: borderColor, marginVertical: 16 }} />

          {/* Other Accounts */}
          <Text style={[styles.section, { color: secondaryText }]}>OTHER ACCOUNTS</Text>

          {otherAccounts.map((acc) => (
            <List.Item
              key={acc.id}
              title={acc.name}
              description={acc.email}
              titleStyle={{ color: textColor, fontSize: 17 }}
              descriptionStyle={{ color: secondaryText }}
              left={() => (
                <Avatar.Text
                  size={48}
                  label={acc.name.charAt(0).toUpperCase()}
                  style={{ backgroundColor: "#017a6b88" }}
                />
              )}
              right={() => <Icon name="chevron-right" size={28} color="#c7c7cc" />}
              onPress={() => switchToAccount(acc)}
            />
          ))}

          <Divider style={{ backgroundColor: borderColor, marginVertical: 20 }} />

          {/* Add Account */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate("Login")} // or Signup
          >
            <Icon name="plus-circle-outline" size={26} color="#017a6b" />
            <Text style={styles.addText}>Add another account</Text>
          </TouchableOpacity>

          {/* Remove All (optional danger button) */}
          <TouchableOpacity
            style={styles.removeAll}
            onPress={() => Alert.alert("Remove all accounts?", "This will log you out of all accounts.", [
              { text: "Cancel" },
              { text: "Remove All", style: "destructive", onPress: logout },
            ])}
          >
            <Text style={{ color: "#ff3b30", fontWeight: "600" }}>Remove all accounts</Text>
          </TouchableOpacity>

        </View>

        <Text style={styles.footer}>You can have up to 5 accounts</Text>
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
  list: { paddingHorizontal: 16 },
  currentCard: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    marginTop: 8,
  },
  currentHeader: {
    padding: 10,
    paddingHorizontal: 16,
    backgroundColor: "rgba(1,122,107,0.1)",
  },
  section: {
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 4,
    marginBottom: 8,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  addText: {
    color: "#017a6b",
    fontSize: 17,
    fontWeight: "600",
    marginLeft: 12,
  },
  removeAll: {
    alignItems: "center",
    paddingVertical: 20,
  },
  footer: {
    textAlign: "center",
    color: "#8e8e93",
    fontSize: 13,
    paddingVertical: 40,
    paddingBottom: Platform.OS === "ios" ? 60 : 40,
  },
});