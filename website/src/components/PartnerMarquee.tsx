import { LogoMarquee, type LogoMarqueeItem } from "@/components/LogoMarquee";

const PARTNER_LOGOS: LogoMarqueeItem[] = [
  { name: "Stripe", src: "/logos/partners/stripe-wordmark.svg", width: 198, height: 48 },
  { name: "Apple", src: "/logos/partners/apple-wordmark.svg", width: 198, height: 48 },
  { name: "Supabase", src: "/logos/partners/supabase-wordmark.svg", width: 228, height: 48 },
  { name: "Expo", src: "/logos/partners/expo-wordmark.svg", width: 198, height: 48 },
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
        slotClassName="h-10 w-32 sm:h-11 sm:w-36 md:h-12 md:w-40"
      />
    </section>
  );
}
