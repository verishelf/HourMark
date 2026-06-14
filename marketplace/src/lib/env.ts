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

export function getStripePublishableKey(): string {
  return readEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY");
}

export function isStripeConfigured(): boolean {
  const key = getStripePublishableKey();
  return key.startsWith("pk_live_") || key.startsWith("pk_test_");
}

export function getFunctionsBaseUrl(): string {
  const apiUrl = readEnv("NEXT_PUBLIC_API_URL", "EXPO_PUBLIC_API_URL");
  if (apiUrl) return apiUrl.replace(/\/$/, "");
  const supabaseUrl = getSupabaseUrl();
  if (supabaseUrl) return `${supabaseUrl.replace(/\/$/, "")}/functions/v1`;
  return "";
}
