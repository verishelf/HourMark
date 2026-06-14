"use client";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAnonKey, getSupabaseUrl, isSupabaseConfigured } from "@/lib/env";

export function createClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  return createSupabaseClient(getSupabaseUrl(), getSupabaseAnonKey());
}
