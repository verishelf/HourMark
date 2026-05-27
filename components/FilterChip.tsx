import { Pressable, ScrollView, Text } from "react-native";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { Typography } from "@/constants/typography";

type Props = {
  chips: readonly string[];
  selected: string;
  onSelect: (chip: string) => void;
};

export function FilterChips({ chips, selected, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingBottom: 16 }}
    >
      {chips.map((chip) => {
        const active = chip === selected;
        return (
          <Pressable
            key={chip}
            onPress={() => {
              Haptics.selectionAsync();
              onSelect(chip);
            }}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: active ? Colors.textPrimary : Colors.border,
              backgroundColor: active ? Colors.textPrimary : "transparent",
            }}
          >
            <Text
              style={{
                ...Typography.caption,
                color: active ? Colors.background : Colors.textSecondary,
              }}
            >
              {chip}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
