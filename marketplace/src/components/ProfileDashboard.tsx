import Link from "next/link";
import Image from "next/image";
import type { Listing, UserProfile } from "@/lib/types";
import { getUserDisplayName, getUserInitial } from "@/lib/user";
import { ProfileListings } from "@/components/ProfileListings";
import { WatchCard } from "@/components/WatchCard";

type Props = {
  profile: UserProfile;
  listings: Listing[];
  email?: string | null;
};

export function ProfileDashboard({ profile, listings, email }: Props) {
  const name = getUserDisplayName(profile);
  const initial = getUserInitial(profile);
  const active = listings.filter((l) => l.status === "active");
  const pending = listings.filter(
    (l) => l.authentication_status === "pending" || l.status === "draft"
  );

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8">
      <div className="flex flex-col gap-6 border-b border-border pb-8 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={name}
              width={80}
              height={80}
              unoptimized
              className="h-20 w-20 rounded-full border border-border-light object-cover"
            />
          ) : (
            <span className="flex h-20 w-20 items-center justify-center rounded-full border border-border-light bg-card text-2xl font-semibold text-gold">
              {initial}
            </span>
          )}
          <div>
            <h1 className="text-2xl font-semibold">{name}</h1>
            {profile.username && (
              <p className="text-sm text-muted">@{profile.username}</p>
            )}
            {email && <p className="mt-1 text-sm text-muted-dim">{email}</p>}
            {profile.bio && (
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted">{profile.bio}</p>
            )}
            {profile.verified && (
              <p className="mt-2 text-xs font-medium text-gold">Verified seller</p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/profile/edit"
            className="rounded-sm border border-border-light px-4 py-2 text-sm hover:border-gold hover:text-gold"
          >
            Edit profile
          </Link>
          <Link
            href="/sell"
            className="rounded-sm bg-gold px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
          >
            List a watch
          </Link>
          <Link
            href={`/seller/${profile.id}`}
            className="rounded-sm border border-border-light px-4 py-2 text-sm text-muted hover:text-foreground"
          >
            Public shop
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-sm border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Active listings</p>
          <p className="mt-1 text-2xl font-semibold">{active.length}</p>
        </div>
        <div className="rounded-sm border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Draft / pending</p>
          <p className="mt-1 text-2xl font-semibold">{pending.length}</p>
        </div>
        <div className="rounded-sm border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Total sales</p>
          <p className="mt-1 text-2xl font-semibold">{profile.total_sales ?? 0}</p>
        </div>
      </div>

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your listings</h2>
          <Link href="/sell" className="text-sm text-gold hover:underline">
            + Add listing
          </Link>
        </div>
        <ProfileListings listings={listings} />
      </section>

      {active.filter((l) => l.authentication_status === "auto_verified").length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-lg font-semibold">Live on marketplace</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {active
              .filter((l) => l.authentication_status === "auto_verified")
              .map((l) => (
                <WatchCard key={l.id} listing={l} />
              ))}
          </div>
        </section>
      )}
    </div>
  );
}
