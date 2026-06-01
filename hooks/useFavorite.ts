import { useCallback, useEffect, useState } from "react";
import * as Haptics from "expo-haptics";
import { isFavorite, toggleFavorite } from "@/services/favorites";
import { notifyContentRefresh } from "@/lib/contentRefresh";

export function useFavorite(
  userId: string | undefined,
  listingId: string,
  listingPrice?: number
) {
  const [favorited, setFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    isFavorite(userId, listingId).then(setFavorited);
  }, [userId, listingId]);

  const toggle = useCallback(async () => {
    if (!userId) return false;
    setLoading(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const next = await toggleFavorite(userId, listingId, listingPrice);
      setFavorited(next);
      notifyContentRefresh();
      return next;
    } finally {
      setLoading(false);
    }
  }, [userId, listingId, listingPrice]);

  return { favorited, loading, toggle };
}
