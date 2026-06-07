import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { getAuthenticatedUser, getServiceClient } from "../_shared/auth.ts";
import { getStripeClient } from "../_shared/stripe.ts";

const CANCELLABLE_ORDER_STATUSES = ["pending", "awaiting_payment"] as const;

/** Stripe states where no payment has been authorized yet. */
const STRIPE_UNPAID = new Set([
  "requires_payment_method",
  "requires_confirmation",
  "requires_action",
]);

/** Payment authorized or completed — cannot cancel from the app. */
const STRIPE_PAID = new Set(["requires_capture", "processing", "succeeded"]);

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== "POST") {
    return jsonResponse({ message: "Method not allowed" }, 405);
  }

  try {
    const authResult = await getAuthenticatedUser(req);
    if (authResult instanceof Response) return authResult;

    const { orderId } = await req.json();
    if (!orderId || typeof orderId !== "string") {
      return jsonResponse({ message: "orderId is required" }, 400);
    }

    const supabase = getServiceClient();
    const { data: order, error } = await supabase
      .from("orders")
      .select(
        "id, buyer_id, listing_id, status, payment_method, stripe_payment_intent_id, escrow_status"
      )
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return jsonResponse({ message: "Order not found" }, 404);
    }

    if (order.buyer_id !== authResult.user.id) {
      return jsonResponse({ message: "Only the buyer can cancel this order" }, 403);
    }

    if (order.escrow_status === "held") {
      return jsonResponse(
        { message: "Payment has already been received. This order cannot be cancelled." },
        400
      );
    }

    if (
      !CANCELLABLE_ORDER_STATUSES.includes(
        order.status as (typeof CANCELLABLE_ORDER_STATUSES)[number]
      )
    ) {
      return jsonResponse(
        { message: "This order can only be cancelled before payment is received." },
        400
      );
    }

    if (order.stripe_payment_intent_id) {
      const stripe = getStripeClient();
      let paymentIntent;
      try {
        paymentIntent = await stripe.paymentIntents.retrieve(order.stripe_payment_intent_id);
      } catch (stripeError) {
        const message =
          stripeError instanceof Error ? stripeError.message : "Could not verify payment status";
        return jsonResponse({ message }, 400);
      }

      if (STRIPE_PAID.has(paymentIntent.status)) {
        if (paymentIntent.status === "requires_capture" || paymentIntent.status === "succeeded") {
          await supabase
            .from("orders")
            .update({
              status: paymentIntent.status === "requires_capture" ? "payment_held" : "paid",
              escrow_status: "held",
            })
            .eq("id", orderId)
            .in("status", [...CANCELLABLE_ORDER_STATUSES]);
        }

        return jsonResponse(
          {
            message:
              "Payment has already been authorized or completed. This order cannot be cancelled.",
          },
          400
        );
      }

      if (STRIPE_UNPAID.has(paymentIntent.status)) {
        try {
          await stripe.paymentIntents.cancel(order.stripe_payment_intent_id);
        } catch (stripeError) {
          const message =
            stripeError instanceof Error ? stripeError.message : "Failed to cancel payment";
          return jsonResponse({ message }, 400);
        }
      }
    }

    const { data: updated, error: updateError } = await supabase
      .from("orders")
      .update({ status: "cancelled", escrow_status: "none" })
      .eq("id", orderId)
      .in("status", [...CANCELLABLE_ORDER_STATUSES])
      .select("id, status")
      .maybeSingle();

    if (updateError) {
      return jsonResponse({ message: updateError.message }, 500);
    }

    if (!updated) {
      return jsonResponse(
        { message: "Order status changed and can no longer be cancelled." },
        409
      );
    }

    if (order.payment_method === "wire_transfer") {
      await supabase
        .from("listings")
        .update({ status: "active" })
        .eq("id", order.listing_id)
        .eq("status", "sold");
    }

    return jsonResponse({ status: "cancelled" as const });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to cancel order";
    return jsonResponse({ message }, 500);
  }
});
