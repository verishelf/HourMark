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
    "Buy and sell authenticated luxury timepieces. A premium marketplace for Rolex, Patek Philippe, Audemars Piguet, and the world's finest watches.",
  openGraph: {
    title: "HourMark — Luxury Watch Marketplace",
    description:
      "The premium iOS marketplace for curated luxury watches. Buy, sell, and connect with verified collectors.",
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
