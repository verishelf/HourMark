import { isSupabaseConfigured } from "@/lib/supabase";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";

export function getImageContentType(uri: string): { ext: string; contentType: string } {
  const path = uri.split("?")[0].toLowerCase();

  if (path.endsWith(".png")) return { ext: "png", contentType: "image/png" };
  if (path.endsWith(".webp")) return { ext: "webp", contentType: "image/webp" };
  if (path.endsWith(".gif")) return { ext: "gif", contentType: "image/gif" };
  if (path.endsWith(".heic")) return { ext: "heic", contentType: "image/heic" };
  if (path.endsWith(".heif")) return { ext: "heif", contentType: "image/heif" };

  return { ext: "jpg", contentType: "image/jpeg" };
}

/** Normalize listing image URLs for display (handles storage paths and local picks). */
export function resolveListingImageUrl(uri: string | undefined | null): string | null {
  if (!uri) return null;

  const trimmed = uri.trim();
  if (!trimmed) return null;

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("file://") ||
    trimmed.startsWith("content://") ||
    trimmed.startsWith("ph://") ||
    trimmed.startsWith("data:")
  ) {
    return trimmed;
  }

  if (isSupabaseConfigured && supabaseUrl) {
    const path = trimmed.replace(/^\/+/, "");
    return `${supabaseUrl}/storage/v1/object/public/listing-images/${path}`;
  }

  return trimmed;
}

export function getListingCoverImage(images: string[] | undefined | null): string | null {
  if (!images?.length) return null;
  return resolveListingImageUrl(images[0]);
}

/** Cache-bust Supabase public URLs after re-uploads. */
export function withImageCacheKey(uri: string, key?: string | number): string {
  if (!key) return uri;
  const separator = uri.includes("?") ? "&" : "?";
  return `${uri}${separator}v=${encodeURIComponent(String(key))}`;
}
