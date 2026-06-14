import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/site";

/** Anonymous Supabase client for public marketplace reads (no cookies / auth session). */
export function createPublicClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  return createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
