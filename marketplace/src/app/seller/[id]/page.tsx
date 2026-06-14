import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ListingGrid } from "@/components/ListingGrid";

async function getProfile(supabase: Awaited<ReturnType<typeof createClient>>, id: string) {
  if (!supabase) return null;
  const { data } = await supabase.from("users").select("*").eq("id", id).maybeSingle();
  return data;
}

export default async function SellerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const profile = await getProfile(supabase, id);
  if (!profile || !supabase) notFound();

  const { data } = await supabase
    .from("listings")
    .select("*, seller:users(*)")
    .eq("seller_id", id)
    .eq("status", "active");

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8">
      <div className="mb-8 flex items-center gap-4 border-b border-border pb-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-card text-xl font-medium">
          {(profile.username ?? "S")[0]?.toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-semibold">{profile.username ?? "Seller"}</h1>
          {profile.verified && <p className="text-sm text-gold">Verified seller</p>}
        </div>
      </div>
      <ListingGrid listings={(data ?? []) as never[]} />
    </div>
  );
}
