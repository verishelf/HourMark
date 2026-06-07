"use client";

import { useEffect } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { FeatureScreenScaffold } from "@/components/FeatureScreenScaffold";
import { StoryFeed } from "@/components/stories/StoryFeed";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SPACING } from "@/constants/layout";
import { useAuth } from "@/hooks/useAuth";
import { hasUserInterests } from "@/services/userInterests";

export default function StoriesIndexScreen() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    hasUserInterests(user.id).then((has) => {
      if (!has) router.replace("/stories/interests");
    });
  }, [user, router]);

  return (
    <FeatureScreenScaffold title="Stories" scroll={false}>
      <View style={{ flex: 1 }}>
        <ScreenHeader
          label="Crownly"
          title="Stories"
          subtitle="Luxury networking & lifestyle"
          style={{ paddingHorizontal: SPACING.screen, marginBottom: SPACING.sm }}
        />
        <StoryFeed />
      </View>
    </FeatureScreenScaffold>
  );
}
