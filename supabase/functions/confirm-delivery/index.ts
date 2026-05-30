import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { getAuthenticatedUser, getServiceClient } from "../_shared/auth.ts";

const INSPECTION_DAYS = 3;

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
    if (!orderId) return jsonResponse({ message: "orderId is required" }, 400);

    const supabase = getServiceClient();
    const { data: order, error } = await supabase
      .from("orders")
      .select("id, buyer_id, status, escrow_status")
      .eq("id", orderId)
      .single();

    if (error || !order) return jsonResponse({ message: "Order not found" }, 404);
    if (order.buyer_id !== authResult.user.id) {
      return jsonResponse({ message: "Forbidden" }, 403);
    }

    const inspectionEnds = new Date();
    inspectionEnds.setDate(inspectionEnds.getDate() + INSPECTION_DAYS);

    await supabase
      .from("orders")
      .update({
        status: "inspection_period",
        delivery_confirmed_at: new Date().toISOString(),
        inspection_ends_at: inspectionEnds.toISOString(),
      })
      .eq("id", orderId);

    return jsonResponse({
      status: "inspection_period",
      inspectionEndsAt: inspectionEnds.toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return jsonResponse({ message }, 500);
  }
});
