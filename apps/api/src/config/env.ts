import "dotenv/config";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

export const env = {
  port: Number(process.env.PORT ?? 3001),
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProduction: process.env.NODE_ENV === "production",

  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",

  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",

  platformCommissionRate: Number(
    optionalEnv("PLATFORM_COMMISSION_RATE", "0.03")
  ),

  stripeConnectRefreshUrl: optionalEnv(
    "STRIPE_CONNECT_REFRESH_URL",
    "hourmark://profile"
  ),
  stripeConnectReturnUrl: optionalEnv(
    "STRIPE_CONNECT_RETURN_URL",
    "hourmark://profile"
  ),
};

export function assertServerConfig(): void {
  requireEnv("STRIPE_SECRET_KEY");
  requireEnv("SUPABASE_URL");
  requireEnv("SUPABASE_SERVICE_ROLE_KEY");
}

export function isStripeConfigured(): boolean {
  return Boolean(env.stripeSecretKey);
}

export function isSupabaseConfigured(): boolean {
  return Boolean(env.supabaseUrl && env.supabaseServiceRoleKey);
}
