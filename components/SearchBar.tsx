import { Platform, StyleSheet, TextInput, View, ViewStyle } from "react-native";
import { useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { RADIUS } from "@/constants/layout";
import { useTheme } from "@/hooks/useTheme";

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  compact?: boolean;
  style?: ViewStyle;
};

export function SearchBar({
  value,
  onChangeText,
  placeholder = "Search watches, brands, references…",
  compact = false,
  style,
}: Props) {
  const { colorScheme } = useTheme();
  const fontSize = compact ? 14 : 16;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        shell: {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: Colors.cardElevated,
          borderWidth: 1,
          borderColor: Colors.border,
          borderRadius: RADIUS.pill,
          gap: 8,
        },
        shellCompact: {
          minHeight: 44,
          paddingHorizontal: 12,
          paddingVertical: 10,
        },
        shellDefault: {
          minHeight: 48,
          paddingHorizontal: 16,
          paddingVertical: 12,
        },
        input: {
          flex: 1,
          color: Colors.textPrimary,
          padding: 0,
          margin: 0,
          includeFontPadding: false,
          ...(Platform.OS === "android" ? { textAlignVertical: "center" as const } : {}),
        },
      }),
    [colorScheme]
  );

  return (
    <View
      style={[
        styles.shell,
        compact ? styles.shellCompact : styles.shellDefault,
        style,
      ]}
    >
      <Ionicons
        name="search-outline"
        size={compact ? 16 : 18}
        color={Colors.textMuted}
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        style={[
          styles.input,
          {
            fontSize,
            lineHeight: compact ? 18 : 20,
          },
        ]}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}
