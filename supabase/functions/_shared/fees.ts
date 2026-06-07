import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
export const DEFAULT_SELLER_FEE_RATE = 0.07;

export async function getSellerFeeRate(supabase: SupabaseClient): Promise<number> {
  const { data } = await supabase
    .from("platform_settings")
    .select("seller_fee_percentage")
    .limit(1)
    .maybeSingle();

  const pct = data?.seller_fee_percentage;
  if (pct != null && Number.isFinite(Number(pct))) {
    return Number(pct) / 100;
  }

  return DEFAULT_SELLER_FEE_RATE;
}

export function calculateSellerListingFee(amountCents: number, rate: number): number {
  return Math.round(amountCents * rate);
}
