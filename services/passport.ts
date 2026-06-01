import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { AuthenticityPassport, Listing } from "@/types";

const MOCK_PASSPORTS: AuthenticityPassport[] = [];

function generatePassportCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "CRN-";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createPassportForListing(listing: Listing): Promise<AuthenticityPassport> {
  const passport: AuthenticityPassport = {
    id: `passport-${Date.now()}`,
    listing_id: listing.id,
    serial_number: listing.extracted_serial_number ?? listing.serial_number,
    brand: listing.brand,
    model: listing.model,
    reference_number: listing.reference_number,
    trust_score: listing.ai_trust_score ?? null,
    verification_data: {
      fraud_flags: listing.fraud_flags ?? [],
      trust_badges: listing.trust_badges ?? [],
      verification_confidence: listing.verification_confidence,
    },
    passport_code: generatePassportCode(),
    owner_id: listing.seller_id,
    status: "active",
    verified_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  if (!isSupabaseConfigured) {
    MOCK_PASSPORTS.push(passport);
    return passport;
  }

  const { data, error } = await supabase
    .from("authenticity_passports")
    .insert({
      listing_id: listing.id,
      serial_number: passport.serial_number,
      brand: listing.brand,
      model: listing.model,
      reference_number: listing.reference_number,
      trust_score: listing.ai_trust_score,
      verification_data: passport.verification_data,
      passport_code: passport.passport_code,
      owner_id: listing.seller_id,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as AuthenticityPassport;
}

export async function getPassportByCode(code: string): Promise<AuthenticityPassport | null> {
  if (!isSupabaseConfigured) {
    return MOCK_PASSPORTS.find((p) => p.passport_code === code) ?? null;
  }

  const { data, error } = await supabase
    .from("authenticity_passports")
    .select("*")
    .eq("passport_code", code.toUpperCase())
    .maybeSingle();
  if (error) throw error;
  return data as AuthenticityPassport | null;
}

export async function getPassportForListing(listingId: string): Promise<AuthenticityPassport | null> {
  if (!isSupabaseConfigured) {
    return MOCK_PASSPORTS.find((p) => p.listing_id === listingId) ?? null;
  }

  const { data, error } = await supabase
    .from("authenticity_passports")
    .select("*")
    .eq("listing_id", listingId)
    .eq("status", "active")
    .maybeSingle();
  if (error) throw error;
  return data as AuthenticityPassport | null;
}

export async function transferPassportToBuyer(
  listingId: string,
  buyerId: string
): Promise<void> {
  if (!isSupabaseConfigured) {
    const p = MOCK_PASSPORTS.find((x) => x.listing_id === listingId);
    if (p) {
      p.owner_id = buyerId;
      p.status = "transferred";
    }
    return;
  }

  await supabase
    .from("authenticity_passports")
    .update({ owner_id: buyerId, status: "transferred" })
    .eq("listing_id", listingId)
    .eq("status", "active");
}

export async function lookupSerial(serial: string): Promise<{
  found: boolean;
  serial_number: string;
  listings_count: number;
  flagged: boolean;
  passport_code: string | null;
  brand: string | null;
  model: string | null;
}> {
  const normalized = serial.trim().toUpperCase();

  if (!isSupabaseConfigured) {
    return {
      found: false,
      serial_number: normalized,
      listings_count: 0,
      flagged: false,
      passport_code: null,
      brand: null,
      model: null,
    };
  }

  const { data: listings } = await supabase
    .from("listings")
    .select("id, brand, model, fraud_flags, authentication_status")
    .or(`serial_number.ilike.${normalized},extracted_serial_number.ilike.${normalized}`);

  const { data: passport } = await supabase
    .from("authenticity_passports")
    .select("passport_code, brand, model, status")
    .eq("serial_number", normalized)
    .eq("status", "active")
    .maybeSingle();

  const rows = listings ?? [];
  const flagged = rows.some(
    (l) =>
      Array.isArray(l.fraud_flags) &&
      (l.fraud_flags as string[]).some((f) => f.includes("duplicate") || f.includes("stolen"))
  );

  return {
    found: rows.length > 0 || Boolean(passport),
    serial_number: normalized,
    listings_count: rows.length,
    flagged,
    passport_code: passport?.passport_code ?? null,
    brand: passport?.brand ?? rows[0]?.brand ?? null,
    model: passport?.model ?? rows[0]?.model ?? null,
  };
}
