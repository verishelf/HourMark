import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { MarketplaceHeader } from "@/components/MarketplaceHeader";
import { MarketplaceFooter } from "@/components/MarketplaceFooter";
import { getCurrentUser } from "@/lib/auth";
import { SITE_URL } from "@/lib/site";
import { themeInitScript } from "@/lib/theme";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: {
    default: "Crownly — Luxury Watch Marketplace",
    template: "%s | Crownly Marketplace",
  },
  description: "Buy and sell authenticated luxury watches. Chrono24-style browsing with Crownly trust verification.",
  metadataBase: new URL(SITE_URL),
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${geist.variable} min-h-screen bg-background text-foreground antialiased`}>
        <MarketplaceHeader user={user} />
        {children}
        <MarketplaceFooter />
      </body>
    </html>
  );
}
