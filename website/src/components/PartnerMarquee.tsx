import { Marquee } from "@/components/Marquee";

const PARTNERS = [
  "Stripe",
  "Stripe Connect",
  "Apple Pay",
  "Supabase",
  "Expo",
  "Identity Verified",
  "Destination Charges",
  "Express Payouts",
  "Realtime Chat",
  "3% Platform Fee",
] as const;

export function PartnerMarquee() {
  return (
    <section aria-label="Technology partners" className="bg-[#0a0a0a]">
      <Marquee
        items={PARTNERS}
        direction="right"
        durationSeconds={55}
        className="border-t-0"
        itemClassName="text-[11px] font-medium uppercase tracking-[0.28em] text-[#71717a]"
      />
    </section>
  );
}
