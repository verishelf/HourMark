import type Stripe from "stripe";
import { paymentsService } from "../../services/stripe/payments.service.js";

export async function handlePaymentIntentFailed(
  intent: Stripe.PaymentIntent
): Promise<void> {
  const orderId = intent.metadata?.order_id;
  if (!orderId) {
    console.warn("payment_intent.payment_failed missing order_id metadata", intent.id);
    return;
  }
  await paymentsService.markOrderFailed(orderId);
}
