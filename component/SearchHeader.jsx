// component/SearchHeader.jsx
import React, { useState } from "react";
import { View, TextInput as RNTextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation, useRoute, useTheme } from "@react-navigation/native";
import { TextInput } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";

export default function SearchHeader() {
  const navigation = useNavigation();
  const route = useRoute();
  const { dark } = useTheme();
  const [query, setQuery] = useState(route.params?.query || "");

  const handleChange = (text) => {
    setQuery(text);
    navigation.setParams({ query: text });
  };

  return (
    <View style={styles.headerRow}>
      {/* Back button */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
        <Ionicons name="arrow-back" size={22} color={dark ? "#fff" : "#111"} />
      </TouchableOpacity>

      {/* Search box */}
      <View style={[styles.searchBox, { backgroundColor: dark ? "#333" : "#f0f0f0" }]}>
        {/* ✅ Same magnify, better aligned */}
        <View style={styles.magnifyWrapper}>
          <TextInput.Icon icon="magnify" color="#036dd6" size={22} />
        </View>

        <RNTextInput
          placeholder="Search homes, listings..."
          placeholderTextColor={dark ? "#aaa" : "gray"}
          style={[styles.searchInput, { color: dark ? "#fff" : "#111" }]}
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
