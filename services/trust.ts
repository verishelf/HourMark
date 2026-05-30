import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { AuthenticationStatus } from "@/types";

export type AnalyzeListingResult = {
  trustScore: number;
  fraudRisk: number;
  authenticationStatus: AuthenticationStatus;
  flags: string[];
  badges: string[];
  listingStatus: string;
};

export async function analyzeListing(listingId: string): Promise<AnalyzeListingResult> {
  if (!isSupabaseConfigured) {
    return {
      trustScore: 82,
      fraudRisk: 12,
      authenticationStatus: "auto_verified",
      flags: [],
      badges: ["escrow_protected", "ai_authenticated"],
      listingStatus: "active",
    };
  }

  const { data, error } = await supabase.functions.invoke("analyze-listing", {
    body: { listingId },
  });

  if (error) throw new Error(error.message);
  if (data?.message) throw new Error(data.message);
  return data as AnalyzeListingResult;
}

export async function registerVerificationAsset(
  listingId: string,
  assetType: string,
  storagePath: string,
  mimeType?: string
): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { error } = await supabase.from("listing_verification_assets").insert({
    listing_id: listingId,
    asset_type: assetType,
    storage_path: storagePath,
    mime_type: mimeType ?? null,
    phash: `local_${storagePath.length}_${assetType}`,
  });

  if (error) throw error;
}
