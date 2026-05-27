import type Stripe from "stripe";
import { paymentsService } from "../../services/stripe/payments.service.js";

export async function handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
  const paymentIntentId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id;

  await paymentsService.handleRefund(charge.id, paymentIntentId);
}
