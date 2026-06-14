import { redirect } from "next/navigation";
import { EditProfileForm } from "@/components/EditProfileForm";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getProfileById } from "@/services/profile";

export default async function EditProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login?redirect=/profile/edit");

  const supabase = await createClient();
  if (!supabase) redirect("/auth/login?redirect=/profile/edit");

  const profile = await getProfileById(supabase, user.id);
  if (!profile) redirect("/auth/login?redirect=/profile/edit");

  return <EditProfileForm profile={profile} />;
}
