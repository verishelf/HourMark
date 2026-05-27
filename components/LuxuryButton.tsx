import { ActivityIndicator, Pressable, Text, ViewStyle } from "react-native";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { Typography } from "@/constants/typography";

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

export function LuxuryButton({
  label,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
}: Props) {
  const handlePress = () => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const bg =
    variant === "primary"
      ? Colors.textPrimary
      : variant === "secondary"
        ? Colors.card
        : "transparent";

  const textColor =
    variant === "primary" ? Colors.background : Colors.textPrimary;

  const borderWidth = variant === "outline" ? 1 : 0;
  const borderColor = Colors.border;

  return (
    <MotiView
      from={{ opacity: 1 }}
      animate={{ opacity: disabled ? 0.4 : 1 }}
      style={[{ width: fullWidth ? "100%" : undefined }, style]}
    >
      <Pressable
        onPress={handlePress}
        disabled={disabled || loading}
        style={({ pressed }) => ({
          backgroundColor: bg,
          borderWidth,
          borderColor,
          paddingVertical: 16,
          paddingHorizontal: 24,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 2,
          opacity: pressed ? 0.85 : 1,
          minHeight: 52,
        })}
      >
        {loading ? (
          <ActivityIndicator color={textColor} />
        ) : (
          <Text
            style={{
              ...Typography.label,
              color: textColor,
              fontSize: 12,
            }}
          >
            {label}
          </Text>
        )}
      </Pressable>
    </MotiView>
  );
}
