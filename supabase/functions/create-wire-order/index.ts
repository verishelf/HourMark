import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { getAuthenticatedUser, getServiceClient } from "../_shared/auth.ts";
import { COMMISSION_RATE } from "../_shared/stripe.ts";

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

function buildWireReference(orderId: string): string {
  return `HM-${orderId.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
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
    const { listingId, amount, shipping } = await req.json();

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

    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("id, seller_id, status, brand, model")
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

    const commissionFee = Math.round(amount * COMMISSION_RATE);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        buyer_id: user.id,
        seller_id: listing.seller_id,
        listing_id: listingId,
        amount,
        commission_fee: commissionFee,
        status: "pending",
        payment_method: "wire_transfer",
        ...mapShippingColumns(shipping),
      })
      .select("id")
      .single();

    if (orderError || !order) {
      return jsonResponse({ message: orderError?.message ?? "Failed to create order" }, 500);
    }

    const wireReference = buildWireReference(order.id);

    await supabase
      .from("orders")
      .update({ wire_reference: wireReference })
      .eq("id", order.id);

    await supabase
      .from("listings")
      .update({ status: "sold" })
      .eq("id", listingId);

    return jsonResponse({
      orderId: order.id,
      wireReference,
      bankName: Deno.env.get("HOURMARK_WIRE_BANK_NAME") ?? "Chase Bank, N.A.",
      accountName: Deno.env.get("HOURMARK_WIRE_ACCOUNT_NAME") ?? "HourMark Inc.",
      routingNumber: Deno.env.get("HOURMARK_WIRE_ROUTING") ?? "021000021",
      accountNumber: Deno.env.get("HOURMARK_WIRE_ACCOUNT") ?? "Contact support for account details",
      swiftCode: Deno.env.get("HOURMARK_WIRE_SWIFT") ?? "CHASUS33",
      bankAddress:
        Deno.env.get("HOURMARK_WIRE_BANK_ADDRESS") ??
        "383 Madison Avenue, New York, NY 10179, USA",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return jsonResponse({ message }, 500);
  }
});
