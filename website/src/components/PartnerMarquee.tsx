import { LogoMarquee, type LogoMarqueeItem } from "@/components/LogoMarquee";

const PARTNER_LOGOS: LogoMarqueeItem[] = [
  { name: "Stripe", src: "/logos/partners/stripe.svg", width: 80, height: 28 },
  {
    name: "Stripe Connect",
    src: "/logos/partners/stripe-connect.svg",
    width: 148,
    height: 28,
  },
  { name: "Apple Pay", src: "/logos/partners/apple-pay.svg", width: 120, height: 28 },
  { name: "Supabase", src: "/logos/partners/supabase.svg", width: 80, height: 28 },
  { name: "Expo", src: "/logos/partners/expo.svg", width: 80, height: 28 },
];

export function PartnerMarquee() {
  return (
    <section aria-label="Technology partners" className="bg-[#0a0a0a]">
      <LogoMarquee
        items={PARTNER_LOGOS}
        direction="right"
        durationSeconds={55}
        className="border-t-0"
        slotClassName="h-6 w-20 md:h-7 md:w-24"
      />
    </section>
  );
}
