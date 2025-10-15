import React, { useContext } from "react";
import { ScrollView, StyleSheet, Alert } from "react-native";
import { List, Divider, Switch } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { AuthContext } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";

export default function Settings({ navigation }) {
  const { logout } = useContext(AuthContext);
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const [notifications, setNotifications] = React.useState(true);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: () => logout() },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert("Delete Account", "This action cannot be undone. Proceed?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => Alert.alert("Account deleted!") },
    ]);
  };

  const colors = {
    background: darkMode ? "#121212" : "#fff",
    text: darkMode ? "#fff" : "#333",
    subtitle: darkMode ? "#ccc" : "#036dd6",
    divider: darkMode ? "#333" : "#eee",
    icon: darkMode ? "#fff" : "#036dd6",
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Account Settings */}
      <List.Section title="Account" titleStyle={{ color: colors.text }}>
        <List.Item
          title="Change Password"
          titleStyle={{ color: colors.text }}
          left={(props) => <Icon {...props} name="lock-reset" size={24} color={colors.icon} />}
          onPress={() => navigation.navigate("ChangePassword")}  // ✅ Navigate to ChangePassword screen
        />
        <List.Item
          title="Update Email / Phone"
          titleStyle={{ color: colors.text }}
          left={(props) => <Icon {...props} name="account-edit" size={24} color={colors.icon} />}
          onPress={() => navigation.navigate("EditProfile")}
        />
        <List.Item
          title="Logout"
          titleStyle={{ color: colors.text }}
          left={(props) => <Icon {...props} name="logout" size={24} color={colors.icon} />}
          onPress={handleLogout}
        />
        <List.Item
          title="Delete Account"
          titleStyle={{ color: "red" }}
          left={(props) => <Icon {...props} name="account-remove" size={24} color="red" />}
          onPress={handleDeleteAccount}
        />
      </List.Section>

      <Divider style={{ backgroundColor: colors.divider }} />

      {/* App Preferences */}
      <List.Section title="Preferences" titleStyle={{ color: colors.text }}>
        <List.Item
          title="Dark Mode"
          titleStyle={{ color: colors.text }}
          left={(props) => <Icon {...props} name="theme-light-dark" size={24} color={colors.icon} />}
          right={() => <Switch value={darkMode} onValueChange={toggleDarkMode} />}
        />
        <List.Item
          title="Notifications"
          titleStyle={{ color: colors.text }}
          left={(props) => <Icon {...props} name="bell-outline" size={24} color={colors.icon} />}
          right={() => <Switch value={notifications} onValueChange={setNotifications} />}
        />
        <List.Item
          title="Language"
          titleStyle={{ color: colors.text }}
          left={(props) => <Icon {...props} name="translate" size={24} color={colors.icon} />}
          onPress={() => Alert.alert("Language selection clicked")}
        />
      </List.Section>

      <Divider style={{ backgroundColor: colors.divider }} />

      {/* Support & Info */}
      <List.Section title="Support & Info" titleStyle={{ color: colors.text }}>
        <List.Item
          title="Help / FAQ"
          titleStyle={{ color: colors.text }}
          left={(props) => <Icon {...props} name="help-circle-outline" size={24} color={colors.icon} />}
          onPress={() => Alert.alert("Help / FAQ clicked")}
        />
        <List.Item
          title="Contact Us"
          titleStyle={{ color: colors.text }}
          left={(props) => <Icon {...props} name="phone-outline" size={24} color={colors.icon} />}
          onPress={() => Alert.alert("Contact Us clicked")}
        />
        <List.Item
          title="Terms & Conditions"
          titleStyle={{ color: colors.text }}
          left={(props) => <Icon {...props} name="file-document-outline" size={24} color={colors.icon} />}
          onPress={() => Alert.alert("Terms & Conditions clicked")}
        />
        <List.Item
          title="Privacy Policy"
          titleStyle={{ color: colors.text }}
          left={(props) => <Icon {...props} name="shield-outline" size={24} color={colors.icon} />}
          onPress={() => Alert.alert("Privacy Policy clicked")}
        />
      </List.Section>

      <Divider style={{ backgroundColor: colors.divider }} />

      {/* Security */}
      <List.Section title="Security" titleStyle={{ color: colors.text }}>
        <List.Item
          title="Two-Factor Authentication"
          titleStyle={{ color: colors.text }}
          left={(props) => <Icon {...props} name="security" size={24} color={colors.icon} />}
          onPress={() => Alert.alert("2FA clicked")}
        />
        <List.Item
          title="Device Activity / Sessions"
          titleStyle={{ color: colors.text }}
          left={(props) => <Icon {...props} name="devices" size={24} color={colors.icon} />}
          onPress={() => Alert.alert("Device Activity clicked")}
        />
      </List.Section>

      <Divider style={{ backgroundColor: colors.divider }} />

      {/* Payment & Favorites */}
      <List.Section title="Other Features" titleStyle={{ color: colors.text }}>
        <List.Item
          title="Manage Payment Methods"
          titleStyle={{ color: colors.text }}
          left={(props) => <Icon {...props} name="credit-card-outline" size={24} color={colors.icon} />}
          onPress={() => Alert.alert("Manage Payment Methods clicked")}
        />
        <List.Item
          title="Saved Addresses / Favorites"
          titleStyle={{ color: colors.text }}
          left={(props) => <Icon {...props} name="bookmark-outline" size={24} color={colors.icon} />}
          onPress={() => Alert.alert("Saved Addresses clicked")}
        />
        <List.Item
          title="Blocked Users / Reports"
          titleStyle={{ color: colors.text }}
          left={(props) => <Icon {...props} name="account-cancel-outline" size={24} color={colors.icon} />}
          onPress={() => Alert.alert("Blocked Users clicked")}
        />
      </List.Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
