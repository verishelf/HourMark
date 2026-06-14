import { getSupabaseAnonKey, getSupabaseUrl, isSupabaseConfigured } from "@/lib/env";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Anonymous Supabase client for public marketplace reads (no cookies / auth session). */
export function createPublicClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  return createSupabaseClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
