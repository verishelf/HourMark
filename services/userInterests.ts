import { toUserFacingError } from "@/lib/supabaseErrors";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { UserInterest } from "@/types";

export async function getUserInterests(userId: string): Promise<UserInterest[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from("user_interests")
    .select("interest")
    .eq("user_id", userId);
  if (error) throw toUserFacingError(error);
  return (data ?? []).map((r) => r.interest as UserInterest);
}

export async function setUserInterests(userId: string, interests: UserInterest[]): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { error: deleteError } = await supabase
    .from("user_interests")
    .delete()
    .eq("user_id", userId);
  if (deleteError) throw toUserFacingError(deleteError);

  if (interests.length === 0) return;

  const { error: insertError } = await supabase.from("user_interests").insert(
    interests.map((interest) => ({ user_id: userId, interest }))
  );
  if (insertError) throw toUserFacingError(insertError);
}

export async function hasUserInterests(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  const { count, error } = await supabase
    .from("user_interests")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (error) throw toUserFacingError(error);
  return (count ?? 0) > 0;
}
