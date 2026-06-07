import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { StoryFeaturedCarousel } from "@/components/stories/StoryFeaturedCarousel";
import { getHomeStories } from "@/services/stories";
import type { StoryCard } from "@/types";

export function StoryHomeSection() {
  const router = useRouter();
  const [stories, setStories] = useState<StoryCard[]>([]);

  const loadStories = useCallback(() => {
    getHomeStories(5)
      .then(setStories)
      .catch(() => setStories([]));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStories();
    }, [loadStories])
  );

  if (stories.length === 0) return null;

  return (
    <StoryFeaturedCarousel
      stories={stories}
      onSeeAll={() => router.push("/stories")}
    />
  );
}
