import { buildCrownlyEmail } from "./layout";

export const DEALER_PARTNERSHIP_SUBJECT =
  "Partner with Crownly — verified dealer program";

export const DEALER_PARTNERSHIP_HTML = buildCrownlyEmail({
  pageTitle: "Crownly Dealer Program",
  preheader:
    "Invite verified dealers to list on Crownly with Stripe Connect, escrow, and a 3% platform fee.",
  headerTagline: "Dealer Partnership",
  headline: "Reach serious collectors. Close with escrow.",
  intro:
    "Crownly is building a premium dealer network on iOS — for professionals who want authenticated listings, structured checkout, and reputation that compounds with every completed sale.",
  stats: [
    { value: "3%", label: "Platform fee", gold: true },
    { value: "Stripe", label: "Connect payouts" },
    { value: "Escrow", label: "Buyer protection" },
  ],
  sectionLabel: "Dealer benefits",
  sectionTitle: "Built for professional sellers.",
  benefits: [
    {
      title: "Verified dealer profile",
      body: "Earn Trusted Seller badges, review counts, and a profile collectors use to decide who to buy from.",
    },
    {
      title: "Grail Board inbound",
      body: "Get notified when a collector posts a want-list that matches inventory you list or plan to list.",
    },
    {
      title: "Structured high-value checkout",
      body: "Apple Pay, card, and wire for five- and six-figure pieces — with funds held until buyer inspection ends.",
    },
    {
      title: "Low transparent fees",
      body: "3% platform fee on escrow-protected sales. No hidden listing charges.",
    },
  ],
  ctaEyebrow: "Dealer onboarding",
  ctaTitle: "Apply for early dealer access.",
  ctaBody:
    "We are onboarding a limited number of verified dealers before App Store launch. Reply with your business name, brands, and average monthly volume.",
  primaryCta: {
    text: "Apply as a Dealer",
    href: "mailto:hello@crownly.art?subject=Crownly%20Dealer%20Partnership",
  },
  secondaryCta: {
    text: "Learn More",
    href: "https://crownly.art",
  },
  footnote: "Stripe Connect required · KYC verification · iOS marketplace",
});
