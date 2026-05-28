"use client";

import Image from "next/image";

export type LogoMarqueeItem = {
  name: string;
  src: string;
  width: number;
  height: number;
  /** Lighten dark/colored PNG marks on black backgrounds */
  monochrome?: boolean;
  /** Override default marquee slot (wide wordmarks need more width) */
  slotClassName?: string;
};

type LogoMarqueeProps = {
  items: readonly LogoMarqueeItem[];
  direction?: "left" | "right";
  durationSeconds?: number;
  className?: string;
  /** Bounding box each logo scales to fit (height + max width) */
  slotClassName?: string;
};

export function LogoMarquee({
  items,
  direction = "left",
  durationSeconds = 45,
  className = "",
  slotClassName = "h-7 w-24 md:h-8 md:w-28",
}: LogoMarqueeProps) {
  const track = [...items, ...items];

  return (
    <div
      className={`overflow-hidden border-y border-[#1a1a1a] py-7 ${className}`}
    >
      <div
        className={`marquee-track flex w-max items-center gap-12 px-8 md:gap-16 ${
          direction === "right" ? "marquee-reverse" : ""
        }`}
        style={{ animationDuration: `${durationSeconds}s` }}
      >
        {track.map((item, index) => (
          <div
            key={`${item.name}-${index}`}
            className={`flex shrink-0 items-center justify-center ${
              item.slotClassName ?? slotClassName
            }`}
          >
            <Image
              src={item.src}
              alt={item.name}
              width={item.width}
              height={item.height}
              className={`max-h-full max-w-full object-contain object-center ${
                item.monochrome ? "brightness-0 invert" : ""
              }`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
