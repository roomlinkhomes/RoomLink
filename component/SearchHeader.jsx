// components/SearchHeader.jsx — Modern Redesigned Version
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
const STATUS_BAR_HEIGHT = Platform.OS === "android" ? StatusBar.currentHeight || 24 : 44;

export default function SearchHeader() {
  const navigation = useNavigation();
  const route = useRoute();
  const { dark } = useTheme();

  const initialQuery = route.params?.query || "";
  
  const [query, setQuery] = useState(initialQuery);
  const [isExpanded, setIsExpanded] = useState(!!initialQuery);

  const searchAnim = useRef(new Animated.Value(!!initialQuery ? 1 : 0)).current;
  const inputRef = useRef(null);

  // Handle initial query from navigation params
  useEffect(() => {
    if (initialQuery) {
      setIsExpanded(true);
      searchAnim.setValue(1);
      setQuery(initialQuery);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [initialQuery]);

  const handleChange = (text) => {
    setQuery(text);
    navigation.setParams({ query: text.trim() || undefined });
  };

  const toggleSearch = () => {
    if (isExpanded) {
      // Collapse
      Keyboard.dismiss();
      Animated.timing(searchAnim, {
        toValue: 0,
        duration: 280,
        useNativeDriver: false,
      }).start(() => {
        setIsExpanded(false);
        setQuery("");
        navigation.setParams({ query: undefined });
      });
    } else {
      // Expand
      setIsExpanded(true);
      Animated.timing(searchAnim, {
        toValue: 1,
        duration: 280,
        useNativeDriver: false,
      }).start(() => {
        inputRef.current?.focus();
      });
    }
  };

  // Animations
  const searchWidth = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width - 110], // Good balance for icon + padding
  });

  const searchOpacity = searchAnim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0.3, 1],
  });

  return (
    <View style={[styles.container, { paddingTop: STATUS_BAR_HEIGHT }]}>
      {/* Expanding Search Bar */}
      <Animated.View
        style={[
          styles.searchContainer,
          {
            width: searchWidth,
            opacity: searchOpacity,
            backgroundColor: dark ? "#1f1f1f" : "#f5f5f5",
            borderColor: dark ? "#444" : "#ddd",
          },
        ]}
      >
        <RNTextInput
          ref={inputRef}
          placeholder="Search homes, listings, vendors..."
          placeholderTextColor={dark ? "#888" : "#666"}
          style={[styles.searchInput, { color: dark ? "#fff" : "#111" }]}
          value={query}
          onChangeText={handleChange}
          returnKeyType="search"
          onSubmitEditing={() => Keyboard.dismiss()}
          clearButtonMode="while-editing"
        />
      </Animated.View>

      {/* Search / Close Button */}
      <TouchableOpacity
        onPress={toggleSearch}
        activeOpacity={0.7}
        style={styles.iconButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons
          name={isExpanded ? "close" : "search"}
          size={24}
          color={dark ? "#ffffff" : "#1a1a1a"}
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
    paddingBottom: 12,
    backgroundColor: "transparent",
    height: 70, // Enough space for status bar + content
  },
  searchContainer: {
    position: "absolute",
    right: 68,
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 18,
    justifyContent: "center",
    borderWidth: 1.2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  searchInput: {
    fontSize: 16.5,
    flex: 1,
    paddingVertical: 0,
    includeFontPadding: false,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "transparent",
  },
});