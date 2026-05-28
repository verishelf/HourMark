import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { RADIUS } from "@/constants/layout";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "default" | "large";

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
};

const VARIANT_STYLES: Record<
  Variant,
  { backgroundColor: string; borderColor: string; textColor: string; borderWidth: number }
> = {
  primary: {
    backgroundColor: Colors.cardElevated,
    borderColor: Colors.textPrimary,
    textColor: Colors.textPrimary,
    borderWidth: 1,
  },
  secondary: {
    backgroundColor: Colors.cardElevated,
    borderColor: Colors.borderLight,
    textColor: Colors.textPrimary,
    borderWidth: 1,
  },
  outline: {
    backgroundColor: "transparent",
    borderColor: Colors.textPrimary,
    textColor: Colors.textPrimary,
    borderWidth: 1,
  },
  ghost: {
    backgroundColor: "transparent",
    borderColor: "transparent",
    textColor: Colors.textSecondary,
    borderWidth: 0,
  },
};

const SIZE_STYLES: Record<Size, { button: ViewStyle; label: TextStyle }> = {
  default: {
    button: {
      paddingVertical: 14,
      paddingHorizontal: 28,
      minHeight: 50,
      minWidth: 120,
    },
    label: {
      fontSize: 15,
      fontWeight: "600",
      textAlign: "center",
    },
  },
  large: {
    button: {
      paddingVertical: 18,
      paddingHorizontal: 32,
      minHeight: 58,
      minWidth: 140,
    },
    label: {
      fontSize: 17,
      fontWeight: "600",
      textAlign: "center",
    },
  },
};

export function LuxuryButton({
  label,
  onPress,
  variant = "outline",
  size = "default",
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
}: Props) {
  const v = VARIANT_STYLES[variant];
  const sizing = SIZE_STYLES[size];

  const handlePress = () => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        sizing.button,
        {
          width: fullWidth ? "100%" : "auto",
          backgroundColor: v.backgroundColor,
          borderWidth: v.borderWidth,
          borderColor: v.borderColor,
          opacity: disabled ? 0.4 : pressed ? 0.8 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.textColor} />
      ) : (
        <Text style={[sizing.label, { color: v.textColor }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.pill,
  },
});
