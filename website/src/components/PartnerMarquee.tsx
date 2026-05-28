import { LogoMarquee, type LogoMarqueeItem } from "@/components/LogoMarquee";

const PARTNER_LOGOS: LogoMarqueeItem[] = [
  { name: "Stripe", src: "/logos/partners/stripe-wordmark.svg", width: 132, height: 32 },
  { name: "Apple", src: "/logos/partners/apple-wordmark.svg", width: 132, height: 32 },
  { name: "Supabase", src: "/logos/partners/supabase-wordmark.svg", width: 152, height: 32 },
  { name: "Expo", src: "/logos/partners/expo-wordmark.svg", width: 132, height: 32 },
];

export function PartnerMarquee() {
  return (
    <section aria-label="Technology partners" className="bg-[#0a0a0a]">
      <p className="px-4 pb-3 pt-6 text-center text-sm font-semibold uppercase tracking-[0.14em] text-white/80 md:text-base">
        On a Secure Trusted Platform
      </p>
      <LogoMarquee
        items={PARTNER_LOGOS}
        direction="right"
        durationSeconds={50}
        className="border-t-0"
        slotClassName="h-6 w-[5.5rem] sm:h-7 sm:w-24 md:h-8 md:w-28"
      />
    </section>
  );
}
