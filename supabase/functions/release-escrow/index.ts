import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { getAuthenticatedUser, getServiceClient } from "../_shared/auth.ts";
import { COMMISSION_RATE, getStripeClient } from "../_shared/stripe.ts";

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== "POST") {
    return jsonResponse({ message: "Method not allowed" }, 405);
  }

  try {
    const authResult = await getAuthenticatedUser(req);
    if (authResult instanceof Response) return authResult;

    const { orderId, force } = await req.json();
    if (!orderId) return jsonResponse({ message: "orderId is required" }, 400);

    const supabase = getServiceClient();
    const stripe = getStripeClient();

    const { data: order, error } = await supabase
      .from("orders")
      .select(
        "*, seller:users(stripe_account_id), listing:listings(id)"
      )
      .eq("id", orderId)
      .single();

    if (error || !order) return jsonResponse({ message: "Order not found" }, 404);

    const isBuyer = order.buyer_id === authResult.user.id;
    const isSeller = order.seller_id === authResult.user.id;
    const isService = req.headers.get("x-service-role") === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!isBuyer && !isSeller && !isService && !force) {
      return jsonResponse({ message: "Forbidden" }, 403);
    }

    const releasable = ["inspection_period", "delivered", "payment_held", "paid"];
    if (!releasable.includes(order.status)) {
      return jsonResponse({ message: `Cannot release order in status ${order.status}` }, 400);
    }

    if (
      order.status === "inspection_period" &&
      order.inspection_ends_at &&
      !force &&
      !isService
    ) {
      const ends = new Date(order.inspection_ends_at).getTime();
      if (Date.now() < ends) {
        return jsonResponse({ message: "Inspection period still active" }, 400);
      }
    }

    if (!order.stripe_payment_intent_id) {
      return jsonResponse({ message: "No payment on file" }, 400);
    }

    const seller = order.seller as { stripe_account_id: string | null };
    if (!seller?.stripe_account_id) {
      return jsonResponse({ message: "Seller payout account missing" }, 400);
    }

    const pi = await stripe.paymentIntents.retrieve(order.stripe_payment_intent_id);

    if (pi.status === "requires_capture") {
      await stripe.paymentIntents.capture(order.stripe_payment_intent_id);
    }

    const commissionFee = order.commission_fee ?? Math.round(order.amount * COMMISSION_RATE);
    const sellerAmount = order.amount - commissionFee;

    if (pi.status === "succeeded" || pi.status === "requires_capture") {
      const captured = await stripe.paymentIntents.retrieve(order.stripe_payment_intent_id);
      if (captured.status === "succeeded" && !captured.transfer_data?.destination) {
        await stripe.transfers.create({
          amount: sellerAmount,
          currency: "usd",
          destination: seller.stripe_account_id,
          transfer_group: order.id,
          metadata: { order_id: order.id },
        });
      }
    }

    await supabase
      .from("orders")
      .update({
        status: "completed",
        escrow_status: "released",
        funds_released_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    const { data: existingTx } = await supabase
      .from("transactions")
      .select("id")
      .eq("order_id", orderId)
      .maybeSingle();

    if (!existingTx) {
      await supabase.from("transactions").insert({
        order_id: orderId,
        amount: order.amount,
        commission_fee: commissionFee,
        seller_payout: sellerAmount,
      });
    }

    if (order.listing_id) {
      await supabase
        .from("listings")
        .update({ status: "sold" })
        .eq("id", order.listing_id);
    }

    return jsonResponse({ status: "completed", released: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Release failed";
    return jsonResponse({ message }, 500);
  }
});
