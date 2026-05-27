import { useCallback, useEffect, useState } from "react";
import * as Haptics from "expo-haptics";
import { isFavorite, toggleFavorite } from "@/services/favorites";

export function useFavorite(userId: string | undefined, listingId: string) {
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
      const next = await toggleFavorite(userId, listingId);
      setFavorited(next);
      return next;
    } finally {
      setLoading(false);
    }
  }, [userId, listingId]);

  return { favorited, loading, toggle };
}
