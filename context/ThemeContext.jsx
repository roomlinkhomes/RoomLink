import React, { createContext, useState } from "react";

// Create the context
export const ThemeContext = createContext();

// Create the provider component
export const ThemeProvider = ({ children }) => {
// State to track dark mode
const [darkMode, setDarkMode] = useState(false);

// Function to toggle dark mode
const toggleDarkMode = () => {
setDarkMode((prevMode) => !prevMode);
};

// Provide the state and toggle function to children
return (
<ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
{children}
</ThemeContext.Provider>
);
};




	
