import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { FeatureScreenScaffold } from "@/components/FeatureScreenScaffold";
import { StoryFeed } from "@/components/stories/StoryFeed";
import { STORY_CATEGORIES } from "@/constants/storyCategories";

export default function StoryCategoryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const category = STORY_CATEGORIES.find((c) => c.slug === slug);

  return (
    <FeatureScreenScaffold title={category?.name ?? "Category"} scroll={false}>
      <View style={{ flex: 1 }}>
        <StoryFeed showCategories={false} initialCategory={slug} />
      </View>
    </FeatureScreenScaffold>
  );
}
