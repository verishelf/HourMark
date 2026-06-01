import { View } from "react-native";
import { ListingPlaceholderGrid } from "@/components/ListingPlaceholderGrid";
import { WatchCard } from "@/components/WatchCard";
import { GRID_GAP } from "@/styles/layout";
import type { Listing } from "@/types";

function chunkListings<T>(items: T[]): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += 2) {
    rows.push(items.slice(i, i + 2));
  }
  return rows;
}

type Props = {
  listings: Listing[];
  showBuy?: boolean;
  showEmptyPlaceholder?: boolean;
};

export function ListingGrid({
  listings,
  showBuy = false,
  showEmptyPlaceholder = false,
}: Props) {
  if (!listings.length) {
    if (showEmptyPlaceholder) return <ListingPlaceholderGrid />;
    return null;
  }

  return (
    <View style={{ gap: GRID_GAP }}>
      {chunkListings(listings).map((row, rowIndex) => (
        <View
          key={row.map((listing) => listing.id).join("-")}
          style={{ flexDirection: "row", gap: GRID_GAP }}
        >
          {row.map((listing, columnIndex) => (
            <View key={listing.id} style={{ flex: 1, minWidth: 0 }}>
              <WatchCard
                listing={listing}
                variant="grid"
                index={rowIndex * 2 + columnIndex}
                showBuy={showBuy}
              />
            </View>
          ))}
          {row.length === 1 ? <View style={{ flex: 1, minWidth: 0 }} /> : null}
        </View>
      ))}
    </View>
  );
}
