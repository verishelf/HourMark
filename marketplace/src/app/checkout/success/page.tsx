import Link from "next/link";

type Props = {
  searchParams: Promise<{ orderId?: string; listingId?: string }>;
};

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { orderId, listingId } = await searchParams;

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15 text-2xl text-green-400">
        ✓
      </div>
      <h1 className="mt-6 text-2xl font-semibold">Payment submitted</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Your payment is being processed securely. The seller will be notified to arrange
        authenticated delivery.
      </p>
      {orderId && (
        <p className="mt-4 text-xs text-muted-dim">Order {orderId.slice(0, 8).toUpperCase()}</p>
      )}
      <div className="mt-8 flex flex-col gap-3">
        {listingId && (
          <Link
            href={`/listing/${listingId}`}
            className="rounded-sm border border-border-light py-3 text-sm hover:border-gold hover:text-gold"
          >
            Back to listing
          </Link>
        )}
        <Link href="/search" className="text-sm text-gold hover:underline">
          Continue browsing
        </Link>
      </div>
    </div>
  );
}
