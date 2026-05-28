"use client";

import Image from "next/image";

export type LogoMarqueeItem = {
  name: string;
  src: string;
  width: number;
  height: number;
  /** Lighten dark/colored PNG marks on black backgrounds */
  monochrome?: boolean;
};

type LogoMarqueeProps = {
  items: readonly LogoMarqueeItem[];
  direction?: "left" | "right";
  durationSeconds?: number;
  className?: string;
  logoHeightClass?: string;
};

export function LogoMarquee({
  items,
  direction = "left",
  durationSeconds = 45,
  className = "",
  logoHeightClass = "h-7 md:h-8",
}: LogoMarqueeProps) {
  const track = [...items, ...items];

  return (
    <div
      className={`overflow-hidden border-y border-[#1a1a1a] py-6 ${className}`}
    >
      <div
        className={`marquee-track flex w-max items-center gap-14 px-8 md:gap-20 ${
          direction === "right" ? "marquee-reverse" : ""
        }`}
        style={{ animationDuration: `${durationSeconds}s` }}
      >
        {track.map((item, index) => (
          <div
            key={`${item.name}-${index}`}
            className="flex shrink-0 items-center opacity-60 transition-opacity hover:opacity-100"
          >
            <Image
              src={item.src}
              alt={item.name}
              width={item.width}
              height={item.height}
              className={`w-auto max-w-none object-contain ${logoHeightClass} ${
                item.monochrome
                  ? "brightness-0 invert"
                  : ""
              }`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
