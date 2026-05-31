import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { getAuthenticatedUser, getServiceClient } from "../_shared/auth.ts";

const USER_STORAGE_BUCKETS = ["avatars", "listing-images", "post-images"] as const;

async function removeUserStoragePrefix(
  supabase: ReturnType<typeof getServiceClient>,
  bucket: string,
  userId: string
) {
  const { data: files, error } = await supabase.storage.from(bucket).list(userId);
  if (error || !files?.length) return;

  const paths = files
    .filter((file) => file.id && file.name)
    .map((file) => `${userId}/${file.name}`);

  if (paths.length) {
    await supabase.storage.from(bucket).remove(paths);
  }
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== "POST") {
    return jsonResponse({ message: "Method not allowed" }, 405);
  }

  try {
    const authResult = await getAuthenticatedUser(req);
    if (authResult instanceof Response) return authResult;

    const userId = authResult.user.id;
    const supabase = getServiceClient();

    for (const bucket of USER_STORAGE_BUCKETS) {
      await removeUserStoragePrefix(supabase, bucket, userId);
    }

    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
    if (deleteError) {
      return jsonResponse({ message: deleteError.message }, 500);
    }

    return jsonResponse({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to delete account";
    return jsonResponse({ message }, 500);
  }
});
