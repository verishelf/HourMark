import { jsonResponse } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return jsonResponse({ message: "Method not allowed" }, 405);
  }

  try {
    const payload = await req.json();
    const inquiryId =
      payload?.data?.id ??
      payload?.inquiry_id ??
      payload?.object?.id;
    const statusRaw =
      payload?.data?.attributes?.status ??
      payload?.status ??
      payload?.object?.status;

    if (!inquiryId) {
      return jsonResponse({ message: "Missing inquiry id" }, 400);
    }

    const approved = ["approved", "completed", "passed"].includes(
      String(statusRaw).toLowerCase()
    );
    const rejected = ["declined", "failed", "rejected"].includes(
      String(statusRaw).toLowerCase()
    );

    const kycStatus = approved ? "approved" : rejected ? "rejected" : "pending";

    const supabase = getServiceClient();

    const { data: submission } = await supabase
      .from("kyc_submissions")
      .select("user_id")
      .eq("provider_inquiry_id", inquiryId)
      .maybeSingle();

    if (!submission?.user_id) {
      return jsonResponse({ message: "Submission not found" }, 404);
    }

    await supabase
      .from("kyc_submissions")
      .update({
        status: kycStatus,
        reviewed_at: new Date().toISOString(),
      })
      .eq("provider_inquiry_id", inquiryId);

    await supabase
      .from("users")
      .update({
        kyc_status: kycStatus,
        is_verified_seller: approved,
        verified: approved,
      })
      .eq("id", submission.user_id);

    return jsonResponse({ ok: true, kycStatus });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook failed";
    return jsonResponse({ message }, 500);
  }
});
