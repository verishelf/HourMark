import { ReactNode } from "react";
import { Text, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CrownlyLogo } from "@/components/CrownlyLogo";
import { Colors } from "@/constants/colors";
import { SPACING } from "@/constants/layout";
import { Typography } from "@/constants/typography";

type Props = {
  label?: string;
  /** Renders the Crownly mark above the title instead of a text label. */
  logo?: boolean;
  /** Logo width when `logo` is true (default 108). */
  logoWidth?: number;
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
  logo,
  logoWidth = 108,
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
          {logo ? (
            <CrownlyLogo
              width={logoWidth}
              style={{ marginBottom: 8, alignSelf: "flex-start" }}
            />
          ) : label ? (
            <Text
              style={{
                ...Typography.label,
                color: Colors.textSecondary,
                marginBottom: 4,
              }}
            >
              {label}
            </Text>
          ) : null}
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
