import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FeatureScreenScaffold } from "@/components/FeatureScreenScaffold";
import { StoryHero } from "@/components/stories/StoryHero";
import { StoryArticleBody } from "@/components/stories/StoryArticleBody";
import { StoryEngagementBar } from "@/components/stories/StoryEngagementBar";
import { StoryCommentInputBar, StoryCommentsList } from "@/components/stories/StoryCommentsSection";
import { AuthorCard } from "@/components/stories/AuthorCard";
import { RelatedStoriesRow } from "@/components/stories/RelatedStoriesRow";
import { SuggestedWatchesRow } from "@/components/stories/SuggestedWatchesRow";
import { Colors } from "@/constants/colors";
import { SPACING, STORY_GUTTER } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/hooks/useAuth";
import { useStoryComments } from "@/hooks/useStoryComments";
import { useStoryEngagement } from "@/hooks/useStoryEngagement";
import { notifyContentRefresh } from "@/lib/contentRefresh";
import { getStoryBySlug, getRelatedStories, getListingsForStory } from "@/services/stories";
import { recordStoryView, updateStoryViewProgress } from "@/services/storyEngagement";
import type { Story, StoryCard } from "@/types";

export default function StoryDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { user, profile } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [story, setStory] = useState<(Story & { liked_by_me?: boolean; bookmarked_by_me?: boolean }) | null>(null);
  const [related, setRelated] = useState<StoryCard[]>([]);
  const [listings, setListings] = useState<Awaited<ReturnType<typeof getListingsForStory>>>([]);
  const [loading, setLoading] = useState(true);
  const viewIdRef = useRef<string | null>(null);
  const lastDepthRef = useRef(0);
  const scrollRef = useRef<ScrollView>(null);
  const commentsOffsetRef = useRef(0);

  const { liked, bookmarked, toggleLike, toggleBookmark } = useStoryEngagement({
    liked: story?.liked_by_me,
    bookmarked: story?.bookmarked_by_me,
  });

  const commentsState = useStoryComments({
    storyId: story?.id ?? "",
    userId: user?.id,
    username: profile?.username,
    avatarUrl: profile?.avatar_url,
    onCommentAdded: () =>
      setStory((s) => (s ? { ...s, comment_count: s.comment_count + 1 } : s)),
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

  const scrollToComments = useCallback(() => {
    scrollRef.current?.scrollTo({ y: Math.max(0, commentsOffsetRef.current - 16), animated: true });
  }, []);

  const handleCommentFocus = useCallback(() => {
    if (!user) {
      router.push("/auth/login");
    }
  }, [user, router]);

  const handleLike = async () => {
    if (!story || !user) {
      router.push("/auth/login");
      return;
    }
    const next = await toggleLike(story.id, user.id, story.like_count);
    setStory((s) =>
      s ? { ...s, like_count: next ? s.like_count + 1 : Math.max(0, s.like_count - 1), liked_by_me: next } : s
    );
  };

  const handleBookmark = async () => {
    if (!story || !user) {
      router.push("/auth/login");
      return;
    }
    const next = await toggleBookmark(story.id, user.id);
    setStory((s) => (s ? { ...s, bookmarked_by_me: next } : s));
    notifyContentRefresh();
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
    <FeatureScreenScaffold scroll={false} contentContainerStyle={{ flex: 1, paddingHorizontal: 0 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 56 : 0}
      >
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          onScroll={handleScroll}
          scrollEventThrottle={200}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          contentContainerStyle={{ paddingBottom: SPACING.lg }}
        >
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
            onCommentPress={scrollToComments}
          />
          <StoryArticleBody blocks={story.body} />
          <StoryCommentsList
            commentsState={commentsState}
            onLayout={(event) => {
              commentsOffsetRef.current = event.nativeEvent.layout.y;
            }}
          />
          {story.author ? <AuthorCard author={story.author} /> : null}
          {story.source_attribution ? (
            <Text style={{ ...Typography.caption, color: Colors.textMuted, paddingHorizontal: STORY_GUTTER, marginTop: SPACING.md }}>
              Source: {story.source_attribution}
            </Text>
          ) : null}
          <RelatedStoriesRow stories={related} />
          <SuggestedWatchesRow listings={listings} />
        </ScrollView>

        <StoryCommentInputBar
          commentsState={commentsState}
          bottomInset={insets.bottom}
          onFocus={handleCommentFocus}
        />
      </KeyboardAvoidingView>
    </FeatureScreenScaffold>
  );
}
