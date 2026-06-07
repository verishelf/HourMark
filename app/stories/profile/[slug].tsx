import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { FeatureScreenScaffold } from "@/components/FeatureScreenScaffold";
import { ProfileSections } from "@/components/stories/ProfileSections";
import { Colors } from "@/constants/colors";
import { getCelebrityProfile, getCollectorProfile, getStoriesForProfile } from "@/services/storySubmissions";
import type { StoryCard } from "@/types";

export default function StoryProfileScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof getCelebrityProfile>>>(null);
  const [stories, setStories] = useState<StoryCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const celeb = await getCelebrityProfile(slug);
      if (celeb) {
        setProfile(celeb);
        setLoading(false);
        return;
      }
      const collector = await getCollectorProfile(slug);
      setProfile(collector);
      if (collector?.featured_story_ids?.length) {
        const s = await getStoriesForProfile(collector.featured_story_ids);
        setStories(s as StoryCard[]);
      }
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background }}>
        <ActivityIndicator color={Colors.gold} />
      </View>
    );
  }

  if (!profile) {
    return <FeatureScreenScaffold title="Profile"><View /></FeatureScreenScaffold>;
  }

  return (
    <FeatureScreenScaffold title="Profile" scroll={false}>
      <ProfileSections profile={profile} featuredStories={stories} />
    </FeatureScreenScaffold>
  );
}
