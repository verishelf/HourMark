import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, NativeScrollEvent, NativeSyntheticEvent, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FeatureScreenScaffold } from "@/components/FeatureScreenScaffold";
import { StoryHero } from "@/components/stories/StoryHero";
import { StoryArticleBody } from "@/components/stories/StoryArticleBody";
import { StoryEngagementBar } from "@/components/stories/StoryEngagementBar";
import { AuthorCard } from "@/components/stories/AuthorCard";
import { RelatedStoriesRow } from "@/components/stories/RelatedStoriesRow";
import { SuggestedWatchesRow } from "@/components/stories/SuggestedWatchesRow";
import { Colors } from "@/constants/colors";
import { SPACING } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/hooks/useAuth";
import { useStoryEngagement } from "@/hooks/useStoryEngagement";
import { getStoryBySlug, getRelatedStories, getListingsForStory } from "@/services/stories";
import { recordStoryView, updateStoryViewProgress } from "@/services/storyEngagement";
import type { Story, StoryCard } from "@/types";

export default function StoryDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [story, setStory] = useState<(Story & { liked_by_me?: boolean; bookmarked_by_me?: boolean }) | null>(null);
  const [related, setRelated] = useState<StoryCard[]>([]);
  const [listings, setListings] = useState<Awaited<ReturnType<typeof getListingsForStory>>>([]);
  const [loading, setLoading] = useState(true);
  const viewIdRef = useRef<string | null>(null);
  const lastDepthRef = useRef(0);

  const { liked, bookmarked, toggleLike, toggleBookmark } = useStoryEngagement({
    liked: story?.liked_by_me,
    bookmarked: story?.bookmarked_by_me,
  });

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    getStoryBySlug(slug, user?.id)
      .then(async (s) => {
        setStory(s);
        if (s) {
          const [rel, watches] = await Promise.all([
            getRelatedStories(s.id, s.category_id),
            getListingsForStory(s.related_listing_ids),
          ]);
          setRelated(rel);
          setListings(watches);
          viewIdRef.current = await recordStoryView(s.id, user?.id);
        }
      })
      .finally(() => setLoading(false));
  }, [slug, user?.id]);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      const depth = Math.round(
        ((contentOffset.y + layoutMeasurement.height) / contentSize.height) * 100
      );
      if (depth > lastDepthRef.current && viewIdRef.current) {
        lastDepthRef.current = depth;
        if (depth % 25 === 0 || depth >= 90) {
          updateStoryViewProgress(viewIdRef.current, depth).catch(() => {});
        }
      }
    },
    []
  );

  const handleLike = async () => {
    if (!story || !user) {
      router.push("/auth/login");
      return;
    }
    const next = await toggleLike(story.id, user.id, story.like_count);
    setStory((s) => (s ? { ...s, like_count: next ? s.like_count + 1 : Math.max(0, s.like_count - 1), liked_by_me: next } : s));
  };

  const handleBookmark = async () => {
    if (!story || !user) {
      router.push("/auth/login");
      return;
    }
    await toggleBookmark(story.id, user.id);
    setStory((s) => (s ? { ...s, bookmarked_by_me: !bookmarked } : s));
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background }}>
        <ActivityIndicator color={Colors.gold} />
      </View>
    );
  }

  if (!story) {
    return (
      <FeatureScreenScaffold title="Story">
        <Text style={{ ...Typography.body, color: Colors.textMuted, padding: SPACING.screen }}>
          Story not found.
        </Text>
      </FeatureScreenScaffold>
    );
  }

  return (
    <FeatureScreenScaffold scroll={false}>
      <ScrollView onScroll={handleScroll} scrollEventThrottle={200}>
        <StoryHero
          imageUrl={story.hero_image_url}
          title={story.title}
          subtitle={story.subtitle}
          category={story.category?.name}
          readTime={story.read_time_minutes}
        />
        <StoryEngagementBar
          storyId={story.id}
          slug={story.slug}
          title={story.title}
          likeCount={story.like_count}
          commentCount={story.comment_count}
          liked={liked}
          bookmarked={bookmarked}
          userId={user?.id}
          onLike={handleLike}
          onBookmark={handleBookmark}
        />
        <StoryArticleBody blocks={story.body} />
        {story.author ? <AuthorCard author={story.author} /> : null}
        {story.source_attribution ? (
          <Text style={{ ...Typography.caption, color: Colors.textMuted, paddingHorizontal: SPACING.screen, marginTop: SPACING.md }}>
            Source: {story.source_attribution}
          </Text>
        ) : null}
        <RelatedStoriesRow stories={related} />
        <SuggestedWatchesRow listings={listings} />
      </ScrollView>
    </FeatureScreenScaffold>
  );
}
