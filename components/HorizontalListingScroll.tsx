import { ScrollView, View } from "react-native";
import { WatchCard } from "@/components/WatchCard";
import { WatchCardSkeleton } from "@/components/SkeletonLoader";
import { HIDE_SCROLL_INDICATORS } from "@/constants/scroll";
import { HORIZONTAL_CARD_GAP, SPACING } from "@/constants/layout";
import type { Listing } from "@/types";

const CARD_WIDTH = 260;

const itemStyle = {
  width: CARD_WIDTH,
  marginRight: HORIZONTAL_CARD_GAP,
};

type Props = {
  listings: Listing[];
  loading?: boolean;
  loadingCount?: number;
  showBuy?: boolean;
  contentContainerStyle?: {
    paddingLeft?: number;
    paddingRight?: number;
    marginBottom?: number;
  };
};

export function HorizontalListingScroll({
  listings,
  loading = false,
  loadingCount = 3,
  showBuy = false,
  contentContainerStyle,
}: Props) {
  const scrollContentStyle = {
    paddingLeft: contentContainerStyle?.paddingLeft,
    paddingRight: contentContainerStyle?.paddingRight ?? SPACING.screen,
    marginBottom: contentContainerStyle?.marginBottom ?? 24,
  };
  if (loading) {
    return (
      <ScrollView
        horizontal
        {...HIDE_SCROLL_INDICATORS}
        contentContainerStyle={scrollContentStyle}
      >
        {Array.from({ length: loadingCount }, (_, i) => (
          <View key={i} style={itemStyle}>
            <WatchCardSkeleton variant="compact" />
          </View>
        ))}
      </ScrollView>
    );
  }

  if (!listings.length) return null;

  return (
    <ScrollView
      horizontal
      {...HIDE_SCROLL_INDICATORS}
      contentContainerStyle={scrollContentStyle}
    >
      {listings.map((item, index) => (
        <View key={item.id} style={itemStyle}>
          <WatchCard listing={item} variant="compact" index={index} showBuy={showBuy} />
        </View>
      ))}
    </ScrollView>
  );
}
