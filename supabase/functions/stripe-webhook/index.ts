import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";
import { getServiceClient } from "../_shared/auth.ts";
import { getStripeClient } from "../_shared/stripe.ts";
import { syncVerificationFromAccount } from "../_shared/verification.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const stripe = getStripeClient();
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!webhookSecret) {
    return new Response("Webhook secret not configured", { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid signature";
    return new Response(message, { status: 400 });
  }

  try {
    const supabase = getServiceClient();

    if (event.type === "account.updated") {
      const account = event.data.object as Stripe.Account;
      const userId = account.metadata?.user_id;

      if (userId) {
        await syncVerificationFromAccount(supabase, userId, account);
      } else {
        const { data: userRow } = await supabase
          .from("users")
          .select("id")
          .eq("stripe_account_id", account.id)
          .maybeSingle();

        if (userRow?.id) {
          await syncVerificationFromAccount(supabase, userRow.id, account);
        }
      }
    }

    if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object as Stripe.PaymentIntent;
      const orderId = pi.metadata?.order_id;
      if (orderId) {
        await supabase
          .from("orders")
          .update({
            status: pi.capture_method === "manual" ? "payment_held" : "paid",
            escrow_status: "held",
          })
          .eq("id", orderId)
          .in("status", ["pending", "awaiting_payment"]);
      }
    }

    if (event.type === "payment_intent.amount_capturable_updated") {
      const pi = event.data.object as Stripe.PaymentIntent;
      const orderId = pi.metadata?.order_id;
      if (orderId && pi.status === "requires_capture") {
        await supabase
          .from("orders")
          .update({ status: "payment_held", escrow_status: "held" })
          .eq("id", orderId);
      }
    }

    if (event.type === "account.application.deauthorized") {
      const account = event.data.object as Stripe.Account;
      const { data: userRow } = await supabase
        .from("users")
        .select("id")
        .eq("stripe_account_id", account.id)
        .maybeSingle();

      if (userRow?.id) {
        await supabase.rpc("sync_seller_verification", {
          p_user_id: userRow.id,
          p_stripe_account_id: account.id,
          p_status: "rejected",
          p_requirements_due: [],
          p_rejection_reason: "Account deauthorized",
        });
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook handler failed";
    return new Response(message, { status: 500 });
  }
});
