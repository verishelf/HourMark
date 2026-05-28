"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { watchImage } from "@/lib/watchImages";

const SLIDES = [
  {
    imageKey: "blackDial" as const,
    model: "RM 11-03",
    words: ["Flyback", "Chronograph", "Titanium"],
    line: "Engineered for collectors who live at full throttle.",
  },
  {
    imageKey: "metalBand" as const,
    model: "RM 07-01",
    words: ["Automatic", "Ceramic", "Skeleton"],
    line: "Sculptural forms with mechanical soul.",
  },
  {
    imageKey: "greenDial" as const,
    model: "RM 016",
    words: ["Extraflat", "Calibre", "Sport"],
    line: "Ultra-thin profile, uncompromising presence.",
  },
  {
    imageKey: "classic" as const,
    model: "RM 35-02",
    words: ["Carbon TPT", "Nadal", "Limited"],
    line: "Aerospace materials meet haute horlogerie.",
  },
  {
    imageKey: "product" as const,
    model: "RM 67-02",
    words: ["Automatic", "Extraflat", "Racing"],
    line: "Light on the wrist. Heavy on impact.",
  },
  {
    imageKey: "macro" as const,
    model: "RM 72-01",
    words: ["Lifestyle", "In-house", "Chronograph"],
    line: "The icon of modern independent watchmaking.",
  },
] as const;

const INTERVAL_MS = 5500;

export function RichardMilleSlider() {
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const slideSrc = watchImage(slide.imageKey, 1400);

  const goTo = useCallback((next: number) => {
    setIndex((next + SLIDES.length) % SLIDES.length);
  }, []);

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    const timer = window.setInterval(next, INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [next]);

  return (
    <section
      id="richard-mille"
      className="overflow-hidden border-t border-[#1a1a1a] bg-black py-24 md:py-32"
    >
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 flex flex-col gap-6 md:mb-16 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-[#71717a]">
              Featured Maison
            </p>
            <h2 className="mt-4 text-4xl font-light tracking-tight text-white md:text-6xl">
              Richard Mille
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-[#a1a1aa]">
            Explore ultra-luxury listings with the same editorial eye as the
            world&apos;s most sought-after independent marque.
          </p>
        </motion.div>

        <div className="relative aspect-[4/5] overflow-hidden border border-[#1a1a1a] bg-[#0a0a0a] md:aspect-[16/9]">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.model}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7 }}
              className="absolute inset-0"
            >
              <Image
                src={slideSrc}
                alt={`${slide.model} — luxury timepiece`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 1152px"
                priority={index === 0}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-transparent" />
            </motion.div>
          </AnimatePresence>

          <div className="relative z-10 flex h-full flex-col justify-between p-6 md:p-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={`words-${slide.model}`}
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.12 } },
                }}
                className="flex flex-wrap gap-3"
              >
                {slide.words.map((word, wordIndex) => (
                  <motion.span
                    key={word}
                    variants={{
                      hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
                      visible: {
                        opacity: 1,
                        y: 0,
                        filter: "blur(0px)",
                        transition: {
                          delay: wordIndex * 0.12,
                          duration: 0.55,
                          ease: [0.22, 1, 0.36, 1],
                        },
                      },
                    }}
                    className="border border-white/20 bg-black/40 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.22em] text-white backdrop-blur-sm"
                  >
                    {word}
                  </motion.span>
                ))}
              </motion.div>
            </AnimatePresence>

            <div className="mt-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`copy-${slide.model}`}
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                >
                  <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#71717a]">
                    Richard Mille
                  </p>
                  <p className="mt-2 text-5xl font-light tracking-tight text-white md:text-7xl">
                    {slide.model}
                  </p>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.35, duration: 0.5 }}
                    className="mt-4 max-w-md text-sm leading-relaxed text-[#a1a1aa] md:text-base"
                  >
                    {slide.line}
                  </motion.p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <div className="absolute bottom-6 right-6 z-20 flex gap-2 md:bottom-12 md:right-12">
            <button
              type="button"
              onClick={prev}
              aria-label="Previous slide"
              className="flex h-11 w-11 items-center justify-center border border-[#1a1a1a] bg-black/60 text-white backdrop-blur-sm transition-colors hover:border-[#333]"
            >
              ←
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next slide"
              className="flex h-11 w-11 items-center justify-center border border-[#1a1a1a] bg-black/60 text-white backdrop-blur-sm transition-colors hover:border-[#333]"
            >
              →
            </button>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between gap-6">
          <div className="flex gap-2">
            {SLIDES.map((item, slideIndex) => (
              <button
                key={item.model}
                type="button"
                aria-label={`Go to ${item.model}`}
                onClick={() => goTo(slideIndex)}
                className={`h-px transition-all duration-500 ${
                  slideIndex === index
                    ? "w-10 bg-white"
                    : "w-6 bg-[#333] hover:bg-[#555]"
                }`}
              />
            ))}
          </div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#71717a]">
            {String(index + 1).padStart(2, "0")} / {String(SLIDES.length).padStart(2, "0")}
          </p>
        </div>

        <div className="mt-10 grid grid-cols-3 gap-2 md:grid-cols-6 md:gap-3">
          {SLIDES.map((item, thumbIndex) => (
            <button
              key={`thumb-${item.model}`}
              type="button"
              onClick={() => goTo(thumbIndex)}
              aria-label={`View ${item.model}`}
              className={`relative aspect-square overflow-hidden border transition-all ${
                thumbIndex === index
                  ? "border-white"
                  : "border-[#1a1a1a] opacity-50 hover:opacity-80"
              }`}
            >
              <Image
                src={watchImage(item.imageKey, 400)}
                alt={item.model}
                fill
                className="object-cover"
                sizes="120px"
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
