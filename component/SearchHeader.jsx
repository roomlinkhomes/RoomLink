// components/SearchHeader.jsx — FIXED & polished (stable animation, safe notch handling)
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  TextInput as RNTextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Keyboard,
  Platform,
  StatusBar,
} from "react-native";
import { useNavigation, useRoute, useTheme } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const STATUS_BAR_HEIGHT = Platform.OS === "android" ? StatusBar.currentHeight || 24 : 0;

export default function SearchHeader() {
  const navigation = useNavigation();
  const route = useRoute();
  const { dark } = useTheme();

  const initialQuery = route.params?.query || "";
  const [query, setQuery] = useState(initialQuery);
  const [searchOpen, setSearchOpen] = useState(false);

  const searchAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef(null);

  useEffect(() => {
    if (initialQuery) {
      setSearchOpen(true);
      searchAnim.setValue(1);
      setQuery(initialQuery);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [initialQuery]);

  const handleChange = (text) => {
    setQuery(text);
    navigation.setParams({ query: text || undefined });
  };

  const toggleSearch = () => {
    if (searchOpen) {
      Keyboard.dismiss();
      Animated.timing(searchAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false, // Required for width & opacity animation
      }).start(() => {
        setSearchOpen(false);
        setQuery("");
        navigation.setParams({ query: undefined });
      });
    } else {
      setSearchOpen(true);
      Animated.timing(searchAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: false,
      }).start(() => {
        inputRef.current?.focus();
      });
    }
  };

  const searchWidth = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width - 160], // Safe width to avoid notch + icons
  });

  const containerOpacity = searchAnim.interpolate({
    inputRange: [0, 0.3],
    outputRange: [0, 1],
  });

  return (
    <View
      style={[
        styles.container,
        { paddingTop: STATUS_BAR_HEIGHT }, // Pushes below status bar/notch
      ]}
    >
      {/* Expanding search input */}
      <Animated.View
        style={[
          styles.searchContainer,
          {
            width: searchWidth,
            opacity: containerOpacity,
            backgroundColor: dark ? "#222" : "#f8f8f8",
            borderWidth: 1.5,
            borderColor: dark ? "#444" : "#000",
          },
        ]}
      >
        <RNTextInput
          ref={inputRef}
          placeholder="Search homes, listings..."
          placeholderTextColor={dark ? "#aaa" : "#777"}
          style={[styles.searchInput, { color: dark ? "#fff" : "#000" }]}
          value={query}
          onChangeText={handleChange}
          autoFocus={false}
          returnKeyType="search"
          onSubmitEditing={() => Keyboard.dismiss()}
        />
      </Animated.View>

      {/* Search / Close icon */}
      <TouchableOpacity onPress={toggleSearch} activeOpacity={0.6} style={styles.iconArea}>
        <Ionicons
          name={searchOpen ? "close" : "search"}
          size={26}
          color={dark ? "#fff" : "#000"}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: "transparent",
  },
  searchContainer: {
    position: "absolute",
    right: 70, // Clears back arrow + icon space
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  searchInput: {
    fontSize: 16,
    height: "100%",
    width: "100%",
    paddingLeft: 8,
  },
  iconArea: {
    padding: 8,
  },
});