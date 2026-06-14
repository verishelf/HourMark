"use client";

import Link from "next/link";

export function HomeHero() {
  return (
    <section className="relative min-h-[52vh] overflow-hidden border-b border-border md:min-h-[62vh]">
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="absolute inset-0 h-full w-full object-cover"
        aria-hidden
      >
        <source src="/watch.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-black/50" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/65 to-background" />

      <div className="relative z-10 mx-auto flex min-h-[52vh] max-w-[1400px] flex-col items-center justify-center px-4 py-14 text-center md:min-h-[62vh] md:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
          Authenticated luxury watches
        </p>
        <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-white md:text-5xl">
          Find your next grail
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-white/75 md:text-base">
          Browse verified Rolex, Patek Philippe, Audemars Piguet, and more — with AI trust
          scores and escrow checkout.
        </p>
        <Link
          href="/search"
          className="mt-8 inline-block rounded-sm bg-gold px-8 py-3.5 text-sm font-semibold uppercase tracking-wider text-black hover:opacity-90"
        >
          Browse all watches
        </Link>
      </div>
    </section>
  );
}
