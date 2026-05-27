import { ReactNode } from "react";
import { Text, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { SPACING } from "@/constants/layout";
import { Typography } from "@/constants/typography";

type Props = {
  label?: string;
  title: string;
  subtitle?: string;
  rightAction?: ReactNode;
  bottomContent?: ReactNode;
  /** When true (default), adds horizontal screen padding. Set false inside already-padded containers. */
  padded?: boolean;
  style?: ViewStyle;
};

export function ScreenHeader({
  label,
  title,
  subtitle,
  rightAction,
  bottomContent,
  padded = true,
  style,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        {
          paddingTop: insets.top + 12,
          paddingHorizontal: padded ? SPACING.screen : 0,
          paddingBottom: bottomContent ? 12 : 16,
        },
        style,
      ]}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <View style={{ flex: 1, paddingRight: rightAction ? 12 : 0 }}>
          {label && (
            <Text
              style={{
                ...Typography.label,
                color: Colors.textSecondary,
                marginBottom: 4,
              }}
            >
              {label}
            </Text>
          )}
          <Text style={{ ...Typography.h2, color: Colors.textPrimary, fontSize: 26 }}>
            {title}
          </Text>
          {subtitle && (
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
        {rightAction}
      </View>
      {bottomContent && <View style={{ marginTop: 12 }}>{bottomContent}</View>}
    </View>
  );
}
