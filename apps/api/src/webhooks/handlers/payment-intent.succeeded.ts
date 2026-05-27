import type Stripe from "stripe";
import { paymentsService } from "../../services/stripe/payments.service.js";

export async function handlePaymentIntentSucceeded(
  intent: Stripe.PaymentIntent
): Promise<void> {
  const orderId = intent.metadata?.order_id;
  if (!orderId) {
    console.warn("payment_intent.succeeded missing order_id metadata", intent.id);
    return;
  }
  await paymentsService.markOrderPaid(orderId, intent.id);
}
