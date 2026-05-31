import { Platform, type ScrollViewProps } from "react-native";

export const HIDE_SCROLL_INDICATORS = {
  showsVerticalScrollIndicator: false,
  showsHorizontalScrollIndicator: false,
} as const;

/** Snap + deceleration for horizontal card rows (ScrollView or FlatList). */
export function smoothHorizontalScrollProps(
  snapInterval: number
): Pick<
  ScrollViewProps,
  | "decelerationRate"
  | "snapToInterval"
  | "snapToAlignment"
  | "disableIntervalMomentum"
  | "overScrollMode"
  | "scrollEventThrottle"
  | "showsHorizontalScrollIndicator"
  | "showsVerticalScrollIndicator"
> {
  return {
    ...HIDE_SCROLL_INDICATORS,
    decelerationRate: Platform.OS === "ios" ? "fast" : "normal",
    snapToInterval: snapInterval,
    snapToAlignment: "start",
    disableIntervalMomentum: true,
    overScrollMode: "never",
    scrollEventThrottle: 16,
  };
}
