import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ListingDetail } from "@/components/ListingDetail";
import { createPublicClient } from "@/lib/supabase/public";
import { getCurrentUser } from "@/lib/auth";
import { getCoverImage, SITE_URL } from "@/lib/site";
import { formatPrice } from "@/lib/types";
import { getListingById, getRelatedListings } from "@/services/listings";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = createPublicClient();
  const listing = await getListingById(supabase, id);
  if (!listing) return { title: "Not found" };
  const cover = getCoverImage(listing.images);
  return {
    title: `${listing.brand} ${listing.model}`,
    description: `${formatPrice(listing.price)} · ${listing.condition}`,
    openGraph: {
      title: `${listing.brand} ${listing.model}`,
      images: cover ? [cover] : [],
      url: `${SITE_URL}/listing/${id}`,
    },
  };
}

export default async function ListingPage({ params }: Props) {
  const { id } = await params;
  const supabase = createPublicClient();
  const listing = await getListingById(supabase, id);
  if (!listing) notFound();
  const related = await getRelatedListings(supabase, listing);
  const user = await getCurrentUser();
  return <ListingDetail listing={listing} related={related} user={user} />;
}
