"use client";

import { motion } from "framer-motion";

const FOR_BUYERS = [
  { title: "Verified sellers", detail: "Every seller completes identity verification before listing." },
  { title: "Secure checkout", detail: "Pay safely with Apple Pay and encrypted transactions." },
  { title: "Direct messaging", detail: "Ask questions, negotiate, and build trust before you buy." },
  { title: "Order tracking", detail: "Follow your purchase from payment through delivery." },
];

const FOR_SELLERS = [
  { title: "List in minutes", detail: "Upload photos, add details, and publish your watch instantly." },
  { title: "Low 3% fee", detail: "Keep more of every sale with transparent, competitive pricing." },
  { title: "Fast payouts", detail: "Receive your earnings directly after a successful sale." },
  { title: "Built-in audience", detail: "Reach collectors actively searching for luxury timepieces." },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-[#1a1a1a] py-32">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-[#71717a]">
            How It Works
          </p>
          <h2 className="mt-4 text-4xl font-light tracking-tight text-white md:text-5xl">
            Buy and sell with confidence.
          </h2>
          <p className="mx-auto mt-6 max-w-md text-[#a1a1aa]">
            HourMark connects serious collectors with authenticated listings,
            secure payments, and a marketplace built for luxury watches.
          </p>
        </motion.div>

        <div className="mt-20 grid gap-16 lg:grid-cols-2 lg:gap-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-[#71717a]">
              For Buyers
            </p>
            <div className="mt-8 grid gap-px bg-[#1a1a1a]">
              {FOR_BUYERS.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-black p-6"
                >
                  <p className="font-medium text-white">{item.title}</p>
                  <p className="mt-1 text-xs text-[#71717a]">{item.detail}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-[#71717a]">
              For Sellers
            </p>
            <div className="mt-8 grid gap-px bg-[#1a1a1a]">
              {FOR_SELLERS.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-black p-6"
                >
                  <p className="font-medium text-white">{item.title}</p>
                  <p className="mt-1 text-xs text-[#71717a]">{item.detail}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
