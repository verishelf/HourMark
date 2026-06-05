import { useRouter } from "expo-router";
import { Badge } from "@/components/Badge";
import { WatchCard } from "@/components/WatchCard";
import { isListingMarketplaceLive } from "@/lib/listingImages";
import { authenticationStatusLabel } from "@/lib/trust";
import type { AuthenticationStatus, Listing } from "@/types";

type Props = {
  listing: Listing;
  index?: number;
  onEdit: () => void;
  onDelete: () => void;
};

function listingStatusBadge(listing: Listing): {
  label: string;
  variant: "success" | "muted" | "error" | "warning";
} | null {
  if (isListingMarketplaceLive(listing)) return null;

  if (listing.status === "sold") {
    return { label: "Sold", variant: "error" };
  }

  if (listing.status === "draft" || listing.authentication_status === "pending") {
    return { label: "Finish verification", variant: "warning" };
  }

  const status = listing.authentication_status as AuthenticationStatus | undefined;
  return {
    label: status ? authenticationStatusLabel(status) : "Not live",
    variant: "muted",
  };
}

export function MyListingCard({ listing, index = 0, onEdit, onDelete }: Props) {
  const router = useRouter();
  const statusBadge = listingStatusBadge(listing);
  const isLive = isListingMarketplaceLive(listing);

  return (
    <WatchCard
      listing={listing}
      variant="grid"
      index={index}
      showBuy={false}
      showFavorite={false}
      onEdit={onEdit}
      onDelete={onDelete}
      onCardPress={
        isLive || listing.status === "sold"
          ? undefined
          : () => router.push(`/listing/trust-verify/${listing.id}`)
      }
      statusBadge={statusBadge}
    />
  );
}
