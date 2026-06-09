import { useCallback, useEffect, useState } from "react";
import { toggleStoryBookmark, toggleStoryLike } from "@/services/storyEngagement";

export function useStoryEngagement(initial: { liked?: boolean; bookmarked?: boolean }) {
  const [liked, setLiked] = useState(initial.liked ?? false);
  const [bookmarked, setBookmarked] = useState(initial.bookmarked ?? false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    setLiked(initial.liked ?? false);
    setBookmarked(initial.bookmarked ?? false);
  }, [initial.liked, initial.bookmarked]);

  const toggleLike = useCallback(async (storyId: string, userId: string, currentCount: number) => {
    const next = await toggleStoryLike(storyId, userId);
    setLiked(next);
    setLikeCount(next ? currentCount + 1 : Math.max(0, currentCount - 1));
    return next;
  }, []);

  const toggleBookmark = useCallback(async (storyId: string, userId: string) => {
    const next = await toggleStoryBookmark(storyId, userId);
    setBookmarked(next);
    return next;
  }, []);

  return { liked, bookmarked, likeCount, setLikeCount, toggleLike, toggleBookmark };
}
