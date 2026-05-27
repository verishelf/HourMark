export type UserProfile = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  verified: boolean;
  stripe_account_id: string | null;
  seller_rating: number | null;
  created_at: string;
};

export type ListingStatus = "draft" | "active" | "sold" | "archived";

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
  serial_number: string | null;
  status: ListingStatus;
  authenticated: boolean;
  created_at: string;
  seller?: UserProfile;
};

export type Favorite = {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
};

export type Conversation = {
  id: string;
  listing_id: string | null;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  updated_at: string;
  listing?: Listing;
  other_user?: UserProfile;
  last_message?: Message;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string;
  read_at: string | null;
  created_at: string;
};

export type OrderStatus =
  | "pending"
  | "paid"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type Order = {
  id: string;
  buyer_id: string;
  seller_id: string;
  listing_id: string;
  amount: number;
  commission_fee: number;
  status: OrderStatus;
  tracking_number: string | null;
  stripe_payment_intent_id: string | null;
  created_at: string;
  listing?: Listing;
};

export type Transaction = {
  id: string;
  order_id: string;
  amount: number;
  commission_fee: number;
  seller_payout: number;
  stripe_transfer_id: string | null;
  created_at: string;
};

export type SellerVerification = {
  id: string;
  user_id: string;
  status: "pending" | "approved" | "rejected";
  document_url: string | null;
  submitted_at: string;
  reviewed_at: string | null;
};

export type CreateListingInput = {
  brand: string;
  model: string;
  reference_number?: string;
  year?: number;
  condition: string;
  price: number;
  description?: string;
  images: string[];
  serial_number?: string;
};
