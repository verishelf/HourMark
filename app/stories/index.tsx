"use client";

import { useEffect } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { FeatureScreenScaffold } from "@/components/FeatureScreenScaffold";
import { StoryFeed } from "@/components/stories/StoryFeed";
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
    <FeatureScreenScaffold
      title="Stories"
      subtitle="Luxury networking & lifestyle"
      scroll={false}
      contentContainerStyle={{ flex: 1, paddingHorizontal: 0 }}
    >
      <View style={{ flex: 1 }}>
        <StoryFeed />
      </View>
    </FeatureScreenScaffold>
  );
}
