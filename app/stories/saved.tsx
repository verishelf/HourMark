import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { FeatureScreenScaffold } from "@/components/FeatureScreenScaffold";
import { StoryCard } from "@/components/stories/StoryCard";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Colors } from "@/constants/colors";
import { SPACING } from "@/constants/layout";
import { useAuth } from "@/hooks/useAuth";
import { getBookmarkedStories } from "@/services/stories";
import type { StoryCard as StoryCardType } from "@/types";

export default function SavedStoriesScreen() {
  const { user } = useAuth();
  const [stories, setStories] = useState<StoryCardType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getBookmarkedStories(user.id).then(setStories).finally(() => setLoading(false));
  }, [user]);

  return (
    <FeatureScreenScaffold title="Saved Stories">
      <ScreenHeader title="Saved Stories" style={{ paddingHorizontal: SPACING.screen, marginBottom: SPACING.md }} />
      {loading ? (
        <ActivityIndicator color={Colors.gold} style={{ marginTop: SPACING.xl }} />
      ) : (
        <View style={{ paddingHorizontal: SPACING.screen }}>
          {stories.map((s) => (
            <StoryCard key={s.id} story={s} />
          ))}
        </View>
      )}
    </FeatureScreenScaffold>
  );
}
