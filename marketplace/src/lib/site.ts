import { getSupabaseAnonKey, getSupabaseUrl, isSupabaseConfigured, readEnv } from "@/lib/env";

export const SUPABASE_URL = getSupabaseUrl();
export const SUPABASE_ANON_KEY = getSupabaseAnonKey();
export { isSupabaseConfigured };
export const SITE_URL = readEnv("NEXT_PUBLIC_SITE_URL") || "https://marketplace.crownly.art";
export const MARKETING_URL = "https://crownly.art";

export function resolveImage(uri: string | null | undefined): string | null {
  if (!uri?.trim()) return null;
  const trimmed = uri.trim();
  if (trimmed.startsWith("http")) return trimmed;
  const url = getSupabaseUrl();
  if (url) {
    return `${url.replace(/\/$/, "")}/storage/v1/object/public/listing-images/${trimmed.replace(/^\/+/, "")}`;
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
