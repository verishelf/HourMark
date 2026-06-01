import { useMemo } from "react";
import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from "react-native";
import { useTheme } from "@/hooks/useTheme";

type NamedStyles<T> = {
  [P in keyof T]: ViewStyle | TextStyle | ImageStyle;
};

export function useThemedStyles<T extends NamedStyles<T>>(factory: () => T): T {
  const { colorScheme } = useTheme();
  return useMemo(factory, [colorScheme]);
}
