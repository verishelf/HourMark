import { Pressable, Text, View } from "react-native";
import { Colors } from "@/constants/colors";
import { Typography } from "@/constants/typography";

type Props = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
}: Props) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
        marginBottom: 20,
      }}
    >
      <View>
        <Text style={{ ...Typography.h2, color: Colors.textPrimary }}>
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
      {actionLabel && onAction && (
        <Pressable onPress={onAction}>
          <Text style={{ ...Typography.caption, color: Colors.textSecondary }}>
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
