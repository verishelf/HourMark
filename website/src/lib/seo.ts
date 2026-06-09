import type { Metadata } from "next";
import { SITE } from "@/lib/site";

type PageMetadataOptions = {
  title?: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
};

export function buildPageMetadata(options: PageMetadataOptions = {}): Metadata {
  const title = options.title ?? SITE.defaultTitle;
  const description = options.description ?? SITE.description;
  const canonicalPath = options.path ?? "/";
  const url = `${SITE.url}${canonicalPath === "/" ? "" : canonicalPath}`;

  return {
    title,
    description,
    keywords: [...SITE.keywords],
    authors: [{ name: SITE.company, url: SITE.url }],
    creator: SITE.company,
    publisher: SITE.company,
    applicationName: SITE.name,
    category: "shopping",
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      type: "website",
      locale: SITE.locale,
      url,
      siteName: SITE.name,
      title,
      description,
      images: [
        {
          url: SITE.ogImage,
          width: SITE.ogImageWidth,
          height: SITE.ogImageHeight,
          alt: `${SITE.name} — luxury watch marketplace on iOS`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [SITE.ogImage],
      creator: SITE.twitterHandle,
    },
    robots: options.noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
  };
}

export const rootMetadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: SITE.defaultTitle,
    template: SITE.titleTemplate,
  },
  description: SITE.description,
  keywords: [...SITE.keywords],
  authors: [{ name: SITE.company, url: SITE.url }],
  creator: SITE.company,
  publisher: SITE.company,
  applicationName: SITE.name,
  category: "shopping",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [{ url: "/favicon.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: SITE.locale,
    url: SITE.url,
    siteName: SITE.name,
    title: SITE.defaultTitle,
    description: SITE.description,
    images: [
      {
        url: SITE.ogImage,
        width: SITE.ogImageWidth,
        height: SITE.ogImageHeight,
        alt: `${SITE.name} — luxury watch marketplace on iOS`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.defaultTitle,
    description: SITE.shortDescription,
    images: [SITE.ogImage],
    creator: SITE.twitterHandle,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  other: {
    "apple-mobile-web-app-title": SITE.name,
  },
};

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.company,
    legalName: SITE.company,
    url: SITE.url,
    logo: `${SITE.url}${SITE.logo}`,
    email: SITE.contactEmail,
    sameAs: [] as string[],
  };
}

export function webSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    publisher: {
      "@type": "Organization",
      name: SITE.company,
      url: SITE.url,
    },
  };
}

export function softwareApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE.name,
    applicationCategory: SITE.appCategory,
    operatingSystem: "iOS",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description: SITE.description,
    url: SITE.url,
    screenshot: `${SITE.url}${SITE.ogImage}`,
    author: {
      "@type": "Organization",
      name: SITE.company,
    },
  };
}

export function faqPageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

const FAQ_ITEMS = [
  {
    question: "What is Crownly?",
    answer:
      "Crownly is a premium iOS marketplace for buying and selling authenticated luxury watches. Collectors and dealers can browse curated listings, make offers, message sellers, and checkout with Apple Pay, card, or bank wire with escrow protection.",
  },
  {
    question: "How does Crownly verify watches and sellers?",
    answer:
      "Crownly combines seller KYC, AI-assisted listing review, trust scores, verification badges, and optional Authenticity Passports with serial intelligence. High-trust listings can earn auto-verified status before they appear in search and discovery.",
  },
  {
    question: "Which watch brands are supported on Crownly?",
    answer:
      "Crownly supports major luxury brands including Rolex, Patek Philippe, Audemars Piguet, Richard Mille, Cartier, Omega, Tudor, IWC, and other authenticated timepieces listed by verified sellers.",
  },
  {
    question: "How does escrow work on Crownly?",
    answer:
      "Payments are processed through Stripe Connect. Funds are held in escrow during a buyer inspection period before release to the seller, helping protect both parties on high-value transactions.",
  },
  {
    question: "Is Crownly available on Android?",
    answer:
      "Crownly is launching first on iOS via the App Store. Join the waitlist at crownly.art to get notified when downloads are available.",
  },
  {
    question: "Can dealers sync Shopify inventory to Crownly?",
    answer:
      "Yes. Verified sellers connect Shopify from Settings in the Crownly app. Products import automatically with photos, prices, and SKUs. Inventory updates sync via webhooks, and sales checkout through Crownly escrow with a 7% seller fee.",
  },
  {
    question: "What is Crownly Stories?",
    answer:
      "Crownly Stories is editorial content about luxury watch collecting — success stories, spotlights, and market insights — available at crownly.art/stories and inside the app with likes, comments, and links to verified listings.",
  },
] as const;
