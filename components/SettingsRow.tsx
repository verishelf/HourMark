import { type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { Typography } from "@/constants/typography";

type Props = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  subtitle?: string;
  trailing?: ReactNode;
  destructive?: boolean;
  isLast?: boolean;
  loading?: boolean;
  disabled?: boolean;
};

export function SettingsRow({
  label,
  icon,
  onPress,
  subtitle,
  trailing,
  destructive,
  isLast,
  loading,
  disabled,
}: Props) {
  const color = destructive ? Colors.error : Colors.textPrimary;

  return (
    <Pressable
      onPress={onPress}
      disabled={loading || disabled}
      style={({ pressed }) => [
        pressed && styles.pressed,
        !isLast && styles.rowBorder,
        (loading || disabled) && styles.disabled,
      ]}
    >
      <View style={styles.row}>
        <Ionicons name={icon} size={20} color={color} />
        <View style={styles.copy}>
          <Text style={[styles.label, { color }]}>{label}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {loading ? (
          <Text style={styles.subtitle}>Processing...</Text>
        ) : (
          trailing ?? (!destructive ? (
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          ) : null)
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  label: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
});
