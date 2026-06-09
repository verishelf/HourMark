import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type LayoutChangeEvent } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StoryCommentLine } from "@/components/stories/StoryCommentLine";
import { Colors } from "@/constants/colors";
import { RADIUS, SPACING, STORY_GUTTER } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import type { useStoryComments } from "@/hooks/useStoryComments";

type CommentsState = ReturnType<typeof useStoryComments>;

type ListProps = {
  commentsState: CommentsState;
  onLayout?: (event: LayoutChangeEvent) => void;
};

type InputProps = {
  commentsState: CommentsState;
  bottomInset?: number;
  onFocus?: () => void;
};

function createListStyles() {
  return StyleSheet.create({
    section: {
      paddingHorizontal: STORY_GUTTER,
      paddingTop: SPACING.xl,
      paddingBottom: SPACING.lg,
      borderTopWidth: 1,
      borderTopColor: Colors.border,
      marginTop: SPACING.lg,
    },
    title: {
      ...Typography.h3,
      color: Colors.textPrimary,
      marginBottom: SPACING.md,
    },
    empty: {
      ...Typography.caption,
      color: Colors.textMuted,
    },
    loader: {
      marginVertical: SPACING.md,
    },
  });
}

function createInputStyles() {
  return StyleSheet.create({
    bar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: STORY_GUTTER,
      paddingTop: SPACING.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: Colors.border,
      backgroundColor: Colors.background,
    },
    input: {
      flex: 1,
      minHeight: 44,
      maxHeight: 100,
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: RADIUS.md,
      paddingHorizontal: SPACING.md,
      paddingTop: 10,
      paddingBottom: 10,
      ...Typography.body,
      fontSize: 14,
      color: Colors.textPrimary,
      textAlignVertical: "center",
    },
    sendButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: Colors.cardElevated,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: Colors.border,
      flexShrink: 0,
    },
    sendIcon: {
      marginLeft: 2,
      marginTop: 1,
    },
    sendButtonDisabled: {
      opacity: 0.4,
    },
  });
}

export function StoryCommentsList({ commentsState, onLayout }: ListProps) {
  const styles = useThemedStyles(createListStyles);
  const { comments, loading } = commentsState;

  return (
    <View style={styles.section} onLayout={onLayout}>
      <Text style={styles.title}>Comments</Text>

      {loading ? (
        <ActivityIndicator color={Colors.gold} style={styles.loader} />
      ) : comments.length ? (
        comments.map((comment) => <StoryCommentLine key={comment.id} comment={comment} />)
      ) : (
        <Text style={styles.empty}>No comments yet. Be the first.</Text>
      )}
    </View>
  );
}

export function StoryCommentInputBar({
  commentsState,
  bottomInset = 0,
  onFocus,
}: InputProps) {
  const router = useRouter();
  const styles = useThemedStyles(createInputStyles);
  const { commentText, setCommentText, submitting, handleSubmit, userId } = commentsState;

  if (!userId) {
    return (
      <Pressable
        style={[styles.bar, { paddingBottom: bottomInset + SPACING.sm }]}
        onPress={() => router.push("/auth/login")}
      >
        <View style={[styles.input, { justifyContent: "center" }]}>
          <Text style={{ ...Typography.body, fontSize: 14, color: Colors.textMuted }}>
            Sign in to comment
          </Text>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={[styles.bar, { paddingBottom: bottomInset + SPACING.sm }]}>
      <TextInput
        value={commentText}
        onChangeText={setCommentText}
        onFocus={onFocus}
        placeholder="Add a comment…"
        placeholderTextColor={Colors.textMuted}
        style={styles.input}
        multiline
        maxLength={500}
        editable={!submitting}
      />
      <Pressable
        onPress={handleSubmit}
        disabled={submitting || !commentText.trim()}
        style={({ pressed }) => [
          styles.sendButton,
          (submitting || !commentText.trim()) && styles.sendButtonDisabled,
          pressed && { opacity: 0.7 },
        ]}
      >
        {submitting ? (
          <ActivityIndicator size="small" color={Colors.textPrimary} />
        ) : (
          <Ionicons name="send" size={20} color={Colors.textPrimary} style={styles.sendIcon} />
        )}
      </Pressable>
    </View>
  );
}
