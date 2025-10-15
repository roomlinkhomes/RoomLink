import React from "react";
import { TouchableOpacity, Image, StyleSheet, useColorScheme } from "react-native";
import { useNavigation } from "@react-navigation/native";
import BackIcon from "../assets/icons/back.png"; // ✅ same path as used in App.js

const BackButton = ({ onPress, color, size = 26, style }) => {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const handlePress = () => {
    if (onPress) onPress();
    else if (navigation.canGoBack()) navigation.goBack();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[styles.button, style, { backgroundColor: isDark ? "#222" : "#f2f2f2" }]}
      activeOpacity={0.7}
    >
      <Image
        source={BackIcon}
        style={[
          styles.icon,
          {
            tintColor: color || (isDark ? "#fff" : "#000"),
            width: size,
            height: size,
          },
        ]}
        resizeMode="contain"
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    elevation: 2,
  },
  icon: {
    tintColor: "#000",
  },
});

export default BackButton;
