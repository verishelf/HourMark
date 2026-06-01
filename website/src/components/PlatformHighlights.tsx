"use client";

import { motion } from "framer-motion";

const HIGHLIGHTS = [
  {
    title: "Make an Offer",
    description:
      "Negotiate in-app with offers, counters, and accept/decline flows — then checkout at the agreed price without leaving Crownly.",
  },
  {
    title: "Authenticity Passport",
    description:
      "Digital provenance certificates for verified watches. Passports transfer to the buyer when a sale completes.",
  },
  {
    title: "Grail Board",
    description:
      "Post what you are hunting — brand, reference, budget, and notes. Sellers get notified when a matching listing goes live.",
  },
  {
    title: "Watch Collection",
    description:
      "Track owned pieces with purchase price, estimated value, and provenance links. Showcase your portfolio on your profile.",
  },
  {
    title: "Watch Scanner",
    description:
      "Identify watches from photos or reference numbers and jump straight to verified Crownly listings and comps.",
  },
  {
    title: "Alerts & Notifications",
    description:
      "Saved-search alerts for AI-verified listings, favorite price drops, offer updates, and shipping milestones — in-app and push.",
  },
];

export function PlatformHighlights() {
  return (
    <section id="platform" className="border-t border-[#1a1a1a] bg-[#050505] py-32">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-[#71717a]">
            Beyond the Listing
          </p>
          <h2 className="mt-4 max-w-2xl text-4xl font-light tracking-tight text-white md:text-5xl">
            Built for serious collectors.
          </h2>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-[#a1a1aa]">
            Crownly goes past browse-and-buy with negotiation, provenance, portfolio tracking,
            grail hunts, and real-time alerts — tools you expect from a modern luxury marketplace.
          </p>
        </motion.div>

        <div className="mt-20 grid gap-px bg-[#1a1a1a] md:grid-cols-2 lg:grid-cols-3">
          {HIGHLIGHTS.map((item, i) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
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
