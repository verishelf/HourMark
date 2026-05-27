import { Pressable, Text } from "react-native";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { Typography } from "@/constants/typography";
import { RADIUS } from "@/constants/layout";

type ChipProps = {
  label: string;
  active?: boolean;
  onPress: () => void;
};

export function FilterChip({ label, active = false, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={{
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: RADIUS.pill,
        borderWidth: 1,
        borderColor: active ? Colors.textPrimary : Colors.border,
        backgroundColor: active ? Colors.cardElevated : "transparent",
      }}
    >
      <Text
        style={{
          ...Typography.caption,
          color: active ? Colors.textPrimary : Colors.textSecondary,
          fontWeight: active ? "600" : "400",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

type Props = {
  chips: readonly string[];
  selected: string;
  onSelect: (chip: string) => void;
};

export function FilterChips({ chips, selected, onSelect }: Props) {
  return (
    <>
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
              borderRadius: RADIUS.pill,
              borderWidth: 1,
              borderColor: Colors.textPrimary,
              backgroundColor: "transparent",
              opacity: active ? 1 : 0.7,
            }}
          >
            <Text
              style={{
                ...Typography.caption,
                color: Colors.textPrimary,
                fontWeight: active ? "600" : "400",
              }}
            >
              {chip}
            </Text>
          </Pressable>
        );
      })}
    </>
  );
}
