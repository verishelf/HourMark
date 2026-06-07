import { ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { StoryCard } from "@/components/stories/StoryCard";
import { SectionHeader } from "@/components/SectionHeader";
import { SPACING } from "@/constants/layout";
import type { StoryCard as StoryCardType } from "@/types";

type Props = {
  stories: StoryCardType[];
  title?: string;
};

export function RelatedStoriesRow({ stories, title = "Related Stories" }: Props) {
  const router = useRouter();
  if (stories.length === 0) return null;

  return (
    <View style={{ marginTop: SPACING.xl }}>
      <SectionHeader
        title={title}
        compact
        style={{ paddingHorizontal: SPACING.screen }}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: SPACING.screen }}
      >
        {stories.map((story) => (
          <StoryCard key={story.id} story={story} variant="featured" />
        ))}
      </ScrollView>
    </View>
  );
}
