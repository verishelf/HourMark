import { redirect } from "next/navigation";
import { ProfileDashboard } from "@/components/ProfileDashboard";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getProfileById } from "@/services/profile";
import { getMyListings } from "@/services/seller-listings";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login?redirect=/profile");

  const supabase = await createClient();
  if (!supabase) redirect("/auth/login?redirect=/profile");

  const profile = await getProfileById(supabase, user.id);
  if (!profile) redirect("/auth/login?redirect=/profile");

  const listings = await getMyListings(supabase, user.id);

  return <ProfileDashboard profile={profile} listings={listings} email={user.email} />;
}
