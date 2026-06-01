import { StyleSheet, Text, View, type ReactNode, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LuxuryButton } from "@/components/LuxuryButton";
import { Colors } from "@/constants/colors";
import { SPACING } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import { useTheme } from "@/hooks/useTheme";
import { useThemedStyles } from "@/hooks/useThemedStyles";

type Props = {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionVariant?: "primary" | "secondary" | "ghost" | "outline" | "onDark" | "onDarkFilled";
  /** Theme-aware styling for photo overlay gates (seller verification, etc.) */
  onDark?: boolean;
  /** Optional content between body and action button */
  footer?: ReactNode;
  compact?: boolean;
  /** Fill available space and center vertically (lists, full screens) */
  fill?: boolean;
  style?: ViewStyle;
};

function createStyles() {
  return StyleSheet.create({
    root: {
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "center",
      width: "100%",
      maxWidth: 340,
      paddingHorizontal: SPACING.screen,
    },
    rootDefault: {
      paddingVertical: 48,
    },
    rootCompact: {
      paddingVertical: 32,
    },
    fill: {
      flex: 1,
      minHeight: 280,
    },
    iconWrap: {
      width: 64,
      height: 64,
      borderRadius: 32,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.card,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
    },
    iconWrapCompact: {
      width: 52,
      height: 52,
      borderRadius: 26,
      marginBottom: 16,
    },
    title: {
      ...Typography.h3,
      color: Colors.textPrimary,
      textAlign: "center",
      marginBottom: 8,
      fontSize: 18,
    },
    titleCompact: {
      fontSize: 16,
    },
    body: {
      ...Typography.body,
      color: Colors.textMuted,
      textAlign: "center",
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 24,
    },
    bodyCompact: {
      marginBottom: 20,
    },
    action: {
      alignSelf: "center",
      width: "100%",
      maxWidth: 280,
    },
    onDarkIconWrap: {
      borderColor: "rgba(255,255,255,0.35)",
      backgroundColor: "rgba(255,255,255,0.1)",
    },
    onDarkTitle: {
      ...Typography.h3,
      color: "#FFFFFF",
      textAlign: "center",
      marginBottom: 8,
      fontSize: 18,
    },
    onDarkTitleCompact: {
      fontSize: 16,
    },
    onDarkBody: {
      ...Typography.body,
      color: "#FFFFFF",
      textAlign: "center",
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 24,
    },
    onDarkBodyCompact: {
      marginBottom: 20,
    },
    onLightIconWrap: {
      borderColor: Colors.border,
      backgroundColor: Colors.cardElevated,
    },
    onLightTitle: {
      ...Typography.h3,
      color: Colors.textPrimary,
      textAlign: "center",
      marginBottom: 8,
      fontSize: 18,
    },
    onLightTitleCompact: {
      fontSize: 16,
    },
    onLightBody: {
      ...Typography.body,
      color: Colors.textSecondary,
      textAlign: "center",
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 24,
    },
    onLightBodyCompact: {
      marginBottom: 20,
    },
    footer: {
      width: "100%",
      marginBottom: 24,
    },
    footerCompact: {
      marginBottom: 20,
    },
  });
}

export function EmptyState({
  icon = "watch-outline",
  title,
  body,
  actionLabel,
  onAction,
  actionVariant = "primary",
  onDark = false,
  footer,
  compact = false,
  fill = false,
  style,
}: Props) {
  const { colorScheme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const isLightOverlay = onDark && colorScheme === "light";

  const content = (
    <>
      <View
        style={[
          styles.iconWrap,
          compact && styles.iconWrapCompact,
          onDark && !isLightOverlay && styles.onDarkIconWrap,
          isLightOverlay && styles.onLightIconWrap,
        ]}
      >
        <Ionicons
          name={icon}
          size={compact ? 24 : 28}
          color={onDark && !isLightOverlay ? "#FFFFFF" : Colors.textPrimary}
        />
      </View>
      <Text
        style={
          onDark
            ? isLightOverlay
              ? [styles.onLightTitle, compact && styles.onLightTitleCompact]
              : [styles.onDarkTitle, compact && styles.onDarkTitleCompact]
            : [styles.title, compact && styles.titleCompact]
        }
      >
        {title}
      </Text>
      {body ? (
        <Text
          style={
            onDark
              ? isLightOverlay
                ? [styles.onLightBody, compact && styles.onLightBodyCompact]
                : [styles.onDarkBody, compact && styles.onDarkBodyCompact]
              : [styles.body, compact && styles.bodyCompact]
          }
        >
          {body}
        </Text>
      ) : null}
      {footer ? (
        <View style={[styles.footer, compact && styles.footerCompact]}>{footer}</View>
      ) : null}
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <LuxuryButton
            label={actionLabel}
            onPress={onAction}
            variant={
              onDark
                ? isLightOverlay
                  ? "outline"
                  : "onDark"
                : actionVariant
            }
          />
        </View>
      ) : null}
    </>
  );

  return (
    <View
      style={[
        styles.root,
        compact ? styles.rootCompact : styles.rootDefault,
        fill && styles.fill,
        style,
      ]}
    >
      {content}
    </View>
  );
}

/** Wrapper for empty states inside scroll views (profile tabs, etc.) */
export const emptyStateSectionStyle: ViewStyle = {
  minHeight: 320,
  justifyContent: "center",
  alignItems: "center",
  width: "100%",
  paddingVertical: 24,
};
