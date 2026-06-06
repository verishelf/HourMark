import { buildCrownlyEmail } from "./layout";

export const SELLER_LEAD_FOLLOWUP_SUBJECT =
  "Quick follow-up — list your watch on Crownly";

export const SELLER_LEAD_FOLLOWUP_HTML = buildCrownlyEmail({
  pageTitle: "Crownly Seller Follow-up",
  preheader:
    "Follow up with seller leads — 3% fee, verified buyers, and escrow-protected checkout.",
  headerTagline: "Seller Follow-up",
  headline: "Still interested in selling on Crownly?",
  intro:
    "Thanks for your interest in Crownly. We built a premium marketplace for authenticated luxury watch sales — with verified buyers, in-app offers, and escrow-protected payouts when your sale closes.",
  stats: [
    { value: "3%", label: "Platform fee", gold: true },
    { value: "Escrow", label: "Protected checkout" },
    { value: "iOS", label: "Launching soon" },
  ],
  sectionLabel: "What you get",
  sectionTitle: "A better way to sell high-value pieces.",
  benefits: [
    {
      title: "List with proof",
      body: "Serial numbers, box &amp; papers, and rotating video help your listing earn trust before it goes live.",
    },
    {
      title: "Serious buyers only",
      body: "Collectors search, make offers, and checkout in-app — no endless DMs on unverified channels.",
    },
    {
      title: "Get paid securely",
      body: "Stripe Connect payouts after buyer inspection. Funds held in escrow until the deal completes.",
    },
  ],
  ctaEyebrow: "Next step",
  ctaTitle: "Reply and we will help you get started.",
  ctaBody:
    "Tell us what you are looking to sell — brand, reference, and condition — and our team will follow up with onboarding details.",
  primaryCta: {
    text: "Reply to Get Started",
    href: "mailto:hello@crownly.art?subject=Crownly%20Seller%20Follow-up",
  },
  secondaryCta: {
    text: "Visit crownly.art",
    href: "https://crownly.art",
  },
  footnote: "3% platform fee · Verified seller onboarding · iOS App Store launch",
});
