import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
export const DEFAULT_SELLER_FEE_RATE = 0.07;

async function isActiveLaunchPartner(
  supabase: SupabaseClient,
  sellerUserId: string
): Promise<boolean> {
  await supabase.rpc("expire_launch_partners");

  const { data } = await supabase
    .from("dealers")
    .select("id")
    .eq("user_id", sellerUserId)
    .eq("is_launch_partner", true)
    .gt("launch_partner_expires", new Date().toISOString())
    .limit(1)
    .maybeSingle();

  return Boolean(data);
}

export async function getSellerFeeRate(
  supabase: SupabaseClient,
  sellerUserId?: string
): Promise<number> {
  if (sellerUserId && (await isActiveLaunchPartner(supabase, sellerUserId))) {
    return 0;
  }

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
