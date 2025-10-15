// Context/AppLayout.jsx
import React from "react";
import { SafeAreaView, Platform, StatusBar, StyleSheet, View } from "react-native";

const AppLayout = ({ children, style }) => {
  // Calculate paddingTop to avoid content under status bar
  const paddingTop = Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0;

  return (
    <SafeAreaView style={[styles.container, { paddingTop }, style]}>
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent", // Transparent so status bar shows through
  },
});

export default AppLayout;
