import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { StructuredData } from "@/components/StructuredData";
import {
  organizationJsonLd,
  rootMetadata,
  webSiteJsonLd,
} from "@/lib/seo";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = rootMetadata;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="llms-txt" href="/llms.txt" />
      </head>
      <body className={`${geist.variable} antialiased`}>
        <GoogleAnalytics />
        <StructuredData data={[organizationJsonLd(), webSiteJsonLd()]} />
        {children}
      </body>
    </html>
  );
}
