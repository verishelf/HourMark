import { NextResponse } from "next/server";
import { isValidSubscribeEmail, normalizeSubscribeEmail } from "@/lib/subscribe";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const payload = body as {
    email?: string;
    source?: string;
    company?: string;
  };

  // Honeypot for bots
  if (payload.company) {
    return NextResponse.json({ success: true });
  }

  const email = normalizeSubscribeEmail(payload.email ?? "");
  if (!isValidSubscribeEmail(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: "Signup is temporarily unavailable. Please try again later." },
      { status: 503 }
    );
  }

  const source = (payload.source ?? "website_waitlist").slice(0, 64);

  const { error } = await supabase.from("website_signups").upsert(
    {
      email,
      source,
      subscribed: true,
    },
    { onConflict: "email" }
  );

  if (error) {
    return NextResponse.json({ error: "Could not save your email. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "Thanks — you are on the list." });
}
