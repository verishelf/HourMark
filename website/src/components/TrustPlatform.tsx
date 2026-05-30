"use client";

import { motion } from "framer-motion";

const PILLARS = [
  {
    title: "Automated KYC",
    description:
      "Government ID, selfie face-match, and phone verification via Persona or Onfido. Approved sellers earn the Verified Seller badge instantly.",
  },
  {
    title: "AI Watch Authentication",
    description:
      "Serial OCR, movement and papers imagery, rotating video, perceptual hashing, and fraud scoring auto-approve trusted listings or route edge cases to review.",
  },
  {
    title: "Escrow Protection",
    description:
      "Stripe Connect manual capture holds buyer funds until delivery, a 3-day inspection window, and automated seller payout release.",
  },
  {
    title: "Serial Intelligence",
    description:
      "Hashed serial registry blocks duplicate and cross-account serial reuse while flagging suspicious patterns.",
  },
  {
    title: "Fraud Monitoring",
    description:
      "Device signals, listing velocity, pricing anomalies, and rejection history feed account trust scores and automated throttling.",
  },
  {
    title: "Trust Badges",
    description:
      "Verified Seller, AI Authenticated, Escrow Protected, Full Set, and Trusted Seller badges update dynamically from live trust data.",
  },
];

export function TrustPlatform() {
  return (
    <section id="trust" className="border-t border-[#1a1a1a] bg-black py-32">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-[#71717a]">
            Trust & Safety
          </p>
          <h2 className="mt-4 max-w-2xl text-4xl font-light tracking-tight text-white md:text-5xl">
            Automated authentication buyers can trust.
          </h2>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-[#a1a1aa]">
            HourMark combines AI listing verification, seller KYC, serial intelligence, and
            escrow-backed checkout — so collectors trade with confidence, not guesswork.
          </p>
        </motion.div>

        <div className="mt-20 grid gap-px bg-[#1a1a1a] md:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((item, i) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="bg-[#050505] p-10 transition-colors hover:bg-[#0a0a0a]"
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
