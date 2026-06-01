import { useMemo } from "react";
import { Colors, ImageOverlayButtonColors } from "@/constants/colors";
import { useTheme } from "@/hooks/useTheme";

/** Circular icon buttons on listing card photos — light surface in light theme, dark chip in dark theme. */
export function useCardOverlayButtonStyle(size = 32) {
  const { colorScheme } = useTheme();

  return useMemo(() => {
    const isLight = colorScheme === "light";

    return {
      button: {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: isLight ? Colors.cardElevated : ImageOverlayButtonColors.background,
        borderWidth: isLight ? 1 : 0,
        borderColor: isLight ? Colors.border : "transparent",
        alignItems: "center" as const,
        justifyContent: "center" as const,
      },
      icon: isLight ? Colors.textPrimary : ImageOverlayButtonColors.icon,
      iconMuted: isLight ? Colors.textSecondary : ImageOverlayButtonColors.iconMuted,
    };
  }, [colorScheme, size]);
}
