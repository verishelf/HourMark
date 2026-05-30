import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { getAuthenticatedUser, getServiceClient } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== "POST") {
    return jsonResponse({ message: "Method not allowed" }, 405);
  }

  try {
    const authResult = await getAuthenticatedUser(req);
    if (authResult instanceof Response) return authResult;

    const { orderId, trackingNumber } = await req.json();
    if (!orderId || !trackingNumber?.trim()) {
      return jsonResponse({ message: "orderId and trackingNumber are required" }, 400);
    }

    const supabase = getServiceClient();
    const { data: order, error } = await supabase
      .from("orders")
      .select("id, seller_id, status")
      .eq("id", orderId)
      .single();

    if (error || !order) return jsonResponse({ message: "Order not found" }, 404);
    if (order.seller_id !== authResult.user.id) {
      return jsonResponse({ message: "Forbidden" }, 403);
    }

    await supabase
      .from("orders")
      .update({
        tracking_number: trackingNumber.trim(),
        status: "shipped",
      })
      .eq("id", orderId);

    return jsonResponse({ status: "shipped" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    return jsonResponse({ message }, 500);
  }
});
