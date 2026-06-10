"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { ThemeName, getSavedTheme, applyTheme } from "@/lib/theme";

type Ctx = { theme: ThemeName; setTheme: (t: ThemeName) => void };
const ThemeContext = createContext<Ctx>({ theme: "dark", setTheme: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>("dark");

  useEffect(() => {
    const saved = getSavedTheme();
    setThemeState(saved);
    applyTheme(saved);
  }, []);

  const setTheme = (t: ThemeName) => {
    setThemeState(t);
    applyTheme(t);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
