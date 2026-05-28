import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { getAuthenticatedUser, getServiceClient } from "../_shared/auth.ts";
import { COMMISSION_RATE, getStripeClient } from "../_shared/stripe.ts";

type ShippingPayload = {
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
};

function validateShipping(shipping: ShippingPayload | undefined): string | null {
  if (!shipping) return "Shipping details are required";

  const required: Array<[string, string | undefined]> = [
    ["Full name", shipping.buyerName],
    ["Email", shipping.buyerEmail],
    ["Phone", shipping.buyerPhone],
    ["Street address", shipping.addressLine1],
    ["City", shipping.city],
    ["State", shipping.state],
    ["ZIP code", shipping.postalCode],
  ];

  for (const [label, value] of required) {
    if (!value?.trim()) return `${label} is required`;
  }

  return null;
}

function mapShippingColumns(shipping: ShippingPayload) {
  return {
    buyer_name: shipping.buyerName!.trim(),
    buyer_email: shipping.buyerEmail!.trim(),
    buyer_phone: shipping.buyerPhone!.trim(),
    shipping_address_line1: shipping.addressLine1!.trim(),
    shipping_address_line2: shipping.addressLine2?.trim() || null,
    shipping_city: shipping.city!.trim(),
    shipping_state: shipping.state!.trim(),
    shipping_postal_code: shipping.postalCode!.trim(),
    shipping_country: shipping.country?.trim() || "US",
  };
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== "POST") {
    return jsonResponse({ message: "Method not allowed" }, 405);
  }

  try {
    const authResult = await getAuthenticatedUser(req);
    if (authResult instanceof Response) return authResult;

    const { user } = authResult;
    const { listingId, amount, paymentMethod, shipping } = await req.json();

    if (!listingId || typeof listingId !== "string") {
      return jsonResponse({ message: "listingId is required" }, 400);
    }

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return jsonResponse({ message: "amount must be a positive number" }, 400);
    }

    const shippingError = validateShipping(shipping);
    if (shippingError) {
      return jsonResponse({ message: shippingError }, 400);
    }

    const supabase = getServiceClient();
    const stripe = getStripeClient();

    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("id, seller_id, status, seller:users(stripe_account_id, verified)")
      .eq("id", listingId)
      .single();

    if (listingError || !listing) {
      return jsonResponse({ message: "Listing not found" }, 404);
    }

    if (listing.status !== "active") {
      return jsonResponse({ message: "Listing is not available" }, 400);
    }

    if (listing.seller_id === user.id) {
      return jsonResponse({ message: "You cannot buy your own listing" }, 400);
    }

    const seller = listing.seller as {
      stripe_account_id: string | null;
      verified: boolean;
    } | null;

    if (!seller?.verified || !seller?.stripe_account_id) {
      return jsonResponse({ message: "Seller is not verified for payouts" }, 400);
    }

    const commissionFee = Math.round(amount * COMMISSION_RATE);
    const resolvedPaymentMethod =
      paymentMethod === "apple_pay" ? "apple_pay" : "card";

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        buyer_id: user.id,
        seller_id: listing.seller_id,
        listing_id: listingId,
        amount,
        commission_fee: commissionFee,
        status: "pending",
        payment_method: resolvedPaymentMethod,
        ...mapShippingColumns(shipping),
      })
      .select("id")
      .single();

    if (orderError || !order) {
      return jsonResponse({ message: orderError?.message ?? "Failed to create order" }, 500);
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      application_fee_amount: commissionFee,
      transfer_data: {
        destination: seller.stripe_account_id,
      },
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        listing_id: listingId,
        buyer_id: user.id,
        seller_id: listing.seller_id,
        order_id: order.id,
        payment_method: resolvedPaymentMethod,
      },
    });

    await supabase
      .from("orders")
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq("id", order.id);

    return jsonResponse({
      clientSecret: paymentIntent.client_secret,
      orderId: order.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return jsonResponse({ message }, 500);
  }
});
