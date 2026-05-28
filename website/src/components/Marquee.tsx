"use client";

type MarqueeProps = {
  items: readonly string[];
  direction?: "left" | "right";
  durationSeconds?: number;
  className?: string;
  itemClassName?: string;
  separator?: string;
};

export function Marquee({
  items,
  direction = "left",
  durationSeconds = 45,
  className = "",
  itemClassName = "",
  separator = "·",
}: MarqueeProps) {
  const track = [...items, ...items];

  return (
    <div
      className={`overflow-hidden border-y border-[#1a1a1a] bg-black py-5 ${className}`}
      aria-hidden
    >
      <div
        className={`marquee-track flex w-max items-center gap-12 px-6 ${
          direction === "right" ? "marquee-reverse" : ""
        }`}
        style={{ animationDuration: `${durationSeconds}s` }}
      >
        {track.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className={`flex shrink-0 items-center gap-12 whitespace-nowrap ${itemClassName}`}
          >
            {item}
            <span className="text-[#333]">{separator}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
