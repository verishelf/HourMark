import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { PostDoubleTapImage } from "@/components/PostDoubleTapImage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { HeaderIconButton } from "@/components/HeaderIconButton";
import { Colors } from "@/constants/colors";
import { HIDE_SCROLL_INDICATORS } from "@/constants/scroll";
import { RADIUS, SPACING } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/hooks/useAuth";
import {
  addPostComment,
  getPostComments,
  getPostDetail,
  togglePostLike,
} from "@/services/posts";
import type { UserPostComment, UserPostDetail } from "@/types";

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function CommentLine({ comment }: { comment: UserPostComment }) {
  return (
    <Text style={styles.commentRow}>
      <Text style={styles.commentUsername}>@{comment.author?.username ?? "user"} </Text>
      <Text style={styles.commentText}>{comment.text}</Text>
    </Text>
  );
}

function ActionButton({
  icon,
  filled,
  count,
  label,
  onPress,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  filled?: boolean;
  count?: number;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      style={({ pressed }) => [
        styles.actionButton,
        pressed && !disabled && styles.actionPressed,
        disabled && styles.actionDisabled,
      ]}
      accessibilityLabel={label}
    >
      <View style={styles.actionInner}>
        <Ionicons
          name={icon}
          size={24}
          color={filled ? Colors.textPrimary : Colors.textSecondary}
        />
        {count !== undefined ? (
          <Text style={styles.actionCount}>{formatCount(count)}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { user, isAuthenticated, profile } = useAuth();

  const [post, setPost] = useState<UserPostDetail | null>(null);
  const [comments, setComments] = useState<UserPostComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [likeLoading, setLikeLoading] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [detail, postComments] = await Promise.all([
        getPostDetail(id, user?.id),
        getPostComments(id),
      ]);
      setPost(detail);
      setComments(postComments);
    } catch {
      setPost(null);
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [id, user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const username = post?.author?.username ?? "collector";

  const handleLike = async () => {
    if (!post) return;
    if (!isAuthenticated || !user) {
      router.push("/auth/login");
      return;
    }
    setLikeLoading(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const { liked, like_count } = await togglePostLike(post.id, user.id);
      setPost((prev) =>
        prev ? { ...prev, liked_by_me: liked, like_count } : prev
      );
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Could not update like");
    } finally {
      setLikeLoading(false);
    }
  };

  const handleDoubleTapLike = async () => {
    if (!post) return;
    if (!isAuthenticated || !user) {
      router.push("/auth/login");
      return;
    }
    if (post.liked_by_me || likeLoading) return;

    setLikeLoading(true);
    try {
      const { liked, like_count } = await togglePostLike(post.id, user.id);
      setPost((prev) =>
        prev ? { ...prev, liked_by_me: liked, like_count } : prev
      );
    } catch {
      // Heart flash still gives feedback; like button can retry
    } finally {
      setLikeLoading(false);
    }
  };

  const handleShare = async () => {
    if (!post) return;
    try {
      await Share.share({
        message: post.caption
          ? `${username} on HourMark: ${post.caption}`
          : `Check out this post by @${username} on HourMark`,
      });
    } catch {
      // User dismissed share sheet
    }
  };

  const openCommentsModal = () => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    setCommentsModalOpen(true);
  };

  const closeCommentsModal = () => {
    setCommentsModalOpen(false);
  };

  const handleSubmitComment = async () => {
    if (!post || !commentText.trim()) return;
    if (!isAuthenticated || !user) {
      router.push("/auth/login");
      return;
    }

    setCommentLoading(true);
    try {
      const comment = await addPostComment(post.id, user.id, commentText);
      const withAuthor: UserPostComment = {
        ...comment,
        author: comment.author ?? {
          username: profile?.username ?? "collector",
          avatar_url: profile?.avatar_url ?? null,
        },
      };
      setComments((prev) => [...prev, withAuthor]);
      setCommentText("");
      setPost((prev) =>
        prev ? { ...prev, comment_count: prev.comment_count + 1 } : prev
      );
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Could not post comment");
    } finally {
      setCommentLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.muted}>Loading…</Text>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.muted}>Post not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        {...HIDE_SCROLL_INDICATORS}
        contentContainerStyle={{
          paddingTop: insets.top,
          paddingBottom: insets.bottom + 24,
        }}
      >
        <PostDoubleTapImage
          uri={post.image_url}
          width={screenWidth}
          height={screenWidth}
          onDoubleTapLike={handleDoubleTapLike}
          style={styles.imageFrame}
        />

        <View style={styles.body}>
          <View style={styles.actionsRow}>
            <ActionButton
              icon={post.liked_by_me ? "heart" : "heart-outline"}
              filled={post.liked_by_me}
              count={post.like_count}
              label="Like"
              onPress={handleLike}
              disabled={likeLoading}
            />
            <ActionButton
              icon="chatbubble-outline"
              count={post.comment_count}
              label="Comment"
              onPress={openCommentsModal}
            />
            <ActionButton icon="paper-plane-outline" label="Share" onPress={handleShare} />
          </View>

          <Text style={styles.captionBlock}>
            <Text style={styles.username}>@{username}</Text>
            {post.caption ? (
              <Text style={styles.captionText}> {post.caption}</Text>
            ) : null}
          </Text>

          {comments.length > 0 ? (
            <View style={styles.commentsSection}>
              {comments.map((comment) => (
                <CommentLine key={comment.id} comment={comment} />
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>

      <Modal
        visible={commentsModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeCommentsModal}
      >
        <KeyboardAvoidingView
          style={styles.modalScreen}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={[styles.modalHeader, { paddingTop: insets.top + 8 }]}>
            <Text style={styles.modalTitle}>Comments</Text>
            <Pressable onPress={closeCommentsModal} hitSlop={12} style={styles.modalClose}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.modalList}
            contentContainerStyle={styles.modalListContent}
            {...HIDE_SCROLL_INDICATORS}
            keyboardShouldPersistTaps="handled"
          >
            {comments.length ? (
              comments.map((comment) => <CommentLine key={comment.id} comment={comment} />)
            ) : (
              <Text style={styles.modalEmpty}>No comments yet. Be the first.</Text>
            )}
          </ScrollView>

          <View
            style={[
              styles.modalInputBar,
              { paddingBottom: insets.bottom + 8 },
            ]}
          >
            <TextInput
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Add a comment…"
              placeholderTextColor={Colors.textMuted}
              style={styles.commentInput}
              multiline
              maxLength={500}
            />
            <Pressable
              onPress={handleSubmitComment}
              disabled={commentLoading || !commentText.trim()}
              style={({ pressed }) => [
                styles.sendButton,
                (commentLoading || !commentText.trim()) && styles.sendButtonDisabled,
                pressed && styles.actionPressed,
              ]}
            >
              <Ionicons name="send" size={20} color={Colors.textPrimary} />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <View
        pointerEvents="box-none"
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <HeaderIconButton icon="chevron-back" onPress={() => router.back()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  muted: {
    ...Typography.body,
    color: Colors.textMuted,
  },
  imageFrame: {
    alignSelf: "center",
    overflow: "hidden",
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    backgroundColor: Colors.cardElevated,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.screen,
  },
  body: {
    paddingHorizontal: SPACING.screen,
    paddingTop: 16,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginBottom: 14,
  },
  actionButton: {
    flexShrink: 0,
  },
  actionInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionPressed: {
    opacity: 0.7,
  },
  actionDisabled: {
    opacity: 0.5,
  },
  actionCount: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 24,
    includeFontPadding: false,
  },
  captionBlock: {
    lineHeight: 22,
  },
  username: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: "700",
    fontSize: 15,
  },
  captionText: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontSize: 15,
    lineHeight: 22,
  },
  commentsSection: {
    marginTop: 14,
    gap: 10,
  },
  commentRow: {
    lineHeight: 20,
  },
  commentUsername: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontWeight: "700",
    fontSize: 13,
  },
  commentText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 13,
  },
  modalScreen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.screen,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  modalClose: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  modalList: {
    flex: 1,
  },
  modalListContent: {
    padding: SPACING.screen,
    gap: 12,
    flexGrow: 1,
  },
  modalEmpty: {
    ...Typography.body,
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: 24,
  },
  modalInputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: SPACING.screen,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  commentInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.textPrimary,
    backgroundColor: Colors.cardElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cardElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});
