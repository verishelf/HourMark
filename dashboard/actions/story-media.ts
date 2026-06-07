"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

const MAX_BYTES = 5 * 1024 * 1024;

export async function uploadStoryImage(formData: FormData): Promise<{ url?: string; error?: string }> {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { error: "No file provided" };
  }

  if (!file.type.startsWith("image/")) {
    return { error: "File must be an image" };
  }

  if (file.size > MAX_BYTES) {
    return { error: "Image must be under 5MB" };
  }

  const supabase = createServiceClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `admin/${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage.from("story-images").upload(path, buffer, {
    contentType: file.type,
    cacheControl: "3600",
    upsert: false,
  });

  if (error) return { error: error.message };

  const { data } = supabase.storage.from("story-images").getPublicUrl(path);
  return { url: data.publicUrl };
}
