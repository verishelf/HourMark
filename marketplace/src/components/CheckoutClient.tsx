"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import type { Listing, ShippingDetails } from "@/lib/types";
import { formatPrice } from "@/lib/types";
import { calculateCommission, getStripePublishableKey } from "@/lib/stripe";
import { createPaymentIntentAction } from "@/app/checkout/actions";
import type { HeaderUser } from "@/lib/user";
import { getUserDisplayName } from "@/lib/user";
import { getCoverImage, SITE_URL } from "@/lib/site";

const stripePromise = getStripePublishableKey()
  ? loadStripe(getStripePublishableKey())
  : null;

type Props = {
  listing: Listing;
  user: HeaderUser;
};

function PaymentStep({
  orderId,
  listingId,
}: {
  clientSecret: string;
  orderId: string;
  listingId: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setError(null);
    setPending(true);
    try {
      const { error: stripeError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${SITE_URL}/checkout/success?orderId=${orderId}&listingId=${listingId}`,
        },
      });
      if (stripeError) setError(stripeError.message ?? "Payment failed");
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <PaymentElement options={{ layout: "tabs" }} />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || pending}
        className="w-full rounded-sm bg-gold py-3.5 text-sm font-semibold uppercase tracking-wider text-black disabled:opacity-60"
      >
        {pending ? "Processing…" : "Pay securely"}
      </button>
    </form>
  );
}

export function CheckoutClient({ listing, user }: Props) {
  const router = useRouter();
  const cover = getCoverImage(listing.images);
  const commission = calculateCommission(listing.price);

  const [step, setStep] = useState<"shipping" | "payment">("shipping");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  const [shipping, setShipping] = useState<ShippingDetails>({
    buyerName: user.full_name ?? getUserDisplayName(user),
    buyerEmail: user.email ?? "",
    buyerPhone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US",
  });

  const update = (field: keyof ShippingDetails, value: string) => {
    setShipping((prev) => ({ ...prev, [field]: value }));
  };

  const continueToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const result = await createPaymentIntentAction({
        listingId: listing.id,
        amountCents: listing.price,
        shipping,
      });
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      if (!result.clientSecret || !result.orderId) {
        setError("Invalid payment response.");
        return;
      }
      setClientSecret(result.clientSecret);
      setOrderId(result.orderId);
      setStep("payment");
    } finally {
      setPending(false);
    }
  };

  if (user.id === listing.seller_id) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-muted">You cannot purchase your own listing.</p>
        <button
          type="button"
          onClick={() => router.push(`/listing/${listing.id}`)}
          className="mt-4 text-sm text-gold hover:underline"
        >
          Back to listing
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[900px] px-4 py-8">
      <h1 className="text-2xl font-semibold">Checkout</h1>
      <p className="mt-1 text-sm text-muted">Escrow-protected payment via Stripe</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div>
          {step === "shipping" ? (
            <form onSubmit={continueToPayment} className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
                Shipping
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="text-xs text-muted">Full name</span>
                  <input
                    required
                    value={shipping.buyerName}
                    onChange={(e) => update("buyerName", e.target.value)}
                    className="mt-1 w-full rounded-sm border border-border-light bg-card px-3 py-2.5 text-sm outline-none focus:border-gold"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs text-muted">Email</span>
                  <input
                    type="email"
                    required
                    value={shipping.buyerEmail}
                    onChange={(e) => update("buyerEmail", e.target.value)}
                    className="mt-1 w-full rounded-sm border border-border-light bg-card px-3 py-2.5 text-sm outline-none focus:border-gold"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs text-muted">Phone</span>
                  <input
                    type="tel"
                    required
                    value={shipping.buyerPhone}
                    onChange={(e) => update("buyerPhone", e.target.value)}
                    className="mt-1 w-full rounded-sm border border-border-light bg-card px-3 py-2.5 text-sm outline-none focus:border-gold"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs text-muted">Street address</span>
                  <input
                    required
                    value={shipping.addressLine1}
                    onChange={(e) => update("addressLine1", e.target.value)}
                    className="mt-1 w-full rounded-sm border border-border-light bg-card px-3 py-2.5 text-sm outline-none focus:border-gold"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs text-muted">Apt / suite (optional)</span>
                  <input
                    value={shipping.addressLine2 ?? ""}
                    onChange={(e) => update("addressLine2", e.target.value)}
                    className="mt-1 w-full rounded-sm border border-border-light bg-card px-3 py-2.5 text-sm outline-none focus:border-gold"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-muted">City</span>
                  <input
                    required
                    value={shipping.city}
                    onChange={(e) => update("city", e.target.value)}
                    className="mt-1 w-full rounded-sm border border-border-light bg-card px-3 py-2.5 text-sm outline-none focus:border-gold"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-muted">State</span>
                  <input
                    required
                    value={shipping.state}
                    onChange={(e) => update("state", e.target.value)}
                    className="mt-1 w-full rounded-sm border border-border-light bg-card px-3 py-2.5 text-sm outline-none focus:border-gold"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-muted">ZIP</span>
                  <input
                    required
                    value={shipping.postalCode}
                    onChange={(e) => update("postalCode", e.target.value)}
                    className="mt-1 w-full rounded-sm border border-border-light bg-card px-3 py-2.5 text-sm outline-none focus:border-gold"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-muted">Country</span>
                  <input
                    value={shipping.country ?? "US"}
                    onChange={(e) => update("country", e.target.value)}
                    className="mt-1 w-full rounded-sm border border-border-light bg-card px-3 py-2.5 text-sm outline-none focus:border-gold"
                  />
                </label>
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-sm bg-gold py-3.5 text-sm font-semibold uppercase tracking-wider text-black disabled:opacity-60"
              >
                {pending ? "Preparing payment…" : "Continue to payment"}
              </button>
            </form>
          ) : clientSecret && orderId && stripePromise ? (
            <div>
              <button
                type="button"
                onClick={() => setStep("shipping")}
                className="mb-4 text-sm text-gold hover:underline"
              >
                ← Edit shipping
              </button>
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
                Payment
              </h2>
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <PaymentStep
                  clientSecret={clientSecret}
                  orderId={orderId}
                  listingId={listing.id}
                />
              </Elements>
            </div>
          ) : (
            <p className="text-sm text-red-400">Unable to load payment form.</p>
          )}
        </div>

        <aside className="h-fit rounded-sm border border-border bg-card p-5 lg:sticky lg:top-28">
          <div className="flex gap-4">
            {cover && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cover}
                alt=""
                className="h-20 w-20 shrink-0 rounded-sm object-contain bg-image-well p-1"
              />
            )}
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">{listing.brand}</p>
              <p className="font-medium">{listing.model}</p>
              <p className="mt-2 text-lg font-semibold">{formatPrice(listing.price)}</p>
            </div>
          </div>
          <dl className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between text-muted">
              <dt>Item price</dt>
              <dd>{formatPrice(listing.price)}</dd>
            </div>
            <div className="flex justify-between text-muted">
              <dt>Buyer protection</dt>
              <dd>Included</dd>
            </div>
            <div className="flex justify-between text-muted">
              <dt>Platform fee (seller)</dt>
              <dd>{formatPrice(commission)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
