import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  title: "HourMark — Luxury Watch Marketplace",
  description:
    "Buy and sell authenticated luxury timepieces with Apple Pay checkout and Stripe Connect seller payouts. A premium marketplace for Rolex, Patek Philippe, Audemars Piguet, and more.",
  openGraph: {
    title: "HourMark — Luxury Watch Marketplace",
    description:
      "The premium iOS marketplace for curated luxury watches. Secure checkout, verified sellers, and a 3% platform fee.",
    type: "website",
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
