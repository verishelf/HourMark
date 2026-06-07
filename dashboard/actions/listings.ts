"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function updateListingStatus(
  adminId: string,
  listingId: string,
  status: string,
  action: string
) {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("listings")
    .update({ status })
    .eq("id", listingId);

  if (error) return { error: error.message };

  await logAdminAction({
    adminId,
    action,
    resourceType: "listing",
    resourceId: listingId,
    details: { status },
  });

  revalidatePath("/listings");
  return { success: true };
}

export async function approveListing(adminId: string, listingId: string) {
  const supabase = createServiceClient();
  await supabase
    .from("listings")
    .update({ status: "active", authentication_status: "auto_verified" })
    .eq("id", listingId);

  await logAdminAction({ adminId, action: "approve_listing", resourceType: "listing", resourceId: listingId });
  revalidatePath("/listings");
  return { success: true };
}

export async function rejectListing(adminId: string, listingId: string) {
  return updateListingStatus(adminId, listingId, "archived", "reject_listing");
}

export async function featureListing(adminId: string, listingId: string, featured: boolean) {
  const supabase = createServiceClient();
  await supabase.from("listings").update({ featured }).eq("id", listingId);
  await logAdminAction({
    adminId,
    action: featured ? "feature_listing" : "unfeature_listing",
    resourceType: "listing",
    resourceId: listingId,
  });
  revalidatePath("/listings");
  return { success: true };
}

export async function deleteListing(adminId: string, listingId: string) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("listings").delete().eq("id", listingId);

  if (error) return { error: error.message };

  await logAdminAction({
    adminId,
    action: "delete_listing",
    resourceType: "listing",
    resourceId: listingId,
  });

  revalidatePath("/listings");
  revalidatePath("/");
  return { success: true };
}
