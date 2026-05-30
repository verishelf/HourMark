export type TrustBadgeId =
  | "verified_seller"
  | "ai_authenticated"
  | "escrow_protected"
  | "full_set"
  | "trusted_seller";

export type FraudFlag =
  | "duplicate_serial"
  | "suspicious_serial"
  | "reused_listing_images"
  | "stock_photo_detected"
  | "manipulated_image"
  | "blurry_serial"
  | "metadata_removed"
  | "suspicious_price"
  | "missing_verification_assets"
  | "high_fraud_risk";

export type VerificationAssetType =
  | "serial"
  | "front"
  | "movement"
  | "box_papers"
  | "video";

export type EscrowOrderStatus =
  | "awaiting_payment"
  | "payment_held"
  | "shipped"
  | "delivered"
  | "inspection_period"
  | "completed"
  | "disputed";

export const TRUST_BADGE_LABELS: Record<TrustBadgeId, string> = {
  verified_seller: "Verified Seller",
  ai_authenticated: "AI Authenticated",
  escrow_protected: "Escrow Protected",
  full_set: "Full Set",
  trusted_seller: "Trusted Seller",
};
