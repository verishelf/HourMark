import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { VerificationAssetType } from "@/types/trust";

const BUCKET_BY_ASSET: Record<VerificationAssetType, string> = {
  serial: "watch-serials",
  front: "watch-serials",
  movement: "movement-images",
  box_papers: "watch-box-images",
  video: "watch-videos",
};

export async function uploadTrustAsset(
  listingId: string,
  assetType: VerificationAssetType,
  localUri: string,
  mimeType: string
): Promise<string> {
  if (!isSupabaseConfigured) return `${assetType}/${listingId}/mock`;

  const response = await fetch(localUri);
  if (!response.ok) throw new Error("Could not read verification file");

  const arrayBuffer = await response.arrayBuffer();
  if (arrayBuffer.byteLength === 0) throw new Error("File is empty");

  const bucket = BUCKET_BY_ASSET[assetType];
  const ext = mimeType.includes("video") ? "mp4" : "jpg";
  const path = `${listingId}/${assetType}_${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, arrayBuffer, {
    contentType: mimeType,
    upsert: false,
  });

  if (error) throw error;
  return path;
}
