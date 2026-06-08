import { FlatList, View } from "react-native";
import { FirstListingPlaceholderCard } from "@/components/FirstListingPlaceholderCard";
import { WatchCard } from "@/components/WatchCard";
import { WatchCardSkeleton } from "@/components/SkeletonLoader";
import { HORIZONTAL_CARD_GAP, HORIZONTAL_LISTING_ROW_HEIGHT, SPACING } from "@/constants/layout";
import { smoothHorizontalScrollProps } from "@/constants/scroll";
import type { Listing } from "@/types";

export const HORIZONTAL_LISTING_CARD_WIDTH = 260;
export { HORIZONTAL_LISTING_ROW_HEIGHT };

const SNAP_INTERVAL = HORIZONTAL_LISTING_CARD_WIDTH + HORIZONTAL_CARD_GAP;

const itemStyle = {
  width: HORIZONTAL_LISTING_CARD_WIDTH,
  marginRight: HORIZONTAL_CARD_GAP,
};

type Props = {
  listings: Listing[];
  loading?: boolean;
  loadingCount?: number;
  showBuy?: boolean;
  /** When the marketplace has no listings yet, show sell CTA cards */
  showEmptyPlaceholder?: boolean;
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
  showEmptyPlaceholder = false,
  contentContainerStyle,
}: Props) {
  const scrollContentStyle = {
    paddingLeft: contentContainerStyle?.paddingLeft,
    paddingRight: contentContainerStyle?.paddingRight ?? SPACING.screen,
    marginBottom: contentContainerStyle?.marginBottom ?? 24,
  };

  const scrollProps = smoothHorizontalScrollProps(SNAP_INTERVAL);

  const listStyle = { height: HORIZONTAL_LISTING_ROW_HEIGHT, flexGrow: 0 as const };

  const getItemLayout = (_data: ArrayLike<{ id: string }> | null | undefined, index: number) => ({
    length: SNAP_INTERVAL,
    offset: SNAP_INTERVAL * index,
    index,
  });

  if (loading) {
    const placeholders = Array.from({ length: loadingCount }, (_, i) => ({ id: `sk-${i}` }));
    return (
      <FlatList
        data={placeholders}
        horizontal
        nestedScrollEnabled
        removeClippedSubviews={false}
        style={listStyle}
        keyExtractor={(item) => item.id}
        renderItem={() => (
          <View style={[itemStyle, { height: HORIZONTAL_LISTING_ROW_HEIGHT }]}>
            <WatchCardSkeleton variant="compact" />
          </View>
        )}
        getItemLayout={getItemLayout}
        contentContainerStyle={scrollContentStyle}
        {...scrollProps}
      />
    );
  }

  if (!listings.length) {
    if (!showEmptyPlaceholder) return null;
    const placeholders = [0, 1, 2].map((i) => ({ id: `placeholder-${i}` }));
    return (
      <FlatList
        data={placeholders}
        horizontal
        nestedScrollEnabled
        removeClippedSubviews={false}
        style={listStyle}
        keyExtractor={(item) => item.id}
        renderItem={() => (
          <View style={[itemStyle, { height: HORIZONTAL_LISTING_ROW_HEIGHT }]}>
            <FirstListingPlaceholderCard variant="compact" />
          </View>
        )}
        getItemLayout={getItemLayout}
        contentContainerStyle={scrollContentStyle}
        {...scrollProps}
      />
    );
  }

  return (
    <FlatList
      data={listings}
      horizontal
      nestedScrollEnabled
      removeClippedSubviews={false}
      style={listStyle}
      keyExtractor={(item) => item.id}
      extraData={listings.map((l) => l.id).join(",")}
      initialNumToRender={6}
      maxToRenderPerBatch={6}
      windowSize={5}
      renderItem={({ item, index }) => (
        <View style={[itemStyle, { height: HORIZONTAL_LISTING_ROW_HEIGHT }]}>
          <WatchCard listing={item} variant="compact" index={index} showBuy={showBuy} />
        </View>
      )}
      getItemLayout={getItemLayout}
      contentContainerStyle={scrollContentStyle}
      {...scrollProps}
    />
  );
}
