"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

export function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden pt-28">
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=1920&q=85"
          alt="Luxury watch"
          fill
          priority
          className="object-cover opacity-40"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-7rem)] max-w-6xl flex-col justify-end px-6 pb-24">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-4 text-[10px] font-medium uppercase tracking-[0.25em] text-[#a1a1aa]"
        >
          Luxury Watch Marketplace
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="max-w-3xl text-5xl font-light leading-[1.05] tracking-tight text-white md:text-7xl md:leading-[1.02]"
        >
          Where exceptional
          <br />
          <span className="text-[#a1a1aa]">timepieces</span> find their place.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-8 max-w-lg text-base leading-relaxed text-[#a1a1aa] md:text-lg"
        >
          HourMark is the premium iOS marketplace to buy, sell, and discover
          authenticated luxury watches — with verified sellers, Stripe-powered
          checkout, and automatic seller payouts on every sale.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-12 flex flex-wrap gap-4"
        >
          <Link
            href="#download"
            className="bg-white px-8 py-4 text-[10px] font-medium uppercase tracking-[0.2em] text-black transition-opacity hover:opacity-90"
          >
            Download for iOS
          </Link>
          <Link
            href="#showcase"
            className="border border-[#1a1a1a] px-8 py-4 text-[10px] font-medium uppercase tracking-[0.2em] text-white transition-colors hover:border-[#333]"
          >
            Explore the App
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="mt-20 flex gap-12 border-t border-[#1a1a1a] pt-10"
        >
          {[
            { value: "3%", label: "Platform fee" },
            { value: "Stripe", label: "Connect payouts" },
            { value: "100%", label: "Verified sellers" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-2xl font-light text-white md:text-3xl">
                {stat.value}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-[#71717a]">
                {stat.label}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
