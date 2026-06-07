import { useEffect, useState } from "react";
import { ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { FeatureScreenScaffold } from "@/components/FeatureScreenScaffold";
import { StoryFeaturedCarousel } from "@/components/stories/StoryFeaturedCarousel";
import { getFeaturedStories } from "@/services/stories";
import type { StoryCard } from "@/types";

export function StoryHomeSection() {
  const router = useRouter();
  const [stories, setStories] = useState<StoryCard[]>([]);

  useEffect(() => {
    getFeaturedStories(5).then(setStories).catch(() => setStories([]));
  }, []);

  if (stories.length === 0) return null;

  return (
    <StoryFeaturedCarousel
      stories={stories}
      onSeeAll={() => router.push("/stories")}
      onStoryPress={(slug) => router.push(`/stories/${slug}`)}
    />
  );
}
