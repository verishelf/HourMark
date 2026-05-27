"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function Download() {
  return (
    <section id="download" className="border-t border-[#1a1a1a] py-32">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden border border-[#1a1a1a] bg-[#0a0a0a] px-8 py-20 text-center md:px-16 md:py-28"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.03)_0%,_transparent_70%)]" />

          <div className="relative">
            <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-[#71717a]">
              Coming to iOS
            </p>
            <h2 className="mt-4 text-4xl font-light tracking-tight text-white md:text-6xl">
              HourMark
            </h2>
            <p className="mx-auto mt-6 max-w-md text-[#a1a1aa]">
              Clone the repo, configure Supabase and Stripe, and run the Expo app
              locally. The marketplace your collectors deserve.
            </p>

            <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="https://github.com/verishelf/HourMark"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full max-w-xs bg-white px-8 py-4 text-[10px] font-medium uppercase tracking-[0.2em] text-black transition-opacity hover:opacity-90 sm:w-auto"
              >
                View on GitHub
              </Link>
              <Link
                href="https://github.com/verishelf/HourMark#readme"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full max-w-xs border border-[#1a1a1a] px-8 py-4 text-[10px] font-medium uppercase tracking-[0.2em] text-white transition-colors hover:border-[#333] sm:w-auto"
              >
                Setup Guide
              </Link>
            </div>

            <p className="mt-10 font-mono text-xs text-[#71717a]">
              npm install && cp .env.example .env && npm start
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
