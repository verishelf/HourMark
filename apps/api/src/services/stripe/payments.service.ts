import { stripe } from "../../lib/stripe.js";
import { getSupabaseAdmin } from "../../lib/supabase.js";
import { commissionService } from "./commission.service.js";

export class PaymentError extends Error {
  constructor(
    message: string,
    public statusCode = 400
  ) {
    super(message);
    this.name = "PaymentError";
  }
}

export const paymentsService = {
  async createPaymentIntent(params: {
    listingId: string;
    buyerId: string;
    amountCents?: number;
  }) {
    const supabase = getSupabaseAdmin();

    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("id, seller_id, price, status, brand, model")
      .eq("id", params.listingId)
      .single();

    if (listingError || !listing) {
      throw new PaymentError("Listing not found", 404);
    }

    if (listing.status !== "active") {
      throw new PaymentError("Listing is not available for purchase", 400);
    }

    if (listing.seller_id === params.buyerId) {
      throw new PaymentError("You cannot purchase your own listing", 400);
    }

    const amountCents = params.amountCents ?? listing.price;
    if (amountCents !== listing.price) {
      throw new PaymentError("Amount does not match listing price", 400);
    }

    const { data: stripeAccount } = await supabase
      .from("stripe_accounts")
      .select("*")
      .eq("user_id", listing.seller_id)
      .maybeSingle();

    const sellerStripeId =
      stripeAccount?.stripe_account_id ??
      (
        await supabase
          .from("users")
          .select("stripe_account_id")
          .eq("id", listing.seller_id)
          .single()
      ).data?.stripe_account_id;

    if (!sellerStripeId) {
      throw new PaymentError(
        "Seller has not completed Stripe Connect onboarding",
        400
      );
    }

    if (stripeAccount && !stripeAccount.charges_enabled) {
      const account = await stripe.accounts.retrieve(sellerStripeId);
      if (!account.charges_enabled) {
        throw new PaymentError(
          "Seller cannot accept payments yet. Onboarding incomplete.",
          400
        );
      }
    }

    const commissionFee = commissionService.calculateCommission(amountCents);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        buyer_id: params.buyerId,
        seller_id: listing.seller_id,
        listing_id: listing.id,
        amount: amountCents,
        commission_fee: commissionFee,
        status: "pending",
      })
      .select()
      .single();

    if (orderError || !order) {
      throw new PaymentError("Failed to create order", 500);
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "usd",
      application_fee_amount: commissionFee,
      transfer_data: {
        destination: sellerStripeId,
      },
      automatic_payment_methods: { enabled: true },
      metadata: {
        order_id: order.id,
        listing_id: listing.id,
        buyer_id: params.buyerId,
        seller_id: listing.seller_id,
        commission_fee: String(commissionFee),
      },
    });

    await supabase
      .from("orders")
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq("id", order.id);

    if (!paymentIntent.client_secret) {
      throw new PaymentError("Failed to initialize payment", 500);
    }

    return {
      clientSecret: paymentIntent.client_secret,
      orderId: order.id,
      paymentIntentId: paymentIntent.id,
      amount: amountCents,
      commissionFee,
      sellerPayout: commissionService.calculateSellerPayout(amountCents),
    };
  },

  async markOrderPaid(orderId: string, paymentIntentId: string) {
    const supabase = getSupabaseAdmin();

    const { data: order } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();

    if (!order) return null;
    if (order.status === "paid") return order;

    const sellerPayout = commissionService.calculateSellerPayout(order.amount);

    await supabase
      .from("orders")
      .update({ status: "paid", stripe_payment_intent_id: paymentIntentId })
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
        commission_fee: order.commission_fee,
        seller_payout: sellerPayout,
        stripe_charge_id: paymentIntentId,
        status: "completed",
      });
    }

    await supabase
      .from("listings")
      .update({ status: "sold" })
      .eq("id", order.listing_id);

    return order;
  },

  async markOrderFailed(orderId: string) {
    const supabase = getSupabaseAdmin();
    await supabase
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", orderId)
      .eq("status", "pending");
  },

  async handleRefund(chargeId: string, paymentIntentId?: string) {
    const supabase = getSupabaseAdmin();

    let orderQuery = supabase.from("orders").select("*");

    if (paymentIntentId) {
      orderQuery = orderQuery.eq("stripe_payment_intent_id", paymentIntentId);
    } else {
      return null;
    }

    const { data: order } = await orderQuery.maybeSingle();
    if (!order) return null;

    await supabase
      .from("orders")
      .update({ status: "refunded" })
      .eq("id", order.id);

    await supabase
      .from("transactions")
      .update({ status: "refunded" })
      .eq("order_id", order.id);

    await supabase
      .from("listings")
      .update({ status: "active" })
      .eq("id", order.listing_id)
      .eq("status", "sold");

    return order;
  },
};
