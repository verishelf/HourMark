import { useCallback, useEffect, useRef, useState } from "react";
import { getPersonalizedFeed } from "@/services/storyRecommendations";
import type { StoryCard } from "@/types";

export function useStoriesFeed(opts: {
  userId?: string;
  categorySlug?: string | null;
}) {
  const [stories, setStories] = useState<StoryCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const cursorRef = useRef<{ published_at: string; id: string } | null>(null);
  const hasMoreRef = useRef(true);

  const load = useCallback(
    async (reset = false) => {
      if (reset) {
        cursorRef.current = null;
        hasMoreRef.current = true;
      } else if (!hasMoreRef.current) return;

      try {
        const result = await getPersonalizedFeed({
          userId: opts.userId,
          categorySlug: opts.categorySlug,
          limit: 20,
          cursor: reset ? null : cursorRef.current,
        });

        setStories((prev) => (reset ? result.stories : [...prev, ...result.stories]));
        cursorRef.current = result.nextCursor;
        hasMoreRef.current = Boolean(result.nextCursor);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [opts.userId, opts.categorySlug]
  );

  useEffect(() => {
    setLoading(true);
    load(true);
  }, [load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load(true);
  }, [load]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMoreRef.current) return;
    setLoadingMore(true);
    await load(false);
  }, [load, loadingMore]);

  return { stories, loading, refreshing, loadingMore, refresh, loadMore };
}
