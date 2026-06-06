import { buildCrownlyEmail } from "./layout";

export const BUYER_OUTREACH_SUBJECT =
  "Buy authenticated luxury watches on Crownly — escrow protected";

export const BUYER_OUTREACH_HTML = buildCrownlyEmail({
  pageTitle: "Crownly for Buyers",
  preheader:
    "Discover verified listings, make offers in-app, and checkout with escrow protection.",
  headerTagline: "For Collectors &amp; Buyers",
  headline: "Authenticated watches. Serious sellers. Protected checkout.",
  intro:
    "Crownly is the premium iOS marketplace for collectors who want verified listings, transparent negotiation, and escrow-protected purchases — not unverified classifieds.",
  stats: [
    { value: "Escrow", label: "Protected checkout" },
    { value: "Offers", label: "In-app negotiation" },
    { value: "Passport", label: "Provenance transfer", gold: true },
  ],
  sectionLabel: "Why buy on Crownly",
  sectionTitle: "Collect with confidence.",
  benefits: [
    {
      title: "Verified sellers",
      body: "KYC, trust scores, AI-assisted listing review, and badges earned from completed sales — so you know who you are buying from.",
    },
    {
      title: "Make an offer",
      body: "Negotiate price in-app with offers, counters, and accept/decline flows — then checkout at the agreed amount.",
    },
    {
      title: "Escrow checkout",
      body: "Pay with Apple Pay, card, or wire. Funds are held during delivery and a buyer inspection window before release to the seller.",
    },
    {
      title: "Authenticity Passport",
      body: "Digital provenance and serial intelligence that transfers to you when the sale completes.",
    },
    {
      title: "Grail Board &amp; alerts",
      body: "Post what you are hunting, save searches, and get notified when a verified listing matches your criteria.",
    },
  ],
  ctaEyebrow: "Coming to iOS",
  ctaTitle: "Be first to browse authenticated pieces.",
  ctaBody:
    "Crownly is launching on the App Store. Join the waitlist for Rolex, Patek Philippe, AP, Cartier, and other verified listings from day one.",
  primaryCta: {
    text: "Join the Waitlist",
    href: "mailto:hello@crownly.art?subject=Crownly%20Buyer%20Waitlist",
  },
  secondaryCta: {
    text: "Explore Crownly",
    href: "https://crownly.art",
  },
  footnote: "Available for iPhone · Free to browse · Escrow on every sale",
});
