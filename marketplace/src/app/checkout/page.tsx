import { redirect } from "next/navigation";
import { CheckoutClient } from "@/components/CheckoutClient";
import { getCurrentUser } from "@/lib/auth";
import { createPublicClient } from "@/lib/supabase/public";
import { getListingById } from "@/services/listings";
import { isStripeConfigured } from "@/lib/stripe";

type Props = { searchParams: Promise<{ listingId?: string }> };

export default async function CheckoutPage({ searchParams }: Props) {
  const { listingId } = await searchParams;
  if (!listingId) redirect("/search");

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/auth/login?redirect=${encodeURIComponent(`/checkout?listingId=${listingId}`)}`);
  }

  if (!isStripeConfigured()) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center text-muted">
        Stripe is not configured. Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to enable checkout.
      </div>
    );
  }

  const supabase = createPublicClient();
  const listing = await getListingById(supabase, listingId);
  if (!listing || listing.status !== "active") redirect("/search");
  if (listing.sale_mode === "auction") redirect(`/listing/${listingId}`);

  return <CheckoutClient listing={listing} user={user} />;
}
