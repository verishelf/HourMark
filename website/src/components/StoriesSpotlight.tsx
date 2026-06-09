"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const STORY_HIGHLIGHTS = [
  {
    title: "Editorial feed",
    description:
      "Success stories, collector spotlights, deal-room insights, and market commentary — published on crownly.art/stories and in the app.",
  },
  {
    title: "Engagement in-app",
    description:
      "Like, comment, save, and share stories. Follow authors and discover featured carousels on the home feed.",
  },
  {
    title: "Suggested watches",
    description:
      "Stories link to verified listings and related references so readers can move from editorial to authenticated inventory.",
  },
];

export function StoriesSpotlight() {
  return (
    <section id="stories" className="border-t border-[#1a1a1a] py-32">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between"
        >
          <div className="max-w-2xl">
            <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-[#71717a]">
              Crownly Stories
            </p>
            <h2 className="mt-4 text-4xl font-light tracking-tight text-white md:text-5xl">
              Luxury networking &amp; lifestyle.
            </h2>
            <p className="mt-6 text-sm leading-relaxed text-[#a1a1aa]">
              Beyond listings — Crownly Stories covers the culture of collecting: verified sellers,
              market moves, and the watches collectors are talking about.
            </p>
          </div>
          <Link
            href="/stories"
            className="inline-flex shrink-0 border border-[#1a1a1a] px-8 py-4 text-[10px] font-medium uppercase tracking-[0.2em] text-white transition-colors hover:border-[#333]"
          >
            Read Stories
          </Link>
        </motion.div>

        <div className="mt-16 grid gap-px bg-[#1a1a1a] md:grid-cols-3">
          {STORY_HIGHLIGHTS.map((item, i) => (
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
