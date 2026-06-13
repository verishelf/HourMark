import { Text, View, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { RADIUS } from "@/constants/layout";
import { Typography } from "@/constants/typography";
import { useAuctionCountdown } from "@/hooks/useAuctionCountdown";
import { isAuctionEnded, isAuctionListing } from "@/lib/auction";
import type { Listing } from "@/types";

type Props = {
  listing: Pick<
    Listing,
    "sale_mode" | "auction_ends_at" | "auction_bid_count" | "status"
  >;
  variant?: "default" | "compact" | "card";
  style?: ViewStyle;
};

export function AuctionTimer({ listing, variant = "default", style }: Props) {
  const { label, ended } = useAuctionCountdown(
    isAuctionListing(listing) ? listing : null
  );

  if (!isAuctionListing(listing)) return null;

  const live = !ended && !isAuctionEnded(listing);
  const compact = variant === "compact";
  const card = variant === "card";

  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          gap: compact ? 4 : 6,
          backgroundColor: live ? "rgba(220, 38, 38, 0.12)" : Colors.cardElevated,
          borderWidth: 1,
          borderColor: live ? "rgba(220, 38, 38, 0.35)" : Colors.border,
          borderRadius: card ? RADIUS.sm : RADIUS.pill,
          paddingHorizontal: compact ? 8 : card ? 10 : 12,
          paddingVertical: compact ? 4 : card ? 8 : 6,
        },
        style,
      ]}
    >
      <Ionicons
        name={live ? "timer-outline" : "flag-outline"}
        size={compact ? 12 : 14}
        color={live ? "#EF4444" : Colors.textMuted}
      />
      <Text
        style={{
          ...(compact ? Typography.caption : Typography.label),
          fontSize: compact ? 10 : card ? 12 : 11,
          color: live ? "#EF4444" : Colors.textMuted,
        }}
      >
        {live ? label : "Ended"}
      </Text>
      {live && listing.auction_bid_count != null && listing.auction_bid_count > 0 ? (
        <Text
          style={{
            ...Typography.caption,
            fontSize: compact ? 10 : 11,
            color: Colors.textSecondary,
          }}
        >
          · {listing.auction_bid_count} bid{listing.auction_bid_count === 1 ? "" : "s"}
        </Text>
      ) : null}
    </View>
  );
}
