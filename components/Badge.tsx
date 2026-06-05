import { Text, View, ViewStyle } from "react-native";
import { Colors } from "@/constants/colors";
import { RADIUS } from "@/constants/layout";
import { Typography } from "@/constants/typography";

type Props = {
  label: string;
  variant?: "default" | "success" | "muted" | "error" | "warning";
  style?: ViewStyle;
};

const VARIANT_STYLES = {
  default: {
    borderColor: Colors.borderLight,
    color: Colors.textSecondary,
  },
  success: {
    borderColor: Colors.success,
    color: Colors.success,
  },
  muted: {
    borderColor: Colors.border,
    color: Colors.textMuted,
  },
  error: {
    borderColor: Colors.error,
    color: Colors.error,
  },
  warning: {
    borderColor: "#EAB308",
    color: "#EAB308",
  },
};

export function Badge({ label, variant = "default", style }: Props) {
  const v = VARIANT_STYLES[variant];

  return (
    <View
      style={[
        {
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderWidth: 1,
          borderColor: v.borderColor,
          borderRadius: RADIUS.sm,
          alignSelf: "flex-start",
        },
        style,
      ]}
    >
      <Text
        style={{
          ...Typography.caption,
          fontSize: 10,
          color: v.color,
          letterSpacing: 0.5,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
