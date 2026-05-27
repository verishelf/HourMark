import { WatchCard } from "@/components/WatchCard";
import type { Listing } from "@/types";

type Props = {
  listing: Listing;
  index?: number;
  onEdit: () => void;
  onDelete: () => void;
};

export function MyListingCard({ listing, index = 0, onEdit, onDelete }: Props) {
  return (
    <WatchCard
      listing={listing}
      variant="grid"
      index={index}
      showBuy={false}
      showFavorite={false}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
}
