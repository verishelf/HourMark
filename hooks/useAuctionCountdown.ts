import { useEffect, useState } from "react";
import { getMsUntilAuctionEnd, formatAuctionCountdown } from "@/lib/auction";
import type { Listing } from "@/types";

export function useAuctionCountdown(
  listing: Pick<Listing, "auction_ends_at"> | null | undefined,
  intervalMs = 1000
) {
  const [remainingMs, setRemainingMs] = useState(() =>
    listing ? getMsUntilAuctionEnd(listing) : 0
  );

  useEffect(() => {
    if (!listing?.auction_ends_at) {
      setRemainingMs(0);
      return;
    }

    const tick = () => setRemainingMs(getMsUntilAuctionEnd(listing));
    tick();
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [listing?.auction_ends_at, intervalMs]);

  return {
    remainingMs,
    label: formatAuctionCountdown(remainingMs),
    ended: remainingMs <= 0,
  };
}
