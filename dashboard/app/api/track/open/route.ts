import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const campaignId = request.nextUrl.searchParams.get("campaign");

  if (campaignId) {
    const supabase = createServiceClient();
    const { data: campaign } = await supabase
      .from("email_campaigns")
      .select("open_count")
      .eq("id", campaignId)
      .single();

    if (campaign) {
      await supabase
        .from("email_campaigns")
        .update({ open_count: (campaign.open_count ?? 0) + 1 })
        .eq("id", campaignId);
    }
  }

  const pixel = Buffer.from(
    "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    "base64"
  );

  return new NextResponse(pixel, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store",
    },
  });
}
