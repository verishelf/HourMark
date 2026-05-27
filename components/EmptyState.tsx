import { Text, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LuxuryButton } from "@/components/LuxuryButton";
import { Colors } from "@/constants/colors";
import { RADIUS } from "@/constants/layout";
import { Typography } from "@/constants/typography";

type Props = {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
  style?: ViewStyle;
};

export function EmptyState({
  icon = "watch-outline",
  title,
  body,
  actionLabel,
  onAction,
  compact = false,
  style,
}: Props) {
  return (
    <View style={[{ alignItems: "center", paddingVertical: compact ? 32 : 48 }, style]}>
      <View
        style={{
          width: compact ? 52 : 64,
          height: compact ? 52 : 64,
          borderRadius: compact ? 26 : 32,
          borderWidth: 1,
          borderColor: Colors.border,
          backgroundColor: Colors.card,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: compact ? 16 : 20,
        }}
      >
        <Ionicons name={icon} size={compact ? 24 : 28} color={Colors.textMuted} />
      </View>
      <Text
        style={{
          ...Typography.h3,
          color: Colors.textPrimary,
          textAlign: "center",
          marginBottom: 8,
          fontSize: compact ? 16 : 18,
        }}
      >
        {title}
      </Text>
      {body && (
        <Text
          style={{
            ...Typography.body,
            color: Colors.textMuted,
            textAlign: "center",
            marginBottom: actionLabel ? 24 : 0,
            fontSize: 14,
            lineHeight: 20,
            paddingHorizontal: 16,
            maxWidth: 300,
          }}
        >
          {body}
        </Text>
      )}
      {actionLabel && onAction && (
        <View style={{ width: "100%", paddingHorizontal: 8 }}>
          <LuxuryButton label={actionLabel} onPress={onAction} variant="primary" />
        </View>
      )}
    </View>
  );
}
