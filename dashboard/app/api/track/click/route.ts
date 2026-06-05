import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const campaignId = request.nextUrl.searchParams.get("campaign");
  const url = request.nextUrl.searchParams.get("url");

  if (campaignId) {
    const supabase = createServiceClient();
    const { data: campaign } = await supabase
      .from("email_campaigns")
      .select("click_count")
      .eq("id", campaignId)
      .single();

    if (campaign) {
      await supabase
        .from("email_campaigns")
        .update({ click_count: (campaign.click_count ?? 0) + 1 })
        .eq("id", campaignId);
    }
  }

  if (url) {
    return NextResponse.redirect(url);
  }

  return NextResponse.json({ tracked: true });
}
