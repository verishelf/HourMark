import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useColorScheme, View } from "react-native";
import {
  applyColorPalette,
  Colors,
  DarkColors,
  LightColors,
  type ColorScheme,
} from "@/constants/colors";

const STORAGE_KEY = "crownly_color_scheme";

export type ThemePreference = "system" | "dark" | "light";

type ThemeContextValue = {
  colorScheme: ColorScheme;
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
  isReady: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isThemePreference(value: string | null): value is ThemePreference {
  return value === "system" || value === "dark" || value === "light";
}

function resolveColorScheme(
  preference: ThemePreference,
  systemScheme: ColorScheme | null | undefined
): ColorScheme {
  if (preference === "system") {
    return systemScheme === "light" ? "light" : "dark";
  }
  return preference;
}

function syncPalette(scheme: ColorScheme) {
  applyColorPalette(scheme === "light" ? LightColors : DarkColors);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>("system");
  const [isReady, setIsReady] = useState(false);

  const colorScheme = useMemo(() => {
    const scheme = resolveColorScheme(themePreference, systemScheme);
    syncPalette(scheme);
    return scheme;
  }, [themePreference, systemScheme]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (isThemePreference(stored)) {
          setThemePreferenceState(stored);
        } else if (stored === "light" || stored === "dark") {
          setThemePreferenceState(stored);
        }
      })
      .catch(() => {
        // Keep default system preference.
      })
      .finally(() => setIsReady(true));
  }, []);

  const setThemePreference = useCallback((preference: ThemePreference) => {
    setThemePreferenceState(preference);
    void AsyncStorage.setItem(STORAGE_KEY, preference);
  }, []);

  const value = useMemo(
    () => ({ colorScheme, themePreference, setThemePreference, isReady }),
    [colorScheme, themePreference, setThemePreference, isReady]
  );

  if (!isReady) {
    return <View style={{ flex: 1, backgroundColor: Colors.background }} />;
  }

  return (
    <ThemeContext.Provider value={value}>
      <ThemeBoundary scheme={colorScheme} preference={themePreference}>
        {children}
      </ThemeBoundary>
    </ThemeContext.Provider>
  );
}

/** Remounts children when theme changes so static Colors reads pick up the new palette. */
function ThemeBoundary({
  scheme,
  preference,
  children,
}: {
  scheme: ColorScheme;
  preference: ThemePreference;
  children: ReactNode;
}) {
  return (
    <View key={`${preference}-${scheme}`} style={{ flex: 1 }}>
      {children}
    </View>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
