"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CrownlyLogo } from "@/components/CrownlyLogo";

/** Shown on large screens — keep short to avoid overlap */
const DESKTOP_NAV = [
  { href: "https://marketplace.crownly.art", label: "Marketplace", external: true },
  { href: "/stories", label: "Stories" },
  { href: "#features", label: "Features" },
  { href: "#dealers", label: "Dealers" },
] as const;

/** Full sitemap in mobile menu */
const MOBILE_NAV = [
  ...DESKTOP_NAV,
  { href: "#richard-mille", label: "Richard Mille" },
  { href: "#platform", label: "Platform" },
  { href: "#trust", label: "Trust" },
  { href: "#showcase", label: "App" },
  { href: "#community", label: "Community" },
  { href: "#how-it-works", label: "Buy & Sell" },
  { href: "#download", label: "Download" },
] as const;

type NavItem = (typeof MOBILE_NAV)[number];

function NavLink({
  item,
  className,
  onClick,
}: {
  item: NavItem;
  className: string;
  onClick?: () => void;
}) {
  if ("external" in item && item.external) {
    return (
      <a href={item.href} className={className} onClick={onClick}>
        {item.label}
      </a>
    );
  }
  return (
    <Link href={item.href} className={className} onClick={onClick}>
      {item.label}
    </Link>
  );
}

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

  const linkClass =
    "whitespace-nowrap text-xs font-medium uppercase tracking-[0.12em] text-[#a1a1aa] transition-colors hover:text-white";

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled || menuOpen
          ? "border-b border-[#1a1a1a] bg-black/80 backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-5">
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-3 transition-opacity hover:opacity-90"
          onClick={() => setMenuOpen(false)}
        >
          <CrownlyLogo size={44} priority />
          <span className="hidden text-lg font-light tracking-tight text-[#a1a1aa] transition-colors group-hover:text-white xl:inline">
            Curated Timepieces
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-6 lg:flex xl:gap-8">
          {DESKTOP_NAV.map((item) => (
            <NavLink key={item.href} item={item} className={linkClass} />
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-3 lg:ml-0">
          <Link
            href="#download"
            className="hidden border border-[#1a1a1a] bg-white px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.2em] text-black transition-opacity hover:opacity-90 sm:inline-block lg:px-5"
          >
            Get the App
          </Link>

          <button
            type="button"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 border border-[#1a1a1a] lg:hidden"
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
        <nav className="border-t border-[#1a1a1a] bg-black px-6 py-8 lg:hidden">
          <ul className="flex flex-col gap-5">
            {MOBILE_NAV.map((item) => (
              <li key={item.href}>
                <NavLink
                  item={item}
                  className="text-sm font-medium uppercase tracking-[0.15em] text-[#a1a1aa] transition-colors hover:text-white"
                  onClick={() => setMenuOpen(false)}
                />
              </li>
            ))}
            <li className="pt-2">
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
