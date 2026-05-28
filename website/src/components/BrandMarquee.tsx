import { LogoMarquee } from "@/components/LogoMarquee";
import brandLogos from "@/data/brandLogos.json";

export function BrandMarquee() {
  return (
    <section aria-label="Luxury watch brands" className="bg-black">
      <LogoMarquee
        items={brandLogos}
        direction="left"
        durationSeconds={50}
        logoHeightClass="h-7 md:h-9"
      />
    </section>
  );
}
