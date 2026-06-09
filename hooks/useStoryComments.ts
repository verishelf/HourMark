import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { addStoryComment, getStoryComments } from "@/services/storyEngagement";
import type { StoryComment } from "@/types";

type Options = {
  storyId: string;
  userId?: string;
  username?: string | null;
  avatarUrl?: string | null;
  onCommentAdded?: () => void;
};

export function useStoryComments({
  storyId,
  userId,
  username,
  avatarUrl,
  onCommentAdded,
}: Options) {
  const router = useRouter();
  const [comments, setComments] = useState<StoryComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadComments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getStoryComments(storyId);
      setComments(data);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [storyId]);

  useEffect(() => {
    if (!storyId) return;
    void loadComments();
  }, [loadComments, storyId]);

  const handleSubmit = async () => {
    const body = commentText.trim();
    if (!body) return;

    if (!userId) {
      router.push("/auth/login");
      return;
    }

    setSubmitting(true);
    try {
      const comment = await addStoryComment(storyId, userId, body);
      const withUser: StoryComment = {
        ...comment,
        user: comment.user ?? {
          username: username ?? "collector",
          full_name: null,
          avatar_url: avatarUrl ?? null,
        },
      };
      setComments((prev) => [...prev, withUser]);
      onCommentAdded?.();
      setCommentText("");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Could not post comment");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    comments,
    loading,
    commentText,
    setCommentText,
    submitting,
    handleSubmit,
    userId,
  };
}
