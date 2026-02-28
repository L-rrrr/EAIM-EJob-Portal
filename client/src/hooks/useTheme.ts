import {
  createContext,
  createElement,
  useEffect,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ThemeMode = "light" | "dark" | "system";

type ThemeContextValue = {
  mode: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const getSystemPrefersDark = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches;

const isThemeMode = (value: string | null): value is ThemeMode =>
  value === "light" || value === "dark" || value === "system";

const resolveInitialMode = (): ThemeMode => {
  const savedMode = localStorage.getItem("themeMode");

  if (isThemeMode(savedMode)) {
    return savedMode;
  }

  const savedTheme = localStorage.getItem("darkMode");

  if (savedTheme !== null) {
    return JSON.parse(savedTheme) ? "dark" : "light";
  }

  return "system";
};

const resolveIsDark = (mode: ThemeMode) => {
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return getSystemPrefersDark();
};

const applyThemeToDocument = (isDark: boolean) => {
  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.dataset.theme = isDark ? "dark" : "light";
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setModeState] = useState<ThemeMode>(() => resolveInitialMode());
  const [isDark, setIsDark] = useState<boolean>(() => resolveIsDark(resolveInitialMode()));

  useEffect(() => {
    localStorage.setItem("themeMode", mode);

    if (mode === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      setIsDark(mediaQuery.matches);

      const handleChange = (event: MediaQueryListEvent) => {
        setIsDark(event.matches);
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => {
        mediaQuery.removeEventListener("change", handleChange);
      };
    }

    setIsDark(mode === "dark");
  }, [mode]);

  useEffect(() => {
    applyThemeToDocument(isDark);
    localStorage.setItem("darkMode", JSON.stringify(isDark));
  }, [isDark]);

  const setTheme = (nextTheme: boolean) => {
    setModeState(nextTheme ? "dark" : "light");
  };

  const setMode = (nextMode: ThemeMode) => {
    setModeState(nextMode);
  };

  const toggleTheme = () => {
    if (mode === "system") {
      setModeState(isDark ? "light" : "dark");
      return;
    }
    setModeState((prevMode) => (prevMode === "dark" ? "light" : "dark"));
  };

  const value = useMemo(
    () => ({
      mode,
      isDark,
      toggleTheme,
      setTheme,
      setMode,
    }),
    [mode, isDark]
  );

  return createElement(ThemeContext.Provider, { value }, children);
};

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
};
