import React, { createContext, useContext, useState, useEffect } from "react";
import { Appearance } from "react-native";

// Define your actual colors
const lightTheme = {
  background: "#ffffff",
  surface: "#f5f5f5",
  card: "#ffffff",
  text: "#000000",
  textSecondary: "#666666",
  border: "#dddddd",
  primary: "#036dd6",
  success: "#4CAF50",
  error: "#F44336",
  placeholder: "#999999",
};

const darkTheme = {
  background: "#121212",
  surface: "#1e1e1e",
  card: "#1e1e1e",
  text: "#ffffff",
  textSecondary: "#bbbbbb",
  border: "#272727",
  primary: "#036dd6",
  success: "#66BB6A",
  error: "#EF5350",
  placeholder: "#777777",
};

// Create the context
export const ThemeContext = createContext();

// Custom hook for easy access
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme() must be used inside <ThemeProvider>");
  }
  return context;
};

// Provider component
export const ThemeProvider = ({ children }) => {
  // Fix 1: Initialize using a lazy initializer function to ensure it runs once correctly
  const [darkMode, setDarkMode] = useState(() => {
    const initial = Appearance.getColorScheme();
    return initial === "dark";
  });

  // Listen to system theme changes
  useEffect(() => {
    // Fix 2: Immediate check on mount to catch any transitions missed during JS boot
    const currentMode = Appearance.getColorScheme();
    if (currentMode) {
      setDarkMode(currentMode === "dark");
    }

    // Fix 3: Robust listener to handle the 'null' state report from Android
    const listener = Appearance.addChangeListener(({ colorScheme }) => {
      if (colorScheme) { // Guard against null/undefined
        setDarkMode(colorScheme === "dark");
      }
    });

    return () => listener.remove();
  }, []);

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  // Current theme object
  const theme = darkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider 
      value={{ 
        darkMode, 
        isDarkMode: darkMode, // Added this so App.js finds the key it expects
        theme, 
        toggleDarkMode 
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};