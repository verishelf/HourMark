import { View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { WatchCard } from "@/components/WatchCard";
import { WatchCardSkeleton } from "@/components/SkeletonLoader";
import { HORIZONTAL_CARD_GAP, SPACING } from "@/constants/layout";
import type { Listing } from "@/types";

const CARD_WIDTH = 260;
const ROW_HEIGHT = 328;

const itemStyle = {
  width: CARD_WIDTH,
  marginRight: HORIZONTAL_CARD_GAP,
};

type Props = {
  listings: Listing[];
  loading?: boolean;
  loadingCount?: number;
  showBuy?: boolean;
};

export function HorizontalListingScroll({
  listings,
  loading = false,
  loadingCount = 3,
  showBuy = false,
}: Props) {
  if (loading) {
    return (
      <View style={{ height: ROW_HEIGHT, marginBottom: 24 }}>
        <FlashList
          data={Array.from({ length: loadingCount }, (_, i) => i)}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => String(item)}
          estimatedItemSize={CARD_WIDTH + HORIZONTAL_CARD_GAP}
          contentContainerStyle={{ paddingRight: SPACING.screen - HORIZONTAL_CARD_GAP }}
          renderItem={() => (
            <View style={itemStyle}>
              <WatchCardSkeleton variant="compact" />
            </View>
          )}
        />
      </View>
    );
  }

  if (!listings.length) return null;

  return (
    <View style={{ height: ROW_HEIGHT, marginBottom: 24 }}>
      <FlashList
        data={listings}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        estimatedItemSize={CARD_WIDTH + HORIZONTAL_CARD_GAP}
        contentContainerStyle={{ paddingRight: SPACING.screen - HORIZONTAL_CARD_GAP }}
        renderItem={({ item, index }) => (
          <View style={itemStyle}>
            <WatchCard listing={item} variant="compact" index={index} showBuy={showBuy} />
          </View>
        )}
      />
    </View>
  );
}
