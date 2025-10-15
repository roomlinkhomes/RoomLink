// component/ProfileTopBar.jsx
import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  Modal,
  Text,
} from "react-native";
import { useNavigation, useTheme } from "@react-navigation/native";
import SearchIcon from "../assets/icons/search.svg";
import MenuIcon from "../assets/icons/more.svg";
import { Ionicons } from "@expo/vector-icons";

export default function ProfileTopBar() {
  const navigation = useNavigation();
  const { colors } = useTheme(); // get theme colors
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background, // obey theme background
          paddingTop:
            Platform.OS === "android"
              ? (StatusBar.currentHeight || 35) - 10
              : 70,
        },
      ]}
    >
      {/* Icons row */}
      <View style={styles.icons}>
        {/* Search Icon */}
        <TouchableOpacity onPress={() => navigation.navigate("Search")}>
          <SearchIcon width={26} height={26} fill={colors.text} />
        </TouchableOpacity>

        {/* 3-dot Menu */}
        <TouchableOpacity onPress={() => setMenuVisible(true)}>
          <MenuIcon width={26} height={26} fill={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Dropdown Menu */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPressOut={() => setMenuVisible(false)}
        >
          <View style={[styles.dropdown, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setMenuVisible(false);
                navigation.navigate("Settings");
              }}
            >
              <Ionicons name="settings-outline" size={20} color={colors.text} />
              <Text style={[styles.dropdownText, { color: colors.text }]}>
                Settings
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setMenuVisible(false);
                navigation.navigate("Payments");
              }}
            >
              <Ionicons name="card-outline" size={20} color={colors.text} />
              <Text style={[styles.dropdownText, { color: colors.text }]}>
                Payments
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setMenuVisible(false);
                // you can add Share API here
              }}
            >
              <Ionicons
                name="share-social-outline"
                size={20}
                color={colors.text}
              />
              <Text style={[styles.dropdownText, { color: colors.text }]}>
                Share
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end", // push icons to right since no title
    paddingHorizontal: 10,
    paddingBottom: 12,
  },
  icons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 25,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "flex-start",
    paddingTop: (StatusBar.currentHeight || 50) + 40, // drop below header
    paddingHorizontal: 15,
  },
  dropdown: {
    borderRadius: 10,
    padding: 10,
    elevation: 5,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 10,
  },
  dropdownText: {
    fontSize: 16,
  },
});
