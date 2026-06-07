import { Pressable, Share, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { STORY_WEB_BASE } from "@/constants/storyCategories";
import { Typography } from "@/constants/typography";
import { SPACING } from "@/constants/layout";
import { recordStoryShare } from "@/services/storyEngagement";

type Props = {
  storyId: string;
  slug: string;
  title: string;
  likeCount: number;
  commentCount: number;
  liked: boolean;
  bookmarked: boolean;
  userId?: string;
  onLike: () => void;
  onBookmark: () => void;
};

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export function StoryEngagementBar({
  storyId,
  slug,
  title,
  likeCount,
  commentCount,
  liked,
  bookmarked,
  userId,
  onLike,
  onBookmark,
}: Props) {
  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (userId) await recordStoryShare(storyId, userId, "native");
    await Share.share({
      message: `${title}\n${STORY_WEB_BASE}/${slug}`,
      url: `${STORY_WEB_BASE}/${slug}`,
    });
  };

  return (
    <View style={styles.bar}>
      <Pressable style={styles.action} onPress={onLike}>
        <Ionicons name={liked ? "heart" : "heart-outline"} size={22} color={liked ? Colors.gold : Colors.textMuted} />
        <Text style={styles.count}>{formatCount(likeCount)}</Text>
      </Pressable>
      <Pressable style={styles.action} onPress={onBookmark}>
        <Ionicons name={bookmarked ? "bookmark" : "bookmark-outline"} size={22} color={bookmarked ? Colors.gold : Colors.textMuted} />
      </Pressable>
      <View style={styles.action}>
        <Ionicons name="chatbubble-outline" size={22} color={Colors.textMuted} />
        <Text style={styles.count}>{formatCount(commentCount)}</Text>
      </View>
      <Pressable style={styles.action} onPress={handleShare}>
        <Ionicons name="share-outline" size={22} color={Colors.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.screen,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    gap: 24,
  },
  action: { flexDirection: "row", alignItems: "center", gap: 6 },
  count: { ...Typography.caption, color: Colors.textMuted },
});
