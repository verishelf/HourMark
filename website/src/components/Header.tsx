"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const NAV = [
  { href: "#features", label: "Features" },
  { href: "#showcase", label: "App" },
  { href: "#how-it-works", label: "Buy & Sell" },
  { href: "#download", label: "Download" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-[#1a1a1a] bg-black/80 backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="group flex flex-col">
          <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#a1a1aa]">
            HourMark
          </span>
          <span className="text-lg font-light tracking-tight text-white group-hover:opacity-80 transition-opacity">
            Curated Timepieces
          </span>
        </Link>

        <nav className="hidden items-center gap-10 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-xs font-medium uppercase tracking-[0.15em] text-[#a1a1aa] transition-colors hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="#download"
          className="border border-[#1a1a1a] bg-white px-5 py-2.5 text-[10px] font-medium uppercase tracking-[0.2em] text-black transition-opacity hover:opacity-90"
        >
          Get the App
        </Link>
      </div>
    </header>
  );
}
