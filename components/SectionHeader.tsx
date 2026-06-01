import { Pressable, Text, View, type ViewStyle } from "react-native";
import { Colors } from "@/constants/colors";
import { Typography } from "@/constants/typography";

type Props = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
  /** Extra space above the header (e.g. after a horizontal card row) */
  topSpacing?: number;
  style?: ViewStyle;
};

export function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
  compact = false,
  topSpacing = 0,
  style,
}: Props) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: compact ? "center" : "flex-end",
        marginTop: topSpacing,
        marginBottom: compact ? 12 : 20,
        ...style,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={
            compact
              ? {
                  ...Typography.label,
                  color: Colors.textMuted,
                  fontSize: 11,
                }
              : { ...Typography.h2, color: Colors.textPrimary }
          }
        >
          {title}
        </Text>
        {subtitle && !compact && (
          <Text
            style={{
              ...Typography.caption,
              color: Colors.textMuted,
              marginTop: 4,
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {actionLabel && onAction && (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={{ ...Typography.caption, color: Colors.textSecondary }}>
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
