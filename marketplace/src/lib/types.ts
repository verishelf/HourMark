export type UserProfile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio?: string | null;
  verified: boolean;
  seller_rating: number | null;
  total_sales?: number;
};

export type Listing = {
  id: string;
  seller_id: string;
  brand: string;
  model: string;
  reference_number: string | null;
  year: number | null;
  condition: string;
  price: number;
  description: string | null;
  images: string[];
  status: string;
  authentication_status?: string;
  ai_trust_score?: number;
  includes_box?: boolean;
  includes_papers?: boolean;
  includes_warranty_card?: boolean;
  sale_mode?: "fixed" | "auction";
  auction_ends_at?: string | null;
  auction_current_bid?: number | null;
  auction_starting_bid?: number | null;
  auction_bid_count?: number;
  created_at: string;
  seller?: UserProfile;
};

export const LUXURY_BRANDS = [
  "Rolex",
  "Audemars Piguet",
  "Patek Philippe",
  "Cartier",
  "Omega",
  "Richard Mille",
  "Vacheron Constantin",
  "Jaeger-LeCoultre",
  "IWC",
  "Panerai",
  "Breitling",
  "Tudor",
  "Hublot",
  "A. Lange & Söhne",
] as const;

export const CONDITIONS = [
  "Unworn",
  "Like New",
  "Excellent",
  "Very Good",
  "Good",
  "Fair",
] as const;

export type SortOption = "newest" | "price_asc" | "price_desc";

export type ShippingDetails = {
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
};

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function sortListings(listings: Listing[], sort: SortOption): Listing[] {
  const copy = [...listings];
  switch (sort) {
    case "price_asc":
      return copy.sort((a, b) => a.price - b.price);
    case "price_desc":
      return copy.sort((a, b) => b.price - a.price);
    default:
      return copy.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }
}
