"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { EmailSignupForm } from "@/components/EmailSignupForm";

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
              Start buying &amp; selling
            </h2>
            <p className="mx-auto mt-6 max-w-md text-[#a1a1aa]">
              Crownly is launching soon on the App Store. Discover authenticated listings,
              negotiate with offers, track your collection, and checkout with Apple Pay
              or wire — all from your iPhone.
            </p>

            <EmailSignupForm source="website_waitlist" buttonLabel="Join the Waitlist" />

            <div className="mt-6 flex justify-center">
              <Link
                href="#how-it-works"
                className="border border-[#1a1a1a] px-8 py-4 text-[10px] font-medium uppercase tracking-[0.2em] text-white transition-colors hover:border-[#333]"
              >
                Learn More
              </Link>
            </div>

            <p className="mt-10 text-xs text-[#71717a]">
              Available for iPhone · Free to browse · 3% platform fee on sales
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
