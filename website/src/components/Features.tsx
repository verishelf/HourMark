"use client";

import { motion } from "framer-motion";

const FEATURES = [
  {
    title: "Discover",
    description:
      "Editorial hero carousel, featured watches, new arrivals, and rare collections from verified sellers.",
  },
  {
    title: "Search",
    description:
      "Real-time search with brand filters for Rolex, AP, Patek Philippe, Cartier, Omega, and Richard Mille.",
  },
  {
    title: "Sell",
    description:
      "Upload multiple photos, add reference numbers and condition, preview your listing, and publish instantly.",
  },
  {
    title: "Message",
    description:
      "Real-time buyer–seller chat with read receipts and a minimal, trust-focused interface.",
  },
  {
    title: "Checkout",
    description:
      "Stripe Connect payments with Apple Pay, automatic 3% platform commission, and seller payouts.",
  },
  {
    title: "Verify",
    description:
      "Identity verification, authentication badges, seller ratings, and order tracking built in.",
  },
];

export function Features() {
  return (
    <section id="features" className="border-t border-[#1a1a1a] py-32">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-[#71717a]">
            Capabilities
          </p>
          <h2 className="mt-4 max-w-xl text-4xl font-light tracking-tight text-white md:text-5xl">
            Everything collectors need. Nothing they don&apos;t.
          </h2>
        </motion.div>

        <div className="mt-20 grid gap-px bg-[#1a1a1a] md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <motion.article
              key={feature.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="bg-black p-10 transition-colors hover:bg-[#0a0a0a]"
            >
              <h3 className="text-lg font-medium tracking-tight text-white">
                {feature.title}
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-[#a1a1aa]">
                {feature.description}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
