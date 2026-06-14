export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://marketplace.crownly.art";
export const MARKETING_URL = "https://crownly.art";
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export function resolveImage(uri: string | null | undefined): string | null {
  if (!uri?.trim()) return null;
  const trimmed = uri.trim();
  if (trimmed.startsWith("http")) return trimmed;
  if (SUPABASE_URL) {
    return `${SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/public/listing-images/${trimmed.replace(/^\/+/, "")}`;
  }
  return trimmed;
}

export function getCoverImage(images?: string[] | null): string | null {
  if (!images?.length) return null;
  for (const raw of images) {
    const resolved = resolveImage(raw);
    if (resolved) return resolved;
  }
  return null;
}
