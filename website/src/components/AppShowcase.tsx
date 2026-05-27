"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const SCREENS = [
  {
    title: "Discover",
    subtitle: "Editorial home experience",
    image:
      "https://images.unsplash.com/photo-1614164185124-ebca9aefcc0e?w=600&q=80",
    accent: "Featured carousel & new arrivals",
  },
  {
    title: "Listing",
    subtitle: "Immersive product detail",
    image:
      "https://images.unsplash.com/photo-1548171916-3f3e5d3c8c0e?w=600&q=80",
    accent: "Gallery, seller profile & Apple Pay checkout",
  },
  {
    title: "Sell",
    subtitle: "List in minutes",
    image:
      "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=600&q=80",
    accent: "Multi-photo upload & preview",
  },
];

export function AppShowcase() {
  return (
    <section id="showcase" className="overflow-hidden border-t border-[#1a1a1a] py-32">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-[#71717a]">
            The App
          </p>
          <h2 className="mt-4 text-4xl font-light tracking-tight text-white md:text-5xl">
            Designed like a private salon.
          </h2>
          <p className="mx-auto mt-6 max-w-md text-[#a1a1aa]">
            A refined experience for browsing rare watches, reviewing listings,
            and managing your collection — wherever you are.
          </p>
        </motion.div>

        <div className="mt-24 grid gap-8 lg:grid-cols-3">
          {SCREENS.map((screen, i) => (
            <motion.div
              key={screen.title}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="group"
            >
              <div className="relative mx-auto aspect-[9/19] w-full max-w-[280px] overflow-hidden border border-[#1a1a1a] bg-[#0a0a0a]">
                <div className="absolute inset-x-0 top-0 z-10 flex justify-center pt-3">
                  <div className="h-1 w-16 rounded-full bg-[#1a1a1a]" />
                </div>
                <Image
                  src={screen.image}
                  alt={screen.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="280px"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/90 to-transparent p-6 pt-24">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#71717a]">
                    {screen.subtitle}
                  </p>
                  <p className="mt-1 text-xl font-light text-white">
                    {screen.title}
                  </p>
                  <p className="mt-2 text-xs text-[#a1a1aa]">{screen.accent}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-24 flex flex-wrap items-center justify-center gap-12 border border-[#1a1a1a] bg-[#0a0a0a] px-8 py-10"
        >
          {["Rolex", "Audemars Piguet", "Patek Philippe", "Cartier", "Omega", "Richard Mille"].map(
            (brand) => (
              <span
                key={brand}
                className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#71717a]"
              >
                {brand}
              </span>
            )
          )}
        </motion.div>
      </div>
    </section>
  );
}
