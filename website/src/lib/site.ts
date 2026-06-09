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
    "Crownly is the premium iOS marketplace to buy and sell authenticated luxury watches — Rolex, Patek Philippe, Audemars Piguet, and more. Escrow checkout, Shopify inventory sync for dealers, offers, Authenticity Passports, Crownly Stories, AI verification, and verified sellers.",
  shortDescription:
    "Premium iOS marketplace for authenticated luxury watches with escrow, Shopify sync, offers, and provenance passports.",
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
    "Shopify watch inventory sync",
    "dealer watch marketplace",
    "Crownly Stories",
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
  googleAnalyticsId: "G-XJNZ4HPPG3",
} as const;

export const SITE_ROUTES = [
  { path: "/", changeFrequency: "weekly" as const, priority: 1 },
  { path: "/stories", changeFrequency: "daily" as const, priority: 0.8 },
  { path: "/privacy", changeFrequency: "monthly" as const, priority: 0.3 },
  { path: "/terms", changeFrequency: "monthly" as const, priority: 0.3 },
];
