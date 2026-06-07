import { StyleSheet, Switch, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { Typography } from "@/constants/typography";
import { useThemedStyles } from "@/hooks/useThemedStyles";

type Props = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: boolean;
  onValueChange: (value: boolean) => void;
  subtitle?: string;
  isLast?: boolean;
  disabled?: boolean;
};

function createStyles() {
  return StyleSheet.create({
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
    disabled: {
      opacity: 0.5,
    },
  });
}

export function SettingsToggleRow({
  label,
  icon,
  value,
  onValueChange,
  subtitle,
  isLast,
  disabled,
}: Props) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={[styles.row, !isLast && styles.rowBorder, disabled && styles.disabled]}>
      <Ionicons name={icon} size={20} color={Colors.textPrimary} />
      <View style={styles.copy}>
        <Text style={styles.label}>{label}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: Colors.border, true: Colors.goldMuted }}
        thumbColor={value ? Colors.gold : Colors.textMuted}
      />
    </View>
  );
}
