import { ActivityIndicator, RefreshControl, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { StoryCard } from "@/components/stories/StoryCard";
import { StoryCategoryBar } from "@/components/stories/StoryCategoryBar";
import { Colors } from "@/constants/colors";
import { SPACING } from "@/constants/layout";
import { useStoriesFeed } from "@/hooks/useStoriesFeed";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

type Props = {
  showCategories?: boolean;
  initialCategory?: string | null;
};

export function StoryFeed({ showCategories = true, initialCategory = null }: Props) {
  const { user } = useAuth();
  const [category, setCategory] = useState<string | null>(initialCategory);
  const { stories, loading, refreshing, loadingMore, refresh, loadMore } = useStoriesFeed({
    userId: user?.id,
    categorySlug: category,
  });

  if (loading && stories.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: SPACING.xl }}>
        <ActivityIndicator color={Colors.gold} />
      </View>
    );
  }

  return (
    <FlashList
      data={stories}
      keyExtractor={(item) => item.id}
      estimatedItemSize={320}
      contentContainerStyle={{ paddingHorizontal: SPACING.sm, paddingBottom: 120 }}
      ListHeaderComponent={
        showCategories ? <StoryCategoryBar selected={category} onSelect={setCategory} /> : null
      }
      renderItem={({ item }) => <StoryCard story={item} />}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.gold} />
      }
      onEndReached={loadMore}
      onEndReachedThreshold={0.4}
      ListFooterComponent={
        loadingMore ? (
          <ActivityIndicator color={Colors.gold} style={{ marginVertical: SPACING.lg }} />
        ) : null
      }
    />
  );
}
