import { TextInput, View } from "react-native";
import { Colors } from "@/constants/colors";
import { Typography } from "@/constants/typography";

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

export function SearchBar({
  value,
  onChangeText,
  placeholder = "Search watches, brands, references…",
}: Props) {
  return (
    <View
      style={{
        backgroundColor: Colors.card,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 2,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 20,
      }}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        style={{
          ...Typography.body,
          color: Colors.textPrimary,
          padding: 0,
        }}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}
