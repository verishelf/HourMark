import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://crownly.app"),
  title: "Crownly — Luxury Watch Marketplace",
  description:
    "Buy and sell authenticated luxury timepieces with Apple Pay checkout and Stripe Connect seller payouts. A premium marketplace for Rolex, Patek Philippe, Audemars Piguet, and more.",
  icons: {
    icon: [{ url: "/favicon.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "Crownly — Luxury Watch Marketplace",
    description:
      "The premium iOS marketplace for curated luxury watches. Secure checkout, verified sellers, and a 3% platform fee.",
    type: "website",
    images: [{ url: "/crownly-logo.png", width: 500, height: 500, alt: "Crownly" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geist.variable} antialiased`}>{children}</body>
    </html>
  );
}
