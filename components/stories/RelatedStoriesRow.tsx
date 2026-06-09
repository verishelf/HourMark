import { ScrollView, View } from "react-native";
import { StoryCard } from "@/components/stories/StoryCard";
import { SectionHeader } from "@/components/SectionHeader";
import { SPACING, STORY_FEATURED_CARD_SNAP_INTERVAL } from "@/constants/layout";
import { smoothHorizontalScrollProps } from "@/constants/scroll";
import type { StoryCard as StoryCardType } from "@/types";

type Props = {
  stories: StoryCardType[];
  title?: string;
};

export function RelatedStoriesRow({ stories, title = "Related Stories" }: Props) {
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
        nestedScrollEnabled
        {...smoothHorizontalScrollProps(STORY_FEATURED_CARD_SNAP_INTERVAL, {
          itemCount: stories.length,
          leadingInset: SPACING.screen,
        })}
        contentContainerStyle={{ paddingHorizontal: SPACING.screen }}
      >
        {stories.map((story) => (
          <StoryCard key={story.id} story={story} variant="featured" />
        ))}
      </ScrollView>
    </View>
  );
}
