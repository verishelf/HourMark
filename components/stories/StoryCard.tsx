import { Pressable, Share, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@/constants/colors";
import { STORY_WEB_BASE } from "@/constants/storyCategories";
import { RADIUS, SPACING } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import type { StoryCard as StoryCardType } from "@/types";

type Props = {
  story: StoryCardType;
  variant?: "feed" | "compact" | "featured";
  onBookmark?: () => void;
  onShare?: () => void;
};

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function createStyles() {
  return StyleSheet.create({
    card: {
      backgroundColor: Colors.card,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: Colors.border,
      overflow: "hidden",
      marginBottom: SPACING.lg,
      width: "100%",
    },
    featuredCard: {
      borderColor: Colors.gold,
      width: 300,
      marginRight: SPACING.md,
    },
    hero: {
      width: "100%",
      aspectRatio: 16 / 10,
    },
    compactHero: {
      aspectRatio: 16 / 9,
    },
    content: {
      padding: SPACING.lg,
      paddingTop: SPACING.md,
    },
    categoryTag: {
      alignSelf: "flex-start",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: RADIUS.full,
      backgroundColor: Colors.goldMuted,
      marginBottom: 8,
    },
    categoryText: {
      ...Typography.label,
      fontSize: 10,
      color: Colors.gold,
    },
    title: {
      ...Typography.h3,
      color: Colors.textPrimary,
      marginBottom: 6,
    },
    subtitle: {
      ...Typography.body,
      color: Colors.textSecondary,
      marginBottom: 12,
      lineHeight: 20,
    },
    meta: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    metaLeft: {
      flex: 1,
    },
    metaText: {
      ...Typography.caption,
      color: Colors.textMuted,
    },
    actions: {
      flexDirection: "row",
      gap: 12,
    },
    actionBtn: {
      padding: 4,
    },
  });
}

export function StoryCard({ story, variant = "feed", onBookmark, onShare }: Props) {
  const router = useRouter();
  const styles = useThemedStyles(createStyles);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/stories/${story.slug}`);
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onShare?.();
    await Share.share({
      message: `${story.title}\n${STORY_WEB_BASE}/${story.slug}`,
      url: `${STORY_WEB_BASE}/${story.slug}`,
    });
  };

  const isFeatured = variant === "featured";
  const isCompact = variant === "compact";

  return (
    <Pressable
      onPress={handlePress}
      style={[styles.card, isFeatured && styles.featuredCard]}
    >
      <View>
        <Image
          source={{ uri: story.hero_image_url }}
          style={[styles.hero, isCompact && styles.compactHero]}
          contentFit="cover"
        />
        {isFeatured ? (
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.85)"]}
            style={StyleSheet.absoluteFillObject}
          />
        ) : null}
      </View>
      <View style={styles.content}>
        {story.category ? (
          <View style={styles.categoryTag}>
            <Text style={styles.categoryText}>{story.category.name}</Text>
          </View>
        ) : null}
        <Text style={styles.title} numberOfLines={isCompact ? 2 : 3}>
          {story.title}
        </Text>
        {!isCompact && story.subtitle ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {story.subtitle}
          </Text>
        ) : null}
        <View style={styles.meta}>
          <View style={styles.metaLeft}>
            <Text style={styles.metaText}>
              {story.author?.name ?? "Crownly"} · {story.read_time_minutes} min · {formatDate(story.published_at)}
            </Text>
          </View>
          <View style={styles.actions}>
            <Pressable style={styles.actionBtn} onPress={onBookmark} hitSlop={8}>
              <Ionicons
                name={story.bookmarked_by_me ? "bookmark" : "bookmark-outline"}
                size={20}
                color={story.bookmarked_by_me ? Colors.gold : Colors.textMuted}
              />
            </Pressable>
            <Pressable style={styles.actionBtn} onPress={handleShare} hitSlop={8}>
              <Ionicons name="share-outline" size={20} color={Colors.textMuted} />
            </Pressable>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
