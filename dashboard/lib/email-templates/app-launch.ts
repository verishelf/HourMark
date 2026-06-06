import { buildCrownlyEmail } from "./layout";

export const APP_LAUNCH_SUBJECT =
  "Crownly is coming to the App Store — join the waitlist";

export const APP_LAUNCH_HTML = buildCrownlyEmail({
  pageTitle: "Crownly App Launch",
  preheader:
    "The premium iOS marketplace for authenticated luxury watches is launching soon.",
  headerTagline: "App Store Launch",
  headline: "The luxury watch marketplace, reimagined for iOS.",
  intro:
    "Crownly connects collectors and verified sellers for high-value timepieces — with curated discovery, in-app offers, escrow checkout, Authenticity Passports, and collector tools built in.",
  stats: [
    { value: "iOS", label: "Launching soon", gold: true },
    { value: "Escrow", label: "Every sale" },
    { value: "3%", label: "Seller fee" },
  ],
  sectionLabel: "Built in",
  sectionTitle: "Everything collectors expect.",
  benefits: [
    {
      title: "Discover &amp; search",
      body: "Browse verified listings from Rolex, Patek Philippe, AP, Cartier, Omega, and more — filter by brand, price, and condition.",
    },
    {
      title: "Buy &amp; sell securely",
      body: "Make offers, message in-app, and checkout with Apple Pay, card, or wire — all with escrow protection.",
    },
    {
      title: "Track your collection",
      body: "Portfolio tools, Grail Board want-lists, saved alerts, and Authenticity Passports that transfer on sale.",
    },
  ],
  ctaEyebrow: "Coming soon",
  ctaTitle: "Join the waitlist.",
  ctaBody:
    "Be notified the moment Crownly is available on the App Store. Early members get first access to verified listings and seller onboarding.",
  primaryCta: {
    text: "Join the Waitlist",
    href: "mailto:hello@crownly.art?subject=Crownly%20Waitlist",
  },
  secondaryCta: {
    text: "Explore Crownly",
    href: "https://crownly.art",
  },
  footnote: "Free to browse · Available for iPhone · crownly.art",
});
