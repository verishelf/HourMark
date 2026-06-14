/** Read and normalize env vars (trim whitespace / surrounding quotes from Vercel paste). */
export function readEnv(primary: string, fallback?: string): string {
  const raw = process.env[primary] ?? (fallback ? process.env[fallback] : "") ?? "";
  return String(raw).trim().replace(/^['"]|['"]$/g, "");
}

export function getSupabaseUrl(): string {
  return readEnv("NEXT_PUBLIC_SUPABASE_URL", "EXPO_PUBLIC_SUPABASE_URL");
}

export function getSupabaseAnonKey(): string {
  return readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "EXPO_PUBLIC_SUPABASE_ANON_KEY");
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}
