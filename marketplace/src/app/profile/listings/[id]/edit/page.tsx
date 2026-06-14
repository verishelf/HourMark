import { redirect, notFound } from "next/navigation";
import { ListingForm } from "@/components/ListingForm";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getSellerListingById } from "@/services/seller-listings";

type Props = { params: Promise<{ id: string }> };

export default async function EditListingPage({ params }: Props) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/auth/login?redirect=/profile/listings/${id}/edit`);

  const supabase = await createClient();
  if (!supabase) redirect(`/auth/login?redirect=/profile/listings/${id}/edit`);

  const listing = await getSellerListingById(supabase, user.id, id);
  if (!listing) notFound();

  return <ListingForm listing={listing} />;
}
