"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const NAV = [
  { href: "#richard-mille", label: "Richard Mille" },
  { href: "#features", label: "Features" },
  { href: "#showcase", label: "App" },
  { href: "#how-it-works", label: "Buy & Sell" },
  { href: "#download", label: "Download" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled || menuOpen
          ? "border-b border-[#1a1a1a] bg-black/80 backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="group flex flex-col" onClick={() => setMenuOpen(false)}>
          <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#a1a1aa]">
            HourMark
          </span>
          <span className="text-lg font-light tracking-tight text-white transition-opacity group-hover:opacity-80">
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

        <div className="flex items-center gap-3">
          <Link
            href="#download"
            className="hidden border border-[#1a1a1a] bg-white px-5 py-2.5 text-[10px] font-medium uppercase tracking-[0.2em] text-black transition-opacity hover:opacity-90 sm:inline-block"
          >
            Get the App
          </Link>

          <button
            type="button"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 border border-[#1a1a1a] md:hidden"
          >
            <span
              className={`block h-px w-4 bg-white transition-transform ${
                menuOpen ? "translate-y-[3.5px] rotate-45" : ""
              }`}
            />
            <span
              className={`block h-px w-4 bg-white transition-opacity ${
                menuOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block h-px w-4 bg-white transition-transform ${
                menuOpen ? "-translate-y-[3.5px] -rotate-45" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {menuOpen ? (
        <nav className="border-t border-[#1a1a1a] bg-black px-6 py-8 md:hidden">
          <ul className="flex flex-col gap-6">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="text-sm font-medium uppercase tracking-[0.15em] text-[#a1a1aa] transition-colors hover:text-white"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="#download"
                onClick={() => setMenuOpen(false)}
                className="inline-block bg-white px-6 py-3 text-[10px] font-medium uppercase tracking-[0.2em] text-black"
              >
                Get the App
              </Link>
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
