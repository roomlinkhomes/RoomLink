// component/VendorSearchHeader.jsx
import React, { useState } from "react";
import { View, TextInput as RNTextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useColorScheme } from "react-native";
import { TextInput } from "react-native-paper";

export default function VendorSearchHeader() {
  const navigation = useNavigation();
  const route = useRoute();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const [query, setQuery] = useState(route.params?.query || "");

  const handleChange = (text) => {
    setQuery(text);
    navigation.setParams({ query: text });
  };

  return (
    <View style={styles.headerRow}>
      {/* Back button */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
        <Ionicons name="arrow-back" size={22} color={isDarkMode ? "#fff" : "#111"} />
      </TouchableOpacity>

      {/* Search box */}
      <View style={[styles.searchBox, { backgroundColor: isDarkMode ? "#333" : "#f0f0f0" }]}>
        {/* ✅ Same blue magnify icon as signup */}
        <View style={styles.magnifyWrapper}>
          <TextInput.Icon icon="magnify" color="#036dd6" size={22} />
        </View>

        <RNTextInput
          placeholder="Search vendors..."
          placeholderTextColor={isDarkMode ? "#aaa" : "gray"}
          style={[styles.searchInput, { color: isDarkMode ? "#fff" : "#111" }]}
          value={query}
          onChangeText={handleChange}
          autoFocus
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    gap: 10,
  },
  iconBtn: { padding: 6 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingHorizontal: 10,
    borderRadius: 50,
    height: 42,
  },
  magnifyWrapper: {
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    marginLeft: 15,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 16,
  },
});
