export type StripeOnboardingStatus =
  | "not_started"
  | "pending"
  | "complete"
  | "restricted";

export type KycStatus = "not_started" | "pending" | "approved" | "rejected";

export type UserProfile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  verified: boolean;
  is_verified_seller?: boolean;
  kyc_status?: KycStatus;
  phone_number?: string | null;
  kyc_provider_id?: string | null;
  account_trust_score?: number;
  fraud_risk_score?: number;
  stripe_account_id: string | null;
  stripe_onboarding_status: StripeOnboardingStatus;
  seller_rating: number | null;
  created_at: string;
};

export type ListingStatus = "draft" | "active" | "sold" | "archived";

export type AuthenticationStatus =
  | "pending"
  | "analyzing"
  | "auto_verified"
  | "manual_review"
  | "rejected";

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
  authentication_status?: AuthenticationStatus;
  ai_trust_score?: number;
  fraud_flags?: string[];
  extracted_serial_number?: string | null;
  verification_confidence?: number;
  trust_badges?: string[];
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
  | "awaiting_payment"
  | "payment_held"
  | "paid"
  | "shipped"
  | "delivered"
  | "inspection_period"
  | "completed"
  | "disputed"
  | "cancelled"
  | "refunded";

export type PaymentMethod = "card" | "apple_pay" | "wire_transfer";

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

export type Order = {
  id: string;
  buyer_id: string;
  seller_id: string;
  listing_id: string;
  amount: number;
  commission_fee: number;
  status: OrderStatus;
  payment_method: PaymentMethod;
  tracking_number: string | null;
  stripe_payment_intent_id: string | null;
  wire_reference: string | null;
  buyer_name: string | null;
  buyer_email: string | null;
  buyer_phone: string | null;
  shipping_address_line1: string | null;
  shipping_address_line2: string | null;
  shipping_city: string | null;
  shipping_state: string | null;
  shipping_postal_code: string | null;
  shipping_country: string | null;
  inspection_ends_at?: string | null;
  delivery_confirmed_at?: string | null;
  funds_released_at?: string | null;
  escrow_status?: "none" | "held" | "released" | "disputed";
  created_at: string;
  listing?: Listing;
};

export type TransactionStatus = "pending" | "completed" | "failed" | "refunded";

export type Transaction = {
  id: string;
  order_id: string;
  amount: number;
  commission_fee: number;
  seller_payout: number;
  stripe_transfer_id: string | null;
  stripe_charge_id: string | null;
  status: TransactionStatus;
  created_at: string;
};

export type Seller = {
  id: string;
  business_name: string | null;
  onboarding_complete: boolean;
  payouts_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type StripeAccount = {
  id: string;
  user_id: string;
  stripe_account_id: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
};

export type SellerVerification = {
  id: string;
  user_id: string;
  status: "pending" | "approved" | "rejected";
  document_url: string | null;
  stripe_account_id: string | null;
  rejection_reason: string | null;
  requirements_due: string[];
  submitted_at: string;
  reviewed_at: string | null;
};

export type VerificationStatus = {
  status: "not_started" | "pending" | "verified" | "action_required";
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  requirementsDue: string[];
  rejectionReason: string | null;
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

export type UserPost = {
  id: string;
  user_id: string;
  caption: string | null;
  image_url: string;
  created_at: string;
  author?: Pick<UserProfile, "username" | "avatar_url">;
};

export type UserPostDetail = UserPost & {
  like_count: number;
  comment_count: number;
  liked_by_me: boolean;
};

export type UserPostComment = {
  id: string;
  post_id: string;
  user_id: string;
  text: string;
  created_at: string;
  author?: Pick<UserProfile, "username" | "avatar_url">;
};

export type CreatePostInput = {
  caption?: string;
  image_url: string;
};

export type UpdatePostInput = {
  caption?: string | null;
  image_url?: string;
};
