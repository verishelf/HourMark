"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteListingAction } from "@/app/profile/actions";
import type { Listing } from "@/lib/types";
import { formatPrice } from "@/lib/types";
import { getCoverImage } from "@/lib/site";

function statusLabel(status: string, auth?: string) {
  if (status === "active" && auth === "auto_verified") return "Live";
  if (status === "draft") return "Draft";
  if (status === "sold") return "Sold";
  if (auth === "pending") return "Pending verification";
  if (auth === "rejected") return "Verification failed";
  return status;
}

function statusClass(status: string, auth?: string) {
  if (status === "active" && auth === "auto_verified") return "text-gold";
  if (auth === "pending") return "text-amber-400";
  if (auth === "rejected") return "text-red-400";
  return "text-muted-dim";
}

type Props = { listings: Listing[] };

export function ProfileListings({ listings }: Props) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (listing: Listing) => {
    const label = `${listing.brand} ${listing.model}`.trim();
    if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) return;

    setError(null);
    setDeletingId(listing.id);
    try {
      const result = await deleteListingAction(listing.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  };

  if (listings.length === 0) {
    return (
      <p className="py-12 text-center text-muted">
        No listings yet.{" "}
        <Link href="/sell" className="text-gold hover:underline">
          List your first watch
        </Link>
      </p>
    );
  }

  return (
    <>
      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
      <div className="space-y-3">
        {listings.map((listing) => {
          const cover = getCoverImage(listing.images);
          const isLive =
            listing.status === "active" &&
            listing.authentication_status === "auto_verified";

          return (
            <div
              key={listing.id}
              className="flex flex-col gap-4 rounded-sm border border-border bg-card p-4 sm:flex-row sm:items-center"
            >
              <div className="flex flex-1 items-center gap-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-sm bg-[#050505]">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover} alt="" className="h-full w-full object-contain p-1" />
                  ) : null}
                </div>
                <div>
                  <p className="font-medium">
                    {listing.brand} {listing.model}
                  </p>
                  <p className="text-sm text-muted">{formatPrice(listing.price)}</p>
                  <p
                    className={`text-xs ${statusClass(listing.status, listing.authentication_status)}`}
                  >
                    {statusLabel(listing.status, listing.authentication_status)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {isLive && (
                  <Link
                    href={`/listing/${listing.id}`}
                    className="rounded-sm border border-border-light px-3 py-1.5 text-xs hover:border-gold"
                  >
                    View
                  </Link>
                )}
                <Link
                  href={`/profile/listings/${listing.id}/edit`}
                  className="rounded-sm border border-border-light px-3 py-1.5 text-xs hover:border-gold"
                >
                  Edit
                </Link>
                <button
                  type="button"
                  disabled={deletingId === listing.id}
                  onClick={() => handleDelete(listing)}
                  className="rounded-sm border border-red-400/40 px-3 py-1.5 text-xs text-red-400 hover:bg-red-400/10 disabled:opacity-60"
                >
                  {deletingId === listing.id ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
