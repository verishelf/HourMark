import { LEGAL } from "@/lib/legal";

/** Canonical site config for metadata, sitemap, and structured data. */
export const SITE = {
  name: LEGAL.appName,
  company: LEGAL.companyName,
  url: LEGAL.websiteUrl,
  locale: "en_US",
  defaultTitle: "Crownly — Buy & Sell Authenticated Luxury Watches",
  titleTemplate: "%s | Crownly",
  description:
    "Crownly is the premium iOS marketplace to buy and sell authenticated luxury watches — Rolex, Patek Philippe, Audemars Piguet, and more. Escrow checkout, offers, Authenticity Passports, AI verification, and verified sellers.",
  shortDescription:
    "Premium iOS marketplace for authenticated luxury watches with escrow, offers, and provenance passports.",
  keywords: [
    "luxury watch marketplace",
    "buy luxury watches",
    "sell luxury watches",
    "authenticated watches",
    "pre-owned Rolex",
    "watch collector app",
    "luxury watch app iOS",
    "watch escrow",
    "watch authenticity verification",
    "Patek Philippe marketplace",
    "Audemars Piguet for sale",
    "Richard Mille marketplace",
    "watch provenance",
    "Crownly",
  ],
  supportEmail: LEGAL.supportEmail,
  contactEmail: LEGAL.contactEmail,
  iosBundleId: "com.crownly.app",
  appCategory: "ShoppingApplication",
  ogImage: "/screenshots/discover.png",
  ogImageWidth: 828,
  ogImageHeight: 1792,
  logo: "/crownly-logo.png",
  twitterHandle: "@crownlyapp",
} as const;

export const SITE_ROUTES = [
  { path: "/", changeFrequency: "weekly" as const, priority: 1 },
  { path: "/privacy", changeFrequency: "monthly" as const, priority: 0.3 },
  { path: "/terms", changeFrequency: "monthly" as const, priority: 0.3 },
];
