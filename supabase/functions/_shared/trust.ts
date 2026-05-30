/** Server-side trust, fraud, and listing authentication engine */

export type FraudFlag =
  | "duplicate_serial"
  | "suspicious_serial"
  | "reused_listing_images"
  | "stock_photo_detected"
  | "manipulated_image"
  | "blurry_serial"
  | "metadata_removed"
  | "suspicious_price"
  | "missing_verification_assets"
  | "high_fraud_risk";

export type AuthStatus =
  | "pending"
  | "analyzing"
  | "auto_verified"
  | "manual_review"
  | "rejected";

export type ListingAsset = {
  asset_type: string;
  storage_path: string;
  phash?: string | null;
  exif_json?: Record<string, unknown> | null;
  flags?: string[] | null;
};

export type ListingInput = {
  brand: string;
  price: number;
  serial_number?: string | null;
  images?: string[];
  seller_id: string;
};

const AUTO_APPROVE = 80;
const MANUAL_REVIEW = 55;

const BRAND_MIN_PRICE_CENTS: Record<string, number> = {
  Rolex: 300000,
  "Audemars Piguet": 800000,
  "Patek Philippe": 1000000,
  Cartier: 150000,
  Omega: 50000,
  "Richard Mille": 1500000,
};

export function normalizeSerial(serial: string): string {
  return serial.replace(/[\s\-_.]/g, "").toUpperCase();
}

export async function hashSerial(serial: string): Promise<string> {
  const data = new TextEncoder().encode(normalizeSerial(serial));
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function isSuspiciousSerial(serial: string): boolean {
  const n = normalizeSerial(serial);
  if (n.length < 4 || n.length > 20) return true;
  if (/^(.)\1{5,}$/.test(n)) return true;
  if (/^(TEST|FAKE|0000|1234)/i.test(n)) return true;
  return false;
}

export function validateSerialFormat(brand: string, serial: string): boolean {
  const n = normalizeSerial(serial);
  if (!n || n.length < 4) return false;
  if (brand === "Rolex" && !/^[A-Z0-9]{6,8}$/.test(n)) return false;
  return true;
}

export function extractSerialFromText(text: string): string | null {
  const match = text.match(/[A-Z0-9]{5,12}/i);
  return match ? normalizeSerial(match[0]) : null;
}

export function analyzeListingImages(
  assets: ListingAsset[],
  listingImages: string[]
): { flags: FraudFlag[]; confidence: number; phashCollisions: number } {
  const flags: FraudFlag[] = [];
  let confidence = 0.55;
  const required = ["serial", "front", "movement", "box_papers", "video"];
  const present = new Set(assets.map((a) => a.asset_type));
  for (const r of required) {
    if (!present.has(r)) flags.push("missing_verification_assets");
  }

  const phashes = assets.map((a) => a.phash).filter(Boolean) as string[];
  const uniquePhash = new Set(phashes);
  if (phashes.length > 1 && uniquePhash.size < phashes.length) {
    flags.push("reused_listing_images");
    confidence -= 0.15;
  }

  for (const asset of assets) {
    const assetFlags = (asset.flags ?? []) as string[];
    if (assetFlags.includes("stock_photo_detected")) flags.push("stock_photo_detected");
    if (assetFlags.includes("manipulated_image")) flags.push("manipulated_image");
    if (assetFlags.includes("blurry_serial")) flags.push("blurry_serial");
    if (assetFlags.includes("metadata_removed")) flags.push("metadata_removed");
    const exif = asset.exif_json ?? {};
    if (Object.keys(exif).length === 0 && asset.asset_type !== "video") {
      flags.push("metadata_removed");
    }
  }

  if (listingImages.length < 2) {
    flags.push("stock_photo_detected");
    confidence -= 0.1;
  }

  if (flags.length === 0) confidence = 0.88;
  else if (!flags.includes("missing_verification_assets")) confidence = 0.72;

  return {
    flags: [...new Set(flags)],
    confidence,
    phashCollisions: phashes.length - uniquePhash.size,
  };
}

export function calculateFraudRisk(input: {
  flags: FraudFlag[];
  duplicateSerial: boolean;
  rejectedListingCount: number;
  accountTrustScore: number;
  listingSpamCount24h: number;
}): number {
  let risk = Math.max(0, 100 - input.accountTrustScore);
  if (input.duplicateSerial) risk += 40;
  if (input.flags.includes("suspicious_price")) risk += 25;
  if (input.flags.includes("stock_photo_detected")) risk += 20;
  if (input.flags.includes("manipulated_image")) risk += 30;
  if (input.rejectedListingCount >= 3) risk += 15;
  if (input.listingSpamCount24h >= 5) risk += 20;
  return Math.min(100, Math.max(0, risk));
}

export function automatedTrustScore(input: {
  assetConfidence: number;
  serialValid: boolean;
  hasAllAssets: boolean;
  fraudRisk: number;
  flagCount: number;
}): number {
  let score = Math.round(input.assetConfidence * 100);
  if (input.serialValid) score += 12;
  if (input.hasAllAssets) score += 10;
  score -= Math.round(input.fraudRisk * 0.35);
  score -= input.flagCount * 4;
  return Math.min(100, Math.max(0, score));
}

export function resolveAuthStatus(
  trustScore: number,
  fraudRisk: number,
  flags: FraudFlag[]
): AuthStatus {
  if (fraudRisk >= 75 || flags.includes("duplicate_serial")) return "rejected";
  if (trustScore >= AUTO_APPROVE && fraudRisk < 40) return "auto_verified";
  if (trustScore >= MANUAL_REVIEW) return "manual_review";
  if (trustScore < 40 || fraudRisk >= 60) return "rejected";
  return "manual_review";
}

export async function detectDuplicateSerials(
  supabase: {
    from: (table: string) => {
      select: (cols: string) => {
        eq: (
          col: string,
          val: string
        ) => {
          neq: (col: string, val: string) => { maybeSingle: () => Promise<{ data: unknown }> };
          maybeSingle: () => Promise<{ data: unknown }>;
        };
      };
    };
  },
  serialHash: string,
  listingId: string,
  sellerId: string
): Promise<{ duplicate: boolean; crossAccount: boolean }> {
  const { data: existing } = await supabase
    .from("serial_registry")
    .select("id, seller_id, listing_id")
    .eq("serial_hash", serialHash)
    .maybeSingle();

  if (!existing) return { duplicate: false, crossAccount: false };

  const row = existing as { seller_id: string; listing_id: string | null };
  if (row.listing_id === listingId) return { duplicate: false, crossAccount: false };
  return {
    duplicate: true,
    crossAccount: row.seller_id !== sellerId,
  };
}

export function isSuspiciousPrice(brand: string, priceCents: number): boolean {
  const min = BRAND_MIN_PRICE_CENTS[brand];
  if (!min) return priceCents < 10000;
  return priceCents < min * 0.35;
}

export function buildTrustBadges(input: {
  sellerVerified: boolean;
  authStatus: AuthStatus;
  trustScore: number;
  hasBoxPapers: boolean;
  accountTrustScore: number;
}): string[] {
  const badges = ["escrow_protected"];
  if (input.sellerVerified) badges.push("verified_seller");
  if (input.authStatus === "auto_verified" && input.trustScore >= 70) {
    badges.push("ai_authenticated");
  }
  if (input.hasBoxPapers) badges.push("full_set");
  if (input.accountTrustScore >= 85) badges.push("trusted_seller");
  return badges;
}

/** Simple perceptual fingerprint from path + size metadata */
export function computePhash(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return `ph${Math.abs(h).toString(16)}`;
}
