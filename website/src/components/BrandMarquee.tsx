import { LogoMarquee, type LogoMarqueeItem } from "@/components/LogoMarquee";

const BRAND_LOGOS: LogoMarqueeItem[] = [
  { name: "Rolex", src: "/logos/brands/rolex.svg", width: 88, height: 32 },
  { name: "Audemars Piguet", src: "/logos/brands/audemars-piguet.svg", width: 168, height: 32 },
  { name: "Patek Philippe", src: "/logos/brands/patek-philippe.svg", width: 156, height: 32 },
  { name: "Richard Mille", src: "/logos/brands/richard-mille.svg", width: 156, height: 32 },
  { name: "Cartier", src: "/logos/brands/cartier.svg", width: 96, height: 32 },
  { name: "Omega", src: "/logos/brands/omega.svg", width: 88, height: 32 },
  {
    name: "Vacheron Constantin",
    src: "/logos/brands/vacheron-constantin.svg",
    width: 210,
    height: 32,
  },
  {
    name: "Jaeger-LeCoultre",
    src: "/logos/brands/jaeger-lecoultre.svg",
    width: 188,
    height: 32,
  },
  { name: "IWC", src: "/logos/brands/iwc.svg", width: 52, height: 32 },
  { name: "Panerai", src: "/logos/brands/panerai.svg", width: 96, height: 32 },
  { name: "Breitling", src: "/logos/brands/breitling.svg", width: 108, height: 32 },
  { name: "Tudor", src: "/logos/brands/tudor.svg", width: 76, height: 32 },
  { name: "Hublot", src: "/logos/brands/hublot.svg", width: 88, height: 32 },
  {
    name: "A. Lange & Söhne",
    src: "/logos/brands/a-lange-sohne.svg",
    width: 168,
    height: 32,
  },
];

export function BrandMarquee() {
  return (
    <section aria-label="Luxury watch brands" className="bg-black">
      <LogoMarquee
        items={BRAND_LOGOS}
        direction="left"
        durationSeconds={50}
        logoHeightClass="h-6 md:h-7"
      />
    </section>
  );
}
