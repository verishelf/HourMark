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

    const { idDocumentPath, selfiePath, phoneNumber, provider = "persona" } =
      await req.json();

    if (!idDocumentPath || !selfiePath || !phoneNumber) {
      return jsonResponse(
        { message: "idDocumentPath, selfiePath, and phoneNumber are required" },
        400
      );
    }

    const supabase = getServiceClient();
    const userId = authResult.user.id;

    const personaKey = Deno.env.get("PERSONA_API_KEY");
    const onfidoKey = Deno.env.get("ONFIDO_API_KEY");
    const devAutoApprove = Deno.env.get("KYC_DEV_AUTO_APPROVE") === "true";

    let providerInquiryId: string | null = null;
    let status: "pending" | "approved" | "rejected" = "pending";

    if (devAutoApprove || (!personaKey && !onfidoKey)) {
      status = devAutoApprove ? "approved" : "pending";
      providerInquiryId = `dev_${crypto.randomUUID()}`;
    } else if (provider === "persona" && personaKey) {
      const res = await fetch("https://withpersona.com/api/v1/inquiries", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${personaKey}`,
          "Content-Type": "application/json",
          "Persona-Version": "2023-01-05",
        },
        body: JSON.stringify({
          data: {
            type: "inquiry",
            attributes: {
              reference_id: userId,
            },
          },
        }),
      });
      if (res.ok) {
        const body = await res.json();
        providerInquiryId = body?.data?.id ?? null;
      }
    }

    const { data: submission, error } = await supabase
      .from("kyc_submissions")
      .insert({
        user_id: userId,
        id_document_path: idDocumentPath,
        selfie_path: selfiePath,
        phone_number: phoneNumber,
        provider,
        provider_inquiry_id: providerInquiryId,
        status,
      })
      .select("id, status")
      .single();

    if (error) {
      return jsonResponse({ message: error.message }, 500);
    }

    const kycStatus = status === "approved" ? "approved" : "pending";
    const verified = status === "approved";

    await supabase
      .from("users")
      .update({
        kyc_status: kycStatus,
        phone_number: phoneNumber,
        kyc_provider_id: providerInquiryId,
        kyc_provider: provider,
        is_verified_seller: verified,
        verified: verified || undefined,
      })
      .eq("id", userId);

    return jsonResponse({
      submissionId: submission?.id,
      status: kycStatus,
      verified,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "KYC submission failed";
    return jsonResponse({ message }, 500);
  }
});
