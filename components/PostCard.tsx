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
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { PostCommentLine } from "@/components/PostCommentLine";
import { UserAvatar } from "@/components/UserAvatar";
import { PostDoubleTapImage } from "@/components/PostDoubleTapImage";
import { Colors } from "@/constants/colors";
import { HIDE_SCROLL_INDICATORS } from "@/constants/scroll";
import { RADIUS, SPACING } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/hooks/useAuth";
import { useThemedStyles } from "@/hooks/useThemedStyles";
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

function createStyles() {
  return StyleSheet.create({
    feedItem: {
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
      marginBottom: 8,
    },
    postHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: SPACING.screen,
      paddingTop: 12,
      paddingBottom: 10,
    },
    postHeaderAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: Colors.cardElevated,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    postHeaderUsername: {
      ...Typography.body,
      color: Colors.textPrimary,
      fontWeight: "700",
      fontSize: 15,
    },
    placeholder: {
      minHeight: 120,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: Colors.cardElevated,
    },
    muted: {
      ...Typography.body,
      color: Colors.textMuted,
    },
    imageFrame: {
      alignSelf: "center",
      overflow: "hidden",
      backgroundColor: Colors.cardElevated,
    },
    body: {
      paddingHorizontal: SPACING.screen,
      paddingTop: 16,
      paddingBottom: 20,
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
      marginBottom: 4,
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
    modalScreen: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: SPACING.screen,
      paddingTop: 16,
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
      alignItems: "center",
      gap: 10,
      paddingHorizontal: SPACING.screen,
      paddingTop: 10,
      paddingBottom: 12,
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
      paddingTop: 10,
      paddingBottom: 10,
      minHeight: 44,
      maxHeight: 100,
      textAlignVertical: "center",
    },
    sendButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: Colors.cardElevated,
      borderWidth: 1,
      borderColor: Colors.border,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    sendButtonDisabled: {
      opacity: 0.4,
    },
  });
}

type PostCardStyles = ReturnType<typeof createStyles>;

function ActionButton({
  styles,
  icon,
  filled,
  count,
  label,
  onPress,
  disabled,
}: {
  styles: PostCardStyles;
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

type Props = {
  postId: string;
  /** Skip fetch when parent already has detail */
  initialPost?: UserPostDetail | null;
  /** Bottom separator in profile feed */
  showFeedDivider?: boolean;
};

export function PostCard({ postId, initialPost, showFeedDivider }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { user, isAuthenticated, profile } = useAuth();
  const styles = useThemedStyles(createStyles);

  const [post, setPost] = useState<UserPostDetail | null>(initialPost ?? null);
  const [comments, setComments] = useState<UserPostComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [loading, setLoading] = useState(!initialPost);
  const [likeLoading, setLikeLoading] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [detail, postComments] = await Promise.all([
        getPostDetail(postId, user?.id),
        getPostComments(postId),
      ]);
      setPost(detail);
      setComments(postComments);
    } catch {
      setPost(null);
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [postId, user?.id]);

  useEffect(() => {
    if (initialPost) {
      setPost(initialPost);
      setLoading(false);
    }
    getPostComments(postId).then(setComments).catch(() => setComments([]));
  }, [postId, initialPost]);

  useEffect(() => {
    if (!initialPost) load();
  }, [initialPost, load]);

  const username = post?.author?.username ?? "collector";
  const authorUserId = post?.user_id;

  const openAuthorProfile = () => {
    if (authorUserId) router.push(`/seller/${authorUserId}`);
  };

  const handleLike = async () => {
    if (!post) return;
    if (!isAuthenticated || !user) {
      router.push("/auth/welcome");
      return;
    }
    setLikeLoading(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const { liked, like_count } = await togglePostLike(post.id, user.id);
      setPost((prev) => (prev ? { ...prev, liked_by_me: liked, like_count } : prev));
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Could not update like");
    } finally {
      setLikeLoading(false);
    }
  };

  const handleDoubleTapLike = async () => {
    if (!post) return;
    if (!isAuthenticated || !user) {
      router.push("/auth/welcome");
      return;
    }
    if (post.liked_by_me || likeLoading) return;

    setLikeLoading(true);
    try {
      const { liked, like_count } = await togglePostLike(post.id, user.id);
      setPost((prev) => (prev ? { ...prev, liked_by_me: liked, like_count } : prev));
    } catch {
      // Heart flash still gives feedback
    } finally {
      setLikeLoading(false);
    }
  };

  const handleShare = async () => {
    if (!post) return;
    try {
      await Share.share({
        message: post.caption
          ? `${username} on Crownly: ${post.caption}`
          : `Check out this post by ${username} on Crownly`,
      });
    } catch {
      // User dismissed share sheet
    }
  };

  const openCommentsModal = () => {
    if (!isAuthenticated) {
      router.push("/auth/welcome");
      return;
    }
    setCommentsModalOpen(true);
  };

  const handleSubmitComment = async () => {
    if (!post || !commentText.trim()) return;
    if (!isAuthenticated || !user) {
      router.push("/auth/welcome");
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
      <View style={[styles.placeholder, { width: screenWidth, height: screenWidth }]}>
        <Text style={styles.muted}>Loading…</Text>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.muted}>Post unavailable</Text>
      </View>
    );
  }

  return (
    <View style={showFeedDivider ? styles.feedItem : undefined}>
      <Pressable
        onPress={openAuthorProfile}
        style={styles.postHeader}
        accessibilityRole="button"
        accessibilityLabel={`View ${username}'s profile`}
      >
        <UserAvatar
          uri={post.author?.avatar_url}
          size={36}
          borderWidth={styles.postHeaderAvatar.borderWidth}
          borderColor={styles.postHeaderAvatar.borderColor}
        />
        <Text style={styles.postHeaderUsername}>{username}</Text>
      </Pressable>

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
            styles={styles}
            icon={post.liked_by_me ? "heart" : "heart-outline"}
            filled={post.liked_by_me}
            count={post.like_count}
            label="Like"
            onPress={handleLike}
            disabled={likeLoading}
          />
          <ActionButton
            styles={styles}
            icon="chatbubble-outline"
            count={post.comment_count}
            label="Comment"
            onPress={openCommentsModal}
          />
          <ActionButton styles={styles} icon="paper-plane-outline" label="Share" onPress={handleShare} />
        </View>

        {(post.caption || comments.length > 0) ? (
          <Text style={styles.captionBlock}>
            <Text onPress={openAuthorProfile} style={styles.username}>
              {username}
            </Text>
            {post.caption ? <Text style={styles.captionText}> {post.caption}</Text> : null}
          </Text>
        ) : null}

        {comments.length > 0 ? (
          <View style={styles.commentsSection}>
            {comments.map((comment) => (
              <PostCommentLine key={comment.id} comment={comment} />
            ))}
          </View>
        ) : null}
      </View>

      <Modal
        visible={commentsModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCommentsModalOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalScreen}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={[styles.modalHeader, { paddingTop: insets.top + 8 }]}>
            <Text style={styles.modalTitle}>Comments</Text>
            <Pressable
              onPress={() => setCommentsModalOpen(false)}
              hitSlop={12}
              style={styles.modalClose}
            >
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
              comments.map((comment) => (
                <PostCommentLine key={comment.id} comment={comment} />
              ))
            ) : (
              <Text style={styles.modalEmpty}>No comments yet. Be the first.</Text>
            )}
          </ScrollView>

          <View style={[styles.modalInputBar, { paddingBottom: insets.bottom + 8 }]}>
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
    </View>
  );
}
