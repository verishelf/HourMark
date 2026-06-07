export type RecentSaleItem = {
  id: string;
  listingId: string;
  brand: string;
  model: string;
  reference: string | null;
  /** USD */
  price: number;
  imageUrl: string | null;
  soldAt: string;
};
