import type { Ionicons } from "@expo/vector-icons";
import {
  RICHARD_MILLE_ASSURANCE_IMAGE,
  TRUST_ASSURANCE_IMAGES,
} from "@/constants/homeImages";

export type TrustAssuranceColumn = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  points: readonly string[];
};

export type TrustAssuranceCard = {
  id: string;
  title: string;
  subtitle: string;
  imageUri: string;
  columns: readonly [TrustAssuranceColumn, TrustAssuranceColumn];
};

export const TRUST_ASSURANCE_CARDS: TrustAssuranceCard[] = [
  {
    id: "buyer-seller",
    title: "Buyer & Seller Assurance",
    subtitle: "Protected transactions for collectors and dealers",
    imageUri: RICHARD_MILLE_ASSURANCE_IMAGE,
    columns: [
      {
        label: "Buyers",
        icon: "shield-checkmark-outline",
        points: [
          "Escrow holds funds until delivery",
          "3-day inspection window",
          "AI-verified listings",
        ],
      },
      {
        label: "Sellers",
        icon: "ribbon-outline",
        points: [
          "Identity-verified seller badge",
          "Secure Stripe Connect payouts",
          "Serial checks & trust scoring",
        ],
      },
    ],
  },
  {
    id: "ai-auth",
    title: "AI Authentication",
    subtitle: "Every listing analyzed before it reaches the marketplace",
    imageUri: TRUST_ASSURANCE_IMAGES.aiAuth,
    columns: [
      {
        label: "Visual scan",
        icon: "scan-outline",
        points: [
          "Dial & case image matching",
          "Reference cross-validation",
          "Counterfeit signal detection",
        ],
      },
      {
        label: "Trust score",
        icon: "analytics-outline",
        points: [
          "Automated risk scoring",
          "Manual review for edge cases",
          "Badge on verified listings",
        ],
      },
    ],
  },
  {
    id: "escrow",
    title: "Escrow Protection",
    subtitle: "Funds stay secure until you approve the watch",
    imageUri: TRUST_ASSURANCE_IMAGES.escrow,
    columns: [
      {
        label: "Buyers",
        icon: "lock-closed-outline",
        points: [
          "Payment held in escrow",
          "3-day inspection period",
          "Dispute resolution support",
        ],
      },
      {
        label: "Sellers",
        icon: "wallet-outline",
        points: [
          "Payout after buyer approval",
          "Stripe Connect transfers",
          "Chargeback protection",
        ],
      },
    ],
  },
  {
    id: "passport",
    title: "Authenticity Passport",
    subtitle: "Digital provenance and serial intelligence",
    imageUri: TRUST_ASSURANCE_IMAGES.passport,
    columns: [
      {
        label: "Registry",
        icon: "document-text-outline",
        points: [
          "Serial number lookup",
          "Crownly verification record",
          "QR passport on listing",
        ],
      },
      {
        label: "Provenance",
        icon: "git-branch-outline",
        points: [
          "Ownership chain tracking",
          "Service history support",
          "Collection portfolio sync",
        ],
      },
    ],
  },
  {
    id: "verified-seller",
    title: "Verified Seller Program",
    subtitle: "KYC-verified identity for trusted dealers & collectors",
    imageUri: TRUST_ASSURANCE_IMAGES.verifiedSeller,
    columns: [
      {
        label: "Identity",
        icon: "person-circle-outline",
        points: [
          "Government ID verification",
          "Selfie face match",
          "Phone number confirmed",
        ],
      },
      {
        label: "Badge",
        icon: "ribbon-outline",
        points: [
          "Verified seller on profile",
          "Higher trust score weight",
          "Priority in discovery",
        ],
      },
    ],
  },
  {
    id: "secure-pay",
    title: "Secure Payments",
    subtitle: "Bank-grade checkout built for high-value timepieces",
    imageUri: TRUST_ASSURANCE_IMAGES.securePay,
    columns: [
      {
        label: "Checkout",
        icon: "card-outline",
        points: [
          "Encrypted Stripe payments",
          "Apple Pay supported",
          "Fraud monitoring",
        ],
      },
      {
        label: "Protection",
        icon: "umbrella-outline",
        points: [
          "Buyer purchase protection",
          "Seller payout guarantees",
          "PCI-compliant processing",
        ],
      },
    ],
  },
];
