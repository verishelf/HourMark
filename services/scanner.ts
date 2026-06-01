import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { MOCK_LISTINGS } from "@/data/mockListings";
import type { Listing, WatchScanResult } from "@/types";

const REF_PATTERNS: Record<string, { brand: string; model: string; ref: string }> = {
  submariner: { brand: "Rolex", model: "Submariner", ref: "126610LN" },
  daytona: { brand: "Rolex", model: "Daytona", ref: "116500LN" },
  "royal oak": { brand: "Audemars Piguet", model: "Royal Oak", ref: "15500ST" },
  nautilus: { brand: "Patek Philippe", model: "Nautilus", ref: "5711/1A" },
  speedmaster: { brand: "Omega", model: "Speedmaster", ref: "310.30.42.50.01.001" },
};

const EMPTY_SCAN_RESULT: WatchScanResult = {
  brand: null,
  model: null,
  reference_number: null,
  confidence: 0,
  estimated_value_min: null,
  estimated_value_max: null,
  verified_listings_count: 0,
  active_listings: [],
};

export async function scanWatchFromImage(_imageUri: string): Promise<WatchScanResult> {
  // Vision identification is not wired yet — avoid returning fake demo matches.
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.functions.invoke("analyze-listing", {
        body: { imageUri: _imageUri, mode: "watch_scan" },
      });
      if (!error && data && typeof data === "object" && "brand" in data) {
        const brand = (data.brand as string | null) ?? null;
        const model = (data.model as string | null) ?? null;
        const ref = (data.reference_number as string | null) ?? null;
        const listings = await findVerifiedListings(brand, ref);
        const prices = listings.map((l) => l.price).filter(Boolean);
        return {
          brand,
          model,
          reference_number: ref,
          confidence: typeof data.confidence === "number" ? data.confidence : brand ? 0.7 : 0,
          estimated_value_min: prices.length ? Math.min(...prices) : null,
          estimated_value_max: prices.length ? Math.max(...prices) : null,
          verified_listings_count: listings.length,
          active_listings: listings.slice(0, 6),
        };
      }
    } catch {
      // Fall through to empty result until a dedicated scan endpoint ships.
    }
  }

  return { ...EMPTY_SCAN_RESULT };
}

export async function scanWatchFromText(query: string): Promise<WatchScanResult> {
  const q = query.toLowerCase().trim();

  let brand: string | null = null;
  let model: string | null = null;
  let ref: string | null = null;

  for (const [key, info] of Object.entries(REF_PATTERNS)) {
    if (q.includes(key)) {
      brand = info.brand;
      model = info.model;
      ref = info.ref;
      break;
    }
  }

  if (!brand) {
    const refMatch = q.match(/\b(\d{5,6}[a-z]{0,4}|\d{3}\.\d{2}\.\d{2}\.\d{2}\.\d{2}\.\d{3})\b/i);
    if (refMatch) ref = refMatch[1].toUpperCase();
    if (q.includes("rolex")) brand = "Rolex";
    else if (q.includes("patek")) brand = "Patek Philippe";
    else if (q.includes("omega")) brand = "Omega";
    else if (q.includes("audemars") || q.includes("ap")) brand = "Audemars Piguet";
  }

  const listings = await findVerifiedListings(brand, ref);
  const prices = listings.map((l) => l.price).filter(Boolean);
  const min = prices.length ? Math.min(...prices) : null;
  const max = prices.length ? Math.max(...prices) : null;

  return {
    brand,
    model,
    reference_number: ref,
    confidence: brand ? 0.85 : 0.4,
    estimated_value_min: min,
    estimated_value_max: max,
    verified_listings_count: listings.length,
    active_listings: listings.slice(0, 6),
  };
}

async function findVerifiedListings(
  brand: string | null,
  ref: string | null
): Promise<Listing[]> {
  if (!isSupabaseConfigured) {
    return MOCK_LISTINGS.filter((l) => {
      if (brand && l.brand !== brand) return false;
      if (ref && l.reference_number !== ref) return false;
      return true;
    });
  }

  let query = supabase
    .from("listings")
    .select("*, seller:users(*)")
    .eq("status", "active")
    .eq("authentication_status", "auto_verified");

  if (brand) query = query.ilike("brand", brand);
  if (ref) query = query.eq("reference_number", ref);

  const { data, error } = await query.order("created_at", { ascending: false }).limit(12);
  if (error) throw error;
  return (data ?? []) as Listing[];
}
