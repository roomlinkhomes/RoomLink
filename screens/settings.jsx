// Settings.jsx — FIXED: Proper async logout + navigation reset
import React, { useContext } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  Alert,
  Platform,
  TouchableOpacity,
} from "react-native";
import { List, Divider } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";
import { useNavigation } from "@react-navigation/native";

export default function Settings() {
  const navigation = useNavigation();
  const { logout } = useContext(AuthContext);
  const { darkMode } = useContext(ThemeContext);

  const isDark = darkMode;
  const textColor = isDark ? "#fff" : "#000";
  const secondaryText = isDark ? "#aaa" : "#666";
  const iconColor = isDark ? "#999" : "#666";
  const background = isDark ? "#000" : "#fff";
  const dividerColor = isDark ? "#333" : "#eee";

  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          try {
            await logout(); // ← Now properly awaited
            // Reset navigation stack to Login screen
            navigation.reset({
              index: 0,
              routes: [{ name: "Login" }],
            });
          } catch (error) {
            console.error("Logout error:", error);
            Alert.alert("Logout Failed", "Something went wrong. Please try again.");
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ========== HEADER — MOVED UP (less top padding) ========== */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-start",
            paddingHorizontal: 20,
            paddingTop: 35,        // ← Reduced from 50 → feels higher up
            paddingBottom: 28,
          }}
        >
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ padding: 10 }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={28} color={isDark ? "#fff" : "#000"} />
          </TouchableOpacity>

          {/* Title */}
          <View style={{ flex: 1, alignItems: "center", marginRight: 48 }}>
            <Text style={[styles.pageTitle, { color: textColor }]}>Account Settings</Text>
          </View>
        </View>
        {/* ========== END HEADER ========== */}

        <View style={styles.list}>
          <List.Item
            title="Personal information"
            titleStyle={[styles.title, { color: textColor }]}
            left={() => <Icon name="account-outline" size={24} color={iconColor} />}
            right={() => <Icon name="chevron-right" size={28} color="#c7c7cc" />}
            onPress={() => navigation.navigate("EditProfile")}
          />

          <List.Item
            title="Login & security"
            titleStyle={[styles.title, { color: textColor }]}
            left={() => <Icon name="shield-check-outline" size={24} color={iconColor} />}
            right={() => <Icon name="chevron-right" size={28} color="#c7c7cc" />}
            onPress={() => navigation.navigate("ChangePassword")}
          />

          <List.Item
            title="Privacy"
            titleStyle={[styles.title, { color: textColor }]}
            left={() => <Icon name="eye-off-outline" size={24} color={iconColor} />}
            right={() => <Icon name="chevron-right" size={28} color="#c7c7cc" />}
            onPress={() => navigation.navigate("Privacy")}
          />

          <List.Item
            title="Notifications"
            titleStyle={[styles.title, { color: textColor }]}
            left={() => <Icon name="bell-outline" size={24} color={iconColor} />}
            right={() => <Icon name="chevron-right" size={28} color="#c7c7cc" />}
            onPress={() => navigation.navigate("Notification")}
          />

          <List.Item
            title="Payments"
            titleStyle={[styles.title, { color: textColor }]}
            left={() => <Icon name="credit-card-outline" size={24} color={iconColor} />}
            right={() => <Icon name="chevron-right" size={28} color="#c7c7cc" />}
            onPress={() => navigation.navigate("Payments")}
          />

          <List.Item
            title="Accessibility"
            titleStyle={[styles.title, { color: textColor }]}
            left={() => <Icon name="account-voice" size={24} color={iconColor} />}
            right={() => <Icon name="chevron-right" size={28} color="#c7c7cc" />}
            onPress={() => navigation.navigate("Accessibility")}
          />

          <Divider style={{ backgroundColor: dividerColor, marginVertical: 24 }} />

          <List.Item
            title="Switch accounts"
            titleStyle={[styles.title, { color: textColor }]}
            left={() => <Icon name="swap-horizontal" size={24} color={iconColor} />}
            right={() => <Icon name="chevron-right" size={28} color="#c7c7cc" />}
            onPress={() => navigation.navigate("SwitchAccount")}
          />

          <List.Item
            title="About this app"
            titleStyle={[styles.title, { color: textColor }]}
            left={() => <Icon name="information-outline" size={24} color={iconColor} />}
            right={() => <Icon name="chevron-right" size={28} color="#c7c7cc" />}
            onPress={() => navigation.navigate("AboutApp")}
          />

          <Divider style={{ backgroundColor: dividerColor, marginVertical: 24 }} />

          <List.Item
            title="Log out"
            titleStyle={{ color: "#ff3b30", fontSize: 17, fontWeight: "500" }}
            left={() => <Icon name="logout" size={24} color="#ff3b30" />}
            onPress={handleLogout}
          />
        </View>

        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pageTitle: {
    fontSize: 24,
    fontWeight: "800",
  },
  list: {
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: "400",
  },
  version: {
    textAlign: "center",
    color: "#8e8e93",
    fontSize: 13,
    paddingVertical: 30,
    paddingBottom: Platform.OS === "ios" ? 50 : 30,
  },
});