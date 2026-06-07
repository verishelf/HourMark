import { ScrollView, View } from "react-native";
import { StoryCard } from "@/components/stories/StoryCard";
import { SectionHeader } from "@/components/SectionHeader";
import { SPACING } from "@/constants/layout";
import type { StoryCard as StoryCardType } from "@/types";

type Props = {
  stories: StoryCardType[];
  onSeeAll?: () => void;
  onStoryPress?: (slug: string) => void;
};

export function StoryFeaturedCarousel({ stories, onSeeAll, onStoryPress }: Props) {
  return (
    <View style={{ marginTop: SPACING.lg }}>
      <SectionHeader
        title="Crownly Stories"
        subtitle="Luxury networking & lifestyle"
        actionLabel="See All"
        onAction={onSeeAll}
        style={{ paddingHorizontal: SPACING.screen }}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: SPACING.screen, paddingBottom: SPACING.sm }}
      >
        {stories.map((story) => (
          <StoryCard key={story.id} story={story} variant="featured" />
        ))}
      </ScrollView>
    </View>
  );
}
