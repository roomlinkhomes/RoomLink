// Settings.jsx — FIXED: Proper async logout + navigation reset + Login & security modal
import React, { useContext, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  Alert,
  Platform,
  TouchableOpacity,
  Modal,
  StatusBar,
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
  const modalBg = isDark ? "#111" : "#fff";
  const dividerColor = isDark ? "#333" : "#eee";

  const [securityModalVisible, setSecurityModalVisible] = useState(false);

  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
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

  const openSecurityModal = () => setSecurityModalVisible(true);
  const closeSecurityModal = () => setSecurityModalVisible(false);

  const navigateAndClose = (screenName) => {
    closeSecurityModal();
    navigation.navigate(screenName);
  };

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-start",
            paddingHorizontal: 20,
            paddingTop: 35,
            paddingBottom: 28,
          }}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ padding: 10 }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={28} color={isDark ? "#fff" : "#000"} />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: "center", marginRight: 48 }}>
            <Text style={[styles.pageTitle, { color: textColor }]}>Account Settings</Text>
          </View>
        </View>

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
            onPress={openSecurityModal}  // ← Opens modal instead of direct nav
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

      {/* Login & Security Modal */}
      <Modal
        visible={securityModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={closeSecurityModal}
      >
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <View style={{ flex: 1, backgroundColor: modalBg }}>
          {/* Modal Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 20,
              paddingTop: Platform.OS === "ios" ? 50 : 20,
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: dividerColor,
            }}
          >
            <TouchableOpacity onPress={closeSecurityModal} style={{ padding: 8 }}>
              <Ionicons name="close" size={28} color={textColor} />
            </TouchableOpacity>
            <Text
              style={{
                flex: 1,
                textAlign: "center",
                fontSize: 20,
                fontWeight: "700",
                color: textColor,
                marginRight: 40, // balance for close icon
              }}
            >
              Login & Security
            </Text>
          </View>

          {/* Options */}
          <View style={{ paddingTop: 16 }}>
            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => navigateAndClose("ChangePassword")}
            >
              <Icon name="lock-outline" size={24} color={iconColor} style={{ marginRight: 16 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: textColor }]}>Change Password</Text>
                <Text style={{ color: secondaryText, fontSize: 14 }}>
                  Update your account password
                </Text>
              </View>
              <Icon name="chevron-right" size={24} color="#c7c7cc" />
            </TouchableOpacity>

            <Divider style={{ backgroundColor: dividerColor }} />

            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => navigateAndClose("ChangeEmail")}
            >
              <Icon name="email-outline" size={24} color={iconColor} style={{ marginRight: 16 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: textColor }]}>Change Email</Text>
                <Text style={{ color: secondaryText, fontSize: 14 }}>
                  Update your registered email address
                </Text>
              </View>
              <Icon name="chevron-right" size={24} color="#c7c7cc" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  // Modal-specific styles
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "500",
  },
});