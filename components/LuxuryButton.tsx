import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { RADIUS } from "@/constants/layout";

type Variant = "primary" | "secondary" | "ghost" | "outline";

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
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

export function LuxuryButton({
  label,
  onPress,
  variant = "outline",
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
}: Props) {
  const v = VARIANT_STYLES[variant];

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
        <Text style={[styles.label, { color: v.textColor }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.pill,
    minHeight: 50,
    minWidth: 120,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
});
