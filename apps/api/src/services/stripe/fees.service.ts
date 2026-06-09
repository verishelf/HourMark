import { getSupabaseAdmin } from "../../lib/supabase.js";

/** Default listing seller fee (7%). */
export const DEFAULT_SELLER_FEE_RATE = 0.07;

async function isActiveLaunchPartner(sellerUserId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
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

export async function getSellerFeeRate(sellerUserId?: string): Promise<number> {
  if (sellerUserId && (await isActiveLaunchPartner(sellerUserId))) {
    return 0;
  }

  const supabase = getSupabaseAdmin();
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

export const feesService = {
  getSellerFeeRate,
  calculateSellerListingFee,
  DEFAULT_SELLER_FEE_RATE,
};
