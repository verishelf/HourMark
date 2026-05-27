import { TextInput, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { Typography } from "@/constants/typography";
import { RADIUS } from "@/constants/layout";

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
  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: Colors.cardElevated,
          borderWidth: 1,
          borderColor: Colors.border,
          borderRadius: RADIUS.pill,
          paddingHorizontal: compact ? 12 : 16,
          paddingVertical: compact ? 8 : 12,
          gap: 8,
        },
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
        style={{
          ...Typography.body,
          flex: 1,
          color: Colors.textPrimary,
          fontSize: compact ? 14 : 16,
          padding: 0,
        }}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}
