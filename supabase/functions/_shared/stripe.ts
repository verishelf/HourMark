import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";

export const COMMISSION_RATE = 0.03;

export function getStripeClient() {
  const secretKey = Deno.env.get("STRIPE_SECRET_KEY")?.trim();
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  if (secretKey.startsWith("pk_")) {
    throw new Error(
      "STRIPE_SECRET_KEY must be sk_live_ or sk_test_, not a publishable key (pk_)"
    );
  }

  return new Stripe(secretKey, {
    apiVersion: "2024-12-18.acacia",
    httpClient: Stripe.createFetchHttpClient(),
  });
}
