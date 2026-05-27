import type Stripe from "stripe";
import { handlePaymentIntentSucceeded } from "./handlers/payment-intent.succeeded.js";
import { handlePaymentIntentFailed } from "./handlers/payment-intent.failed.js";
import { handleAccountUpdated } from "./handlers/account.updated.js";
import { handleChargeRefunded } from "./handlers/charge.refunded.js";

export async function processStripeWebhook(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "payment_intent.succeeded":
      await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
      break;
    case "payment_intent.payment_failed":
      await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
      break;
    case "account.updated":
      await handleAccountUpdated(event.data.object as Stripe.Account);
      break;
    case "charge.refunded":
      await handleChargeRefunded(event.data.object as Stripe.Charge);
      break;
    default:
      break;
  }
}
