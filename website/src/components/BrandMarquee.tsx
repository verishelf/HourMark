import { LogoMarquee } from "@/components/LogoMarquee";
import brandLogos from "@/data/brandLogos.json";

export function BrandMarquee() {
  return (
    <section aria-label="Luxury watch brands" className="bg-black">
      <p className="px-4 pb-3 pt-6 text-center text-sm font-semibold uppercase tracking-[0.18em] text-white/80 md:text-base">
        Authentic Brands
      </p>
      <LogoMarquee
        items={brandLogos}
        direction="left"
        durationSeconds={50}
        slotClassName="h-6 w-[5.5rem] sm:h-7 sm:w-24 md:h-8 md:w-28"
      />
    </section>
  );
}
