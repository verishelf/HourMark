import type { Listing } from "@/types";

export type ListingAccessories = {
  includesBox: boolean;
  includesPapers: boolean;
  includesWarrantyCard: boolean;
};

export function resolveListingAccessories(listing: Listing): ListingAccessories {
  const fullSet = listing.trust_badges?.includes("full_set");

  return {
    includesBox: listing.includes_box ?? fullSet ?? false,
    includesPapers: listing.includes_papers ?? fullSet ?? false,
    includesWarrantyCard: listing.includes_warranty_card ?? false,
  };
}
