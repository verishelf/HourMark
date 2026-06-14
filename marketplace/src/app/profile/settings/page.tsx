import { redirect } from "next/navigation";
import { SettingsClient } from "@/components/SettingsClient";
import { getCurrentUser } from "@/lib/auth";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login?redirect=/profile/settings");

  return <SettingsClient user={user} />;
}
