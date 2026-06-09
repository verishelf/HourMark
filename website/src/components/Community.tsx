"use client";

import { motion } from "framer-motion";

const ITEMS = [
  {
    title: "Collector posts",
    description:
      "Share wrist shots, grail hunts, and reference-tagged photos. Like, comment, and follow collectors you trust.",
  },
  {
    title: "Reference feeds",
    description:
      "Deep pages per reference number — community posts and live listings for the exact watch you are researching.",
  },
  {
    title: "Seller reputation",
    description:
      "Post-transaction reviews, seller ratings, sales counts, and Trusted Seller badges earned from real completed deals.",
  },
  {
    title: "Order protection",
    description:
      "Carrier tracking, a 3-day inspection window, in-app disputes, and wire transfer checkout for high-value pieces.",
  },
  {
    title: "Crownly Stories",
    description:
      "Read editorial spotlights and market insights on the web or in-app — with engagement, saved stories, and links to live listings.",
  },
];

export function Community() {
  return (
    <section id="community" className="border-t border-[#1a1a1a] py-32">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-[#71717a]">
            Community & Protection
          </p>
          <h2 className="mt-4 text-4xl font-light tracking-tight text-white md:text-5xl">
            A private salon, not a classifieds board.
          </h2>
          <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-[#a1a1aa]">
            Follow sellers and collectors, build reputation over time, and close high-value sales
            with structured escrow from offer to payout.
          </p>
        </motion.div>

        <div className="mt-20 grid gap-px bg-[#1a1a1a] md:grid-cols-2">
          {ITEMS.map((item, i) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="bg-black p-10 transition-colors hover:bg-[#0a0a0a]"
            >
              <h3 className="text-lg font-medium tracking-tight text-white">{item.title}</h3>
              <p className="mt-4 text-sm leading-relaxed text-[#a1a1aa]">{item.description}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
