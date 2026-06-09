import { Platform, type ScrollViewProps } from "react-native";

export const HIDE_SCROLL_INDICATORS = {
  showsVerticalScrollIndicator: false,
  showsHorizontalScrollIndicator: false,
} as const;

type SmoothHorizontalScrollOptions = {
  /** Item count — when set with leadingInset, uses snapToOffsets for padded rows */
  itemCount?: number;
  leadingInset?: number;
};

/** Snap + deceleration for horizontal card rows (ScrollView or FlatList). */
export function smoothHorizontalScrollProps(
  snapInterval: number,
  options?: SmoothHorizontalScrollOptions
): Pick<
  ScrollViewProps,
  | "decelerationRate"
  | "snapToInterval"
  | "snapToOffsets"
  | "snapToAlignment"
  | "disableIntervalMomentum"
  | "overScrollMode"
  | "scrollEventThrottle"
  | "showsHorizontalScrollIndicator"
  | "showsVerticalScrollIndicator"
> {
  const base = {
    ...HIDE_SCROLL_INDICATORS,
    decelerationRate: Platform.OS === "ios" ? "fast" : "normal",
    snapToAlignment: "start" as const,
    disableIntervalMomentum: true,
    overScrollMode: "never" as const,
    scrollEventThrottle: 16,
  };

  if (options?.itemCount != null) {
    const leadingInset = options.leadingInset ?? 0;
    return {
      ...base,
      snapToOffsets: Array.from({ length: options.itemCount }, (_, i) =>
        i === 0 ? 0 : leadingInset + i * snapInterval
      ),
    };
  }

  return {
    ...base,
    snapToInterval: snapInterval,
  };
}
