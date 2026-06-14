import type { HeaderUser } from "@/lib/user";
import { createClient } from "@/lib/supabase/server";

export type { HeaderUser };

export async function getCurrentUser(): Promise<HeaderUser | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("id, username, full_name, avatar_url, verified")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return {
      id: user.id,
      username: user.email?.split("@")[0] ?? null,
      full_name: null,
      avatar_url: null,
      verified: false,
      email: user.email,
    };
  }

  return { ...(profile as HeaderUser), email: user.email };
}
