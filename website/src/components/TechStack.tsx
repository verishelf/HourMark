"use client";

import { motion } from "framer-motion";

const STACK = [
  { name: "Expo", detail: "React Native · SDK 56" },
  { name: "TypeScript", detail: "End-to-end type safety" },
  { name: "Expo Router", detail: "File-based navigation" },
  { name: "NativeWind", detail: "Tailwind for mobile" },
  { name: "Supabase", detail: "Auth · DB · Realtime" },
  { name: "Stripe Connect", detail: "Marketplace payments" },
  { name: "Reanimated", detail: "Fluid motion" },
  { name: "FlashList", detail: "Performant lists" },
];

export function TechStack() {
  return (
    <section id="tech" className="border-t border-[#1a1a1a] py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-[#71717a]">
              Technology
            </p>
            <h2 className="mt-4 text-4xl font-light tracking-tight text-white md:text-5xl">
              Production-ready from day one.
            </h2>
            <p className="mt-6 leading-relaxed text-[#a1a1aa]">
              HourMark is built with a scalable architecture — modular services,
              Supabase schema for users and listings, Stripe Connect for
              marketplace payouts, and a 3% platform commission on every
              transaction.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-[#71717a]">
              <li>Email, Apple, and Google authentication</li>
              <li>Real-time messaging with read receipts</li>
              <li>Demo mode with mock listings for development</li>
              <li>Supabase storage for listing images</li>
            </ul>
          </motion.div>

          <div className="grid grid-cols-2 gap-px bg-[#1a1a1a]">
            {STACK.map((item, i) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="bg-black p-6"
              >
                <p className="font-medium text-white">{item.name}</p>
                <p className="mt-1 text-xs text-[#71717a]">{item.detail}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
