import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { StoryFeaturedCarousel } from "@/components/stories/StoryFeaturedCarousel";
import { SectionHeader } from "@/components/SectionHeader";
import { Colors } from "@/constants/colors";
import { SPACING } from "@/constants/layout";
import { getHomeStories } from "@/services/stories";
import type { StoryCard } from "@/types";

export function StoryHomeSection() {
  const router = useRouter();
  const [stories, setStories] = useState<StoryCard[]>([]);
  const [loading, setLoading] = useState(true);
  const isFirstFocusRef = useRef(true);

  const loadStories = useCallback(() => {
    setLoading(true);
    return getHomeStories(5)
      .then(setStories)
      .catch(() => setStories([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void loadStories();
  }, [loadStories]);

  useFocusEffect(
    useCallback(() => {
      if (isFirstFocusRef.current) {
        isFirstFocusRef.current = false;
        return;
      }
      void loadStories();
    }, [loadStories])
  );

  if (loading) {
    return (
      <View style={{ marginTop: SPACING.lg, paddingHorizontal: SPACING.screen }}>
        <SectionHeader title="Crownly Stories" subtitle="Luxury networking & lifestyle" />
        <View style={{ alignItems: "center", paddingVertical: SPACING.xl }}>
          <ActivityIndicator color={Colors.gold} />
        </View>
      </View>
    );
  }

  if (stories.length === 0) return null;

  return (
    <StoryFeaturedCarousel
      stories={stories}
      onSeeAll={() => router.push("/stories")}
    />
  );
}
