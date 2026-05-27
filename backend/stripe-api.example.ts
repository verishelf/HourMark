/**
 * HourMark Stripe Connect Backend (Example)
 *
 * Deploy as Supabase Edge Functions, Vercel serverless, or Express API.
 * Set STRIPE_SECRET_KEY and connect webhook endpoint in Stripe Dashboard.
 *
 * Platform commission: 3% (application_fee_amount)
 */

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

const COMMISSION_RATE = 0.03;

// POST /api/payments/create-intent
export async function createPaymentIntent(req: {
  listingId: string;
  buyerId: string;
  amount: number;
  sellerStripeAccountId: string;
}) {
  const commissionFee = Math.round(req.amount * COMMISSION_RATE);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: req.amount,
    currency: "usd",
    application_fee_amount: commissionFee,
    transfer_data: {
      destination: req.sellerStripeAccountId,
    },
    metadata: {
      listing_id: req.listingId,
      buyer_id: req.buyerId,
    },
  });

  return {
    clientSecret: paymentIntent.client_secret,
    orderId: paymentIntent.id,
  };
}

// POST /api/connect/onboard
export async function createConnectOnboarding(userId: string, returnUrl: string) {
  const account = await stripe.accounts.create({
    type: "express",
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: { user_id: userId },
  });

  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: returnUrl,
    return_url: returnUrl,
    type: "account_onboarding",
  });

  // Save account.id to users.stripe_account_id in Supabase
  return { url: accountLink.url, accountId: account.id };
}

// Webhook: payment_intent.succeeded
export async function handleWebhook(event: Stripe.Event) {
  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as Stripe.PaymentIntent;
    // Update order status, create transaction record, mark listing sold
    console.log("Payment succeeded:", intent.id);
  }
}
