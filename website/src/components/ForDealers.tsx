"use client";

import { motion } from "framer-motion";

const DEALER_FEATURES = [
  {
    title: "Shopify Integration",
    description:
      "Connect your Shopify store from Settings in the Crownly app. OAuth authorization links your catalog — no duplicate data entry.",
  },
  {
    title: "Automatic inventory sync",
    description:
      "Products import with titles, photos, prices, SKUs, and tags. When Shopify inventory hits zero, Crownly marks the listing sold; restocks reactivate listings.",
  },
  {
    title: "Real-time webhooks",
    description:
      "Product create, update, delete, and inventory-level changes flow through secure webhooks so your Crownly storefront stays current.",
  },
  {
    title: "Escrow checkout on every sale",
    description:
      "Imported listings use Crownly checkout with Stripe Connect escrow — same buyer protection and seller payouts as manual listings.",
  },
  {
    title: "7% seller fee",
    description:
      "Transparent platform pricing on escrow-protected sales. Launch partners may qualify for promotional fee rates during onboarding.",
  },
  {
    title: "Seller settings hub",
    description:
      "Profile, business verification, Stripe Connect payouts, Shopify sync, and security — all in one settings menu inside the app.",
  },
];

const SYNC_FLOW = [
  "Connect Shopify in the app",
  "Authorize Crownly via OAuth",
  "Initial watch import runs automatically",
  "Inventory stays in sync via webhooks",
  "Buyers purchase through Crownly escrow",
];

export function ForDealers() {
  return (
    <section id="dealers" className="border-t border-[#1a1a1a] bg-[#050505] py-32">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-[#71717a]">
            For Dealers &amp; Sellers
          </p>
          <h2 className="mt-4 max-w-2xl text-4xl font-light tracking-tight text-white md:text-5xl">
            Sync Shopify inventory to Crownly.
          </h2>
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-[#a1a1aa]">
            Professional dealers and verified sellers can connect Shopify from the Crownly app,
            import watches automatically, and sell through escrow checkout with the same trust
            layer collectors expect — while Crownly ops monitor integrations from the admin back office.
          </p>
        </motion.div>

        <motion.ol
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-12 flex flex-wrap gap-x-8 gap-y-3 border border-[#1a1a1a] bg-black px-6 py-5 md:px-8"
        >
          {SYNC_FLOW.map((step, i) => (
            <li key={step} className="flex items-center gap-3 text-sm text-[#a1a1aa]">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center border border-[#333] text-[10px] font-medium text-white">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </motion.ol>

        <div className="mt-16 grid gap-px bg-[#1a1a1a] md:grid-cols-2 lg:grid-cols-3">
          {DEALER_FEATURES.map((item, i) => (
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
