import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getSupabaseAnonKey, getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/env";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component — ignore
          }
        },
      },
    }
  );
}

export function createServiceClient() {
  const key = getSupabaseServiceRoleKey();
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is missing. Add it to dashboard/.env.local (Supabase Dashboard → Settings → API)."
    );
  }
  return createSupabaseClient(getSupabaseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
