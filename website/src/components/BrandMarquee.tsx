import { Marquee } from "@/components/Marquee";

const LUXURY_BRANDS = [
  "Rolex",
  "Audemars Piguet",
  "Patek Philippe",
  "Richard Mille",
  "Cartier",
  "Omega",
  "Vacheron Constantin",
  "Jaeger-LeCoultre",
  "IWC",
  "Panerai",
  "Breitling",
  "Tudor",
  "Hublot",
  "A. Lange & Söhne",
] as const;

export function BrandMarquee() {
  return (
    <section aria-label="Luxury watch brands" className="bg-black">
      <Marquee
        items={LUXURY_BRANDS}
        direction="left"
        durationSeconds={50}
        itemClassName="text-[11px] font-medium uppercase tracking-[0.28em] text-[#a1a1aa]"
      />
    </section>
  );
}
