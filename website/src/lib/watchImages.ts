/** Verified Unsplash URLs (404-checked). */

const BASE = {
  hero: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49",
  blackDial: "https://images.unsplash.com/photo-1749831754129-3a84b9fdeb87",
  metalBand: "https://images.unsplash.com/photo-1777457797327-571e21f193b0",
  greenDial: "https://images.unsplash.com/photo-1766595898967-22c61e0be796",
  classic: "https://images.unsplash.com/photo-1611652022419-a9419f74343d",
  product: "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
  wrist: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a",
  macro: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62",
} as const;

export function watchImage(
  key: keyof typeof BASE,
  width: number,
  quality = 85,
): string {
  const url = new URL(BASE[key]);
  url.searchParams.set("w", String(width));
  url.searchParams.set("q", String(quality));
  url.searchParams.set("auto", "format");
  url.searchParams.set("fit", "crop");
  return url.toString();
}

export const WATCH_IMAGE_KEYS = Object.keys(BASE) as (keyof typeof BASE)[];
