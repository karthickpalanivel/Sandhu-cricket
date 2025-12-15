import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "react-native";

// --- THEME DEFINITIONS ---
export const lightTheme = {
  mode: "light",
  bg: "#f1f5f9", 
  card: "#ffffff", 
  cardSoft: "#e2e8f0",
  input: "#cbd5e1", 
  text: "#0f172a", 
  subText: "#64748b",
  accent: "#059669", 
  danger: "#dc2626",
  warning: "#d97706",
  border: "#e2e8f0",
  pjr: "#94a3b8", 
  statusBarStyle: "dark-content",
};

export const darkTheme = {
  mode: "dark",
  bg: "#0f172a",
  card: "#1e293b",
  cardSoft: "#24324a",
  input: "#334155",
  text: "#f8fafc",
  subText: "#94a3b8",
  accent: "#10b981",
  danger: "#ef4444",
  warning: "#f59e0b",
  border: "#334155",
  pjr: "#b8b8b8ff",
  statusBarStyle: "light-content",
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(true); // Default to Dark

  // Load saved theme on startup
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem("app_theme");
        if (savedTheme !== null) {
          setIsDark(savedTheme === "dark");
        }
      } catch (e) {
        console.log("Failed to load theme");
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newMode = !isDark;
    setIsDark(newMode);
    try {
      await AsyncStorage.setItem("app_theme", newMode ? "dark" : "light");
    } catch (e) {
      console.log("Failed to save theme");
    }
  };

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      <StatusBar
        barStyle={theme.statusBarStyle}
        backgroundColor={theme.bg}
        animated={true}
      />
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
