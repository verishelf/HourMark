import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { KycStatus } from "@/types";

export type SubmitKycResult = {
  submissionId?: string;
  status: KycStatus;
  verified: boolean;
};

export async function submitKyc(input: {
  idDocumentPath: string;
  selfiePath: string;
  phoneNumber: string;
  provider?: "persona" | "onfido";
}): Promise<SubmitKycResult> {
  if (!isSupabaseConfigured) {
    return { status: "approved", verified: true };
  }

  const { data, error } = await supabase.functions.invoke("submit-kyc", {
    body: input,
  });

  if (error) throw new Error(error.message);
  if (data?.message) throw new Error(data.message);
  return data as SubmitKycResult;
}

export function isSellerKycApproved(profile: {
  kyc_status?: KycStatus;
  is_verified_seller?: boolean;
  verified?: boolean;
} | null): boolean {
  if (!profile) return false;
  if (profile.kyc_status === "approved") return true;
  // Grandfather Stripe-verified sellers until they complete Persona/Onfido KYC
  return Boolean(profile.verified);
}
