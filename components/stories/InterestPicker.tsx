import { Pressable, Text, View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { USER_INTERESTS } from "@/constants/storyCategories";
import { Colors } from "@/constants/colors";
import { Typography } from "@/constants/typography";
import { SPACING, RADIUS } from "@/constants/layout";
import type { UserInterest } from "@/types";

type Props = {
  selected: UserInterest[];
  onToggle: (interest: UserInterest) => void;
};

export function InterestPicker({ selected, onToggle }: Props) {
  return (
    <View style={styles.grid}>
      {USER_INTERESTS.map((item) => {
        const active = selected.includes(item.id as UserInterest);
        return (
          <Pressable
            key={item.id}
            onPress={() => onToggle(item.id as UserInterest)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={20} color={active ? Colors.gold : Colors.textMuted} />
            <Text style={[styles.label, active && styles.labelActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm, padding: SPACING.screen },
  chip: {
    width: "47%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  chipActive: { borderColor: Colors.gold, backgroundColor: Colors.goldMuted },
  label: { ...Typography.caption, color: Colors.textSecondary },
  labelActive: { color: Colors.gold },
});
