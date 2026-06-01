/** Get-started slider: Rolex → Audemars Piguet → Richard Mille */
const SLIDE_PARAMS = "w=1200&q=85&auto=format&fit=crop";

/**
 * Image sources (verified May 2026):
 * - Rolex: Unsplash — blue/gold Submariner on stand (Nicolás Pinilla)
 * - AP: Wikimedia Commons — Royal Oak Offshore (CC BY 3.0, Peripitus)
 * - Richard Mille: Unsplash — skeleton automatic (haute horlogerie aesthetic)
 */
export const AUTH_SLIDE_IMAGES = [
  `https://images.unsplash.com/photo-1730757679771-b53e798846cf?${SLIDE_PARAMS}`,
  "https://upload.wikimedia.org/wikipedia/commons/7/7c/Royal_Oak_Offshore_watch_by_Audemars_Piguet.JPG",
  `https://images.unsplash.com/photo-1748327483681-5e3c4a438693?${SLIDE_PARAMS}`,
] as const;
