import { ScrollView, Pressable, Text, View } from "react-native";
import { STORY_CATEGORIES } from "@/constants/storyCategories";
import { Colors } from "@/constants/colors";
import { Typography } from "@/constants/typography";
import { SPACING } from "@/constants/layout";

type Props = {
  selected: string | null;
  onSelect: (slug: string | null) => void;
};

export function StoryCategoryBar({ selected, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: SPACING.screen, gap: 8 }}
      style={{ marginBottom: SPACING.md }}
    >
      <Pressable
        onPress={() => onSelect(null)}
        style={{
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: selected === null ? Colors.gold : Colors.border,
          backgroundColor: selected === null ? Colors.goldMuted : Colors.card,
        }}
      >
        <Text style={{ ...Typography.label, fontSize: 11, color: selected === null ? Colors.gold : Colors.textSecondary }}>
          All
        </Text>
      </Pressable>
      {STORY_CATEGORIES.map((cat) => {
        const active = selected === cat.slug;
        return (
          <Pressable
            key={cat.slug}
            onPress={() => onSelect(cat.slug)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: active ? Colors.gold : Colors.border,
              backgroundColor: active ? Colors.goldMuted : Colors.card,
            }}
          >
            <Text style={{ ...Typography.label, fontSize: 11, color: active ? Colors.gold : Colors.textSecondary }}>
              {cat.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
